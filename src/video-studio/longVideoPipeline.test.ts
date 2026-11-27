import { describe, expect, it, vi } from "vitest";

import {
  computeLongVideoSegments,
  estimateLongVideoPlan,
  formatLongVideoProgressLabel,
  maxClipDurationSec,
  summarizeLongVideoPieces,
  segmentCredits,
} from "./longVideoPlanning";
import {
  carryoverReferenceImages,
  ffmpegListingHasAudio,
  frameCarryoverEnabled,
  keepLongVideoPreviewOnly,
  parseFfmpegDurationSec,
  submitRemainingLongVideoSegments,
  processLongVideoJobSplit,
  syncLongVideoJob,
  MAX_SEGMENT_ATTEMPTS,
  STALE_STITCHING_MS,
  validateExternalMediaUrl,
  withFfmpegMutex,
  type LongVideoEntities,
  type LongVideoMediaOps,
  type LongVideoPlatformClient,
} from "./longVideoProcessor";

describe("longVideoPlanning segment splitting & dynamic credit estimation", () => {
  it("keeps videos <= 30s as a single clip", () => {
    expect(computeLongVideoSegments(25)).toEqual([
      { index: 0, startSec: 0, durationSec: 25 },
    ]);
  });

  it("cuts a 2-minute (120s) video into four exact 30s segments", () => {
    const segs = computeLongVideoSegments(120);
    expect(segs).toEqual([
      { index: 0, startSec: 0, durationSec: 30 },
      { index: 1, startSec: 30, durationSec: 30 },
      { index: 2, startSec: 60, durationSec: 30 },
      { index: 3, startSec: 90, durationSec: 30 },
    ]);
  });

  it("supports > 2 minute videos dynamically into N sequential segments", () => {
    const segs = computeLongVideoSegments(165, 10);
    expect(segs).toEqual([
      { index: 0, startSec: 10, durationSec: 30 },
      { index: 1, startSec: 40, durationSec: 30 },
      { index: 2, startSec: 70, durationSec: 30 },
      { index: 3, startSec: 100, durationSec: 30 },
      { index: 4, startSec: 130, durationSec: 30 },
      { index: 5, startSec: 160, durationSec: 15 },
    ]);
  });

  it("balances trailing remainders below 4s so every clip satisfies Genjutsu's 4s–30s constraint", () => {
    const segs = computeLongVideoSegments(122);
    expect(segs).toEqual([
      { index: 0, startSec: 0, durationSec: 30 },
      { index: 1, startSec: 30, durationSec: 30 },
      { index: 2, startSec: 60, durationSec: 30 },
      { index: 3, startSec: 90, durationSec: 28 },
      { index: 4, startSec: 118, durationSec: 4 },
    ]);
    for (const seg of segs) {
      expect(seg.durationSec).toBeGreaterThanOrEqual(4);
      expect(seg.durationSec).toBeLessThanOrEqual(30);
    }
  });

  it("caps Light clips at 15s and Pro clips at 30s", () => {
    expect(maxClipDurationSec("light")).toBe(15);
    expect(maxClipDurationSec("higgsfield/genjutsu-light/motion-transfer/v1.0")).toBe(15);
    expect(maxClipDurationSec("pro")).toBe(30);
    expect(maxClipDurationSec("higgsfield/genjutsu/motion-transfer/v1.0")).toBe(30);
  });

  it("splits a 25s Light video into two clips instead of letting Light cut it at 15s", () => {
    const plan = estimateLongVideoPlan({ totalDurationSec: 25, variant: "light" });
    expect(plan.isLongForm).toBe(true);
    expect(plan.segments).toEqual([
      { index: 0, startSec: 0, durationSec: 15 },
      { index: 1, startSec: 15, durationSec: 10 },
    ]);
    for (const seg of plan.segments) {
      expect(seg.durationSec).toBeLessThanOrEqual(15);
    }
  });

  it("keeps a 15s Light video and a 25s Pro video as one clip", () => {
    expect(estimateLongVideoPlan({ totalDurationSec: 15, variant: "light" }).segmentCount).toBe(1);
    expect(estimateLongVideoPlan({ totalDurationSec: 25, variant: "pro" }).segmentCount).toBe(1);
  });

  it("covers every second of a 2-minute Light video with 15s clips", () => {
    const segs = computeLongVideoSegments(120, 0, 15);
    expect(segs).toHaveLength(8);
    const covered = segs.reduce((sum, s) => sum + s.durationSec, 0);
    expect(covered).toBe(120);
    segs.forEach((s, i) => expect(s.startSec).toBe(i * 15));
  });

  it("calculates upfront credits across all segments based on resolution and variant", () => {
    const plan480Light = estimateLongVideoPlan({
      totalDurationSec: 165,
      resolution: "480p",
      variant: "light",
    });
    expect(plan480Light.isLongForm).toBe(true);
    expect(plan480Light.segmentCount).toBe(11);
    expect(plan480Light.billableSeconds).toBe(165);
    // 11 * ceil(15*0.025*30=11.25 -> 12) = 132
    expect(plan480Light.credits).toBe(132);

    const plan720Pro = estimateLongVideoPlan({
      totalDurationSec: 120,
      resolution: "720p",
      variant: "pro",
    });
    expect(plan720Pro.segmentCount).toBe(4);
    expect(plan720Pro.credits).toBeGreaterThan(plan480Light.credits);
  });

  it("summarizes stored segments into ordered per-piece progress, hiding skipped ones", () => {
    const pieces = summarizeLongVideoPieces([
      { index: 2, status: "PENDING", startSec: 30, durationSec: 15 },
      { index: 0, status: "COMPLETED", startSec: 0, durationSec: 15 },
      { index: 1, status: "PROCESSING", startSec: 15, durationSec: 15, attempts: 2 },
      { index: 3, status: "FAILED", startSec: 45, durationSec: 10 },
      { index: 4, status: "SKIPPED", startSec: 55, durationSec: 4 },
    ]);
    expect(pieces).toEqual([
      { index: 0, status: "ready", startSec: 0, durationSec: 15 },
      { index: 1, status: "rendering", startSec: 15, durationSec: 15, attempts: 2 },
      { index: 2, status: "pending", startSec: 30, durationSec: 15 },
      { index: 3, status: "failed", startSec: 45, durationSec: 10 },
    ]);
  });

  it("formats user-facing progress labels without exposing intermediate segment chaos", () => {
    expect(
      formatLongVideoProgressLabel({
        status: "PROCESSING_CLIPS",
        segmentCount: 4,
        completedCount: 3,
      })
    ).toBe("Swapping frames (3/4 clips ready)");
    expect(
      formatLongVideoProgressLabel({
        status: "STITCHING",
        segmentCount: 4,
        completedCount: 4,
      })
    ).toBe("Assembling final 4-clip video…");
  });
});

describe("FFmpeg duration parser, SSRF guard, and low-RAM mutex", () => {
  it("parses HH:MM:SS.xx durations from ffmpeg stderr", () => {
    const sample =
      "  Duration: 00:02:45.32, start: 0.000000, bitrate: 2450 kb/s";
    expect(parseFfmpegDurationSec(sample)).toBeCloseTo(165.32, 2);
    expect(parseFfmpegDurationSec("Duration: N/A")).toBeNull();
  });

  it("detects whether a source has an audio stream", () => {
    expect(
      ffmpegListingHasAudio(
        "  Stream #0:0[0x1](und): Video: h264\n  Stream #0:1[0x2](und): Audio: aac (LC), 44100 Hz"
      )
    ).toBe(true);
    expect(ffmpegListingHasAudio("  Stream #0:0[0x1](und): Video: h264")).toBe(false);
  });

  it("rejects non-HTTPS and local/private IP media URLs", async () => {
    await expect(validateExternalMediaUrl("http://example.com/a.mp4")).rejects.toThrow();
    await expect(validateExternalMediaUrl("https://localhost/a.mp4")).rejects.toThrow();
    await expect(validateExternalMediaUrl("https://127.0.0.1/a.mp4")).rejects.toThrow();
    await expect(validateExternalMediaUrl("https://192.168.1.10/a.mp4")).rejects.toThrow();
  });

  it("serializes FFmpeg executions cleanly under withFfmpegMutex", async () => {
    const order: string[] = [];
    await Promise.all([
      withFfmpegMutex(async () => {
        order.push("start-1");
        await new Promise((r) => setTimeout(r, 15));
        order.push("end-1");
      }),
      withFfmpegMutex(async () => {
        order.push("start-2");
        order.push("end-2");
      }),
    ]);
    expect(order).toEqual(["start-1", "end-1", "start-2", "end-2"]);
  });
});

describe("backend split, uniform Genjutsu submission, stitch, and atomic refunds", () => {
  function createMockState(
    overrides?: Partial<{ status: string; segmentCount: number; variant: string }>
  ) {
    const job: any = {
      id: "job-1",
      userId: "user-1",
      status: overrides?.status ?? "SPLITTING",
      variant: overrides?.variant ?? "pro",
      resolution: "720p",
      prompt: "Swap subject into anime knight @Image1",
      sourceVideoUrl: "https://cdn.example.com/2min.mp4",
      referenceImageUrls: ["https://cdn.example.com/ref1.png"],
      trimStartSec: 0,
      totalDurationSec: 120,
      segmentCount: overrides?.segmentCount ?? 4,
      completedCount: 0,
      creditCost: 180,
      creditsRefunded: false,
      outputVideoUrl: null,
      outputStorageKey: null,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const segments = Array.from({ length: job.segmentCount }, (_, index) => ({
      id: `seg-${index}`,
      jobId: job.id,
      index,
      startSec: index * 30,
      durationSec: 30,
      clipSourceUrl: null as string | null,
      requestId: null as string | null,
      status: "PENDING",
      outputVideoUrl: null as string | null,
      error: null as string | null,
    }));

    const userCredits = { count: 20 };

    const entities: LongVideoEntities = {
      User: {
        update: vi.fn(async ({ data }) => {
          if (data.credits?.increment) {
            userCredits.count += data.credits.increment;
          }
          return { id: "user-1", credits: userCredits.count };
        }),
      },
      LongVideoJob: {
        findUnique: vi.fn(async () => ({ ...job })),
        update: vi.fn(async ({ data }) => {
          Object.assign(job, data);
          return { ...job };
        }),
        updateMany: vi.fn(async ({ where, data }) => {
          if (where.status && job.status !== where.status) return { count: 0 };
          if (where.creditsRefunded !== undefined && job.creditsRefunded !== where.creditsRefunded) {
            return { count: 0 };
          }
          Object.assign(job, data);
          return { count: 1 };
        }),
      },
      LongVideoSegment: {
        findMany: vi.fn(async () => segments),
        update: vi.fn(async ({ where, data }) => {
          const target = segments.find((s) => s.id === where.id)!;
          Object.assign(target, data);
          return target;
        }),
      },
    };

    return { job, segments, entities, userCredits };
  }

  it("cuts source into 4×30s Pro clips and submits identical prompt & references across every clip", async () => {
    const { job, segments, entities } = createMockState();
    let seq = 0;

    const platformClient: LongVideoPlatformClient = {
      createUpload: vi.fn(),
      submit: vi.fn(async (_model, _input) => ({
        status: "queued",
        requestId: `req-${++seq}`,
        statusUrl: "https://api.higgsfield.ai/status",
        cancelUrl: "https://api.higgsfield.ai/cancel",
      })),
      status: vi.fn(),
      cancel: vi.fn(),
    };

    const mediaOps: LongVideoMediaOps = {
      downloadToFile: vi.fn(async () => {}),
      probeDurationSec: vi.fn(async () => 120),
      splitSegment: vi.fn(async () => {}),
      uploadClipFile: vi.fn(async (filePath) => `https://upload.hf/${filePath.split("/").pop()}`),
      stitchClips: vi.fn(),
      uploadFinalVideo: vi.fn(),
    };

    await processLongVideoJobSplit({
      jobId: job.id,
      entities,
      platformClient,
      mediaOps,
    });

    expect(mediaOps.splitSegment).toHaveBeenCalledTimes(4);
    expect(platformClient.submit).toHaveBeenCalledTimes(4);

    for (let i = 0; i < 4; i++) {
      expect(platformClient.submit).toHaveBeenNthCalledWith(
        i + 1,
        "higgsfield/genjutsu/motion-transfer/v1.0",
        expect.objectContaining({
          prompt: "Swap subject into anime knight @Image1",
          image_urls: ["https://cdn.example.com/ref1.png"],
          resolution: "720p",
        })
      );
      expect(segments[i]!.status).toBe("PROCESSING");
      expect(segments[i]!.requestId).toBe(`req-${i + 1}`);
    }

    expect(job.status).toBe("PROCESSING_CLIPS");
  });

  it("refunds credits atomically and cancels active segments when clip submission fails", async () => {
    const { job, entities, userCredits } = createMockState();
    let count = 0;

    const platformClient: LongVideoPlatformClient = {
      createUpload: vi.fn(),
      submit: vi.fn(async () => {
        count += 1;
        if (count >= 3) throw new Error("Upstream Genjutsu quota error");
        return {
          status: "queued",
          requestId: `req-${count}`,
          statusUrl: "s",
          cancelUrl: "c",
        };
      }),
      status: vi.fn(),
      cancel: vi.fn(async () => {}),
    };

    const mediaOps: LongVideoMediaOps = {
      downloadToFile: vi.fn(async () => {}),
      probeDurationSec: vi.fn(async () => 120),
      splitSegment: vi.fn(async () => {}),
      uploadClipFile: vi.fn(async () => "https://upload.hf/clip.mp4"),
      stitchClips: vi.fn(),
      uploadFinalVideo: vi.fn(),
    };

    await processLongVideoJobSplit({
      jobId: job.id,
      entities,
      platformClient,
      mediaOps,
    });

    expect(job.status).toBe("FAILED");
    expect(job.error).toContain("Upstream Genjutsu quota error");
    expect(job.creditsRefunded).toBe(true);
    expect(userCredits.count).toBe(200);
    expect(platformClient.cancel).toHaveBeenCalledTimes(2);
  });

  it("stitches completed ordered clips cleanly into one final stored MP4", async () => {
    const { job, segments, entities } = createMockState({ status: "PROCESSING_CLIPS" });
    segments.forEach((s, idx) => {
      s.status = "PROCESSING";
      s.requestId = `req-${idx}`;
    });

    const platformClient = {
      status: vi.fn(async (requestId: string) => ({
        status: "completed",
        requestId,
        video: { url: `https://hf.cdn/${requestId}.mp4` },
      })),
      cancel: vi.fn(),
    };

    const downloadedUrls: string[] = [];
    const mediaOps: LongVideoMediaOps = {
      downloadToFile: vi.fn(async (url) => {
        downloadedUrls.push(url);
      }),
      probeDurationSec: vi.fn(),
      splitSegment: vi.fn(),
      uploadClipFile: vi.fn(),
      stitchClips: vi.fn(async ({ clipPaths }) => {
        expect(clipPaths).toHaveLength(4);
      }),
      uploadFinalVideo: vi.fn(async () => ({
        s3Key: "user-1/final-job-1.mp4",
        url: "https://r2.example.com/user-1/final-job-1.mp4",
      })),
    };

    const updated = await syncLongVideoJob({
      job,
      entities,
      platformClient,
      mediaOps,
    });

    expect(downloadedUrls).toEqual([
      "https://hf.cdn/req-0.mp4",
      "https://hf.cdn/req-1.mp4",
      "https://hf.cdn/req-2.mp4",
      "https://hf.cdn/req-3.mp4",
    ]);
    expect(mediaOps.stitchClips).toHaveBeenCalledTimes(1);
    expect(mediaOps.uploadFinalVideo).toHaveBeenCalledTimes(1);
    expect(updated.status).toBe("COMPLETED");
    expect(updated.outputVideoUrl).toBe("https://r2.example.com/user-1/final-job-1.mp4");
    expect(updated.outputStorageKey).toBe("user-1/final-job-1.mp4");
  });

  it("cancels remaining segments and refunds once if a downstream segment fails", async () => {
    const { job, segments, entities, userCredits } = createMockState({
      status: "PROCESSING_CLIPS",
    });
    segments.forEach((s, idx) => {
      s.status = "PROCESSING";
      s.requestId = `req-${idx}`;
    });

    const platformClient = {
      status: vi.fn(async (requestId: string) => {
        if (requestId === "req-1") {
          return { status: "failed", requestId, error: "Safety check failed" };
        }
        return { status: "in_progress", requestId };
      }),
      cancel: vi.fn(async () => {}),
    };

    const mediaOps: LongVideoMediaOps = {
      downloadToFile: vi.fn(),
      probeDurationSec: vi.fn(),
      splitSegment: vi.fn(),
      uploadClipFile: vi.fn(),
      stitchClips: vi.fn(),
      uploadFinalVideo: vi.fn(),
    };

    const result = await syncLongVideoJob({
      job,
      entities,
      platformClient,
      mediaOps,
    });

    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("Safety check failed");
    expect(userCredits.count).toBe(200);
    expect(platformClient.cancel).toHaveBeenCalledTimes(3);
  });
  it("cuts a Light job into 15s clips so Light never truncates a clip", async () => {
    const { job, segments, entities } = createMockState({
      variant: "light",
      segmentCount: 8,
    });
    let seq = 0;
    const platformClient: LongVideoPlatformClient = {
      createUpload: vi.fn(),
      submit: vi.fn(async () => ({
        status: "queued",
        requestId: `req-${++seq}`,
        statusUrl: "s",
        cancelUrl: "c",
      })),
      status: vi.fn(),
      cancel: vi.fn(),
    };
    const mediaOps: LongVideoMediaOps = {
      downloadToFile: vi.fn(async () => {}),
      probeDurationSec: vi.fn(async () => 120),
      splitSegment: vi.fn(async () => {}),
      uploadClipFile: vi.fn(async () => "https://upload.hf/clip.mp4"),
      stitchClips: vi.fn(),
      uploadFinalVideo: vi.fn(),
    };

    await processLongVideoJobSplit({ jobId: job.id, entities, platformClient, mediaOps });

    expect(mediaOps.splitSegment).toHaveBeenCalledTimes(8);
    for (const call of (mediaOps.splitSegment as any).mock.calls) {
      expect(call[0].durationSec).toBeLessThanOrEqual(15);
    }
    expect(platformClient.submit).toHaveBeenCalledWith(
      "higgsfield/genjutsu-light/motion-transfer/v1.0",
      expect.anything()
    );
    expect(segments.every((s) => s.status === "PROCESSING")).toBe(true);
    expect(job.status).toBe("PROCESSING_CLIPS");
  });

  it("skips planned segments past the real end of a shorter source so the job can finish", async () => {
    const { job, segments, entities } = createMockState();
    const platformClient: LongVideoPlatformClient = {
      createUpload: vi.fn(),
      submit: vi.fn(async () => ({ status: "queued", requestId: `req-${Math.random()}`, statusUrl: "s", cancelUrl: "c" })),
      status: vi.fn(),
      cancel: vi.fn(),
    };
    const mediaOps: LongVideoMediaOps = {
      downloadToFile: vi.fn(async () => {}),
      probeDurationSec: vi.fn(async () => 60),
      splitSegment: vi.fn(async () => {}),
      uploadClipFile: vi.fn(async () => "https://upload.hf/clip.mp4"),
      stitchClips: vi.fn(),
      uploadFinalVideo: vi.fn(),
    };

    await processLongVideoJobSplit({ jobId: job.id, entities, platformClient, mediaOps });

    expect(platformClient.submit).toHaveBeenCalledTimes(2);
    expect(segments.map((s) => s.status)).toEqual([
      "PROCESSING",
      "PROCESSING",
      "SKIPPED",
      "SKIPPED",
    ]);
    expect(job.segmentCount).toBe(2);
  });

  it("refunds a job left in STITCHING after a server restart", async () => {
    const { job, entities, userCredits } = createMockState({ status: "STITCHING" });
    job.updatedAt = new Date(Date.now() - STALE_STITCHING_MS - 1000);
    const platformClient = { status: vi.fn(), cancel: vi.fn() };
    const mediaOps = {} as LongVideoMediaOps;

    const result = await syncLongVideoJob({ job, entities, platformClient, mediaOps });

    expect(result.status).toBe("FAILED");
    expect(job.creditsRefunded).toBe(true);
    expect(userCredits.count).toBe(200);
  });

  it("leaves a job that is actively stitching alone", async () => {
    const { job, entities, userCredits } = createMockState({ status: "STITCHING" });
    const platformClient = { status: vi.fn(), cancel: vi.fn() };
    const mediaOps = {} as LongVideoMediaOps;

    const result = await syncLongVideoJob({ job, entities, platformClient, mediaOps });

    expect(result.status).toBe("STITCHING");
    expect(userCredits.count).toBe(20);
  });
  it("lays the source audio from the trimmed range over the stitched video", async () => {
    const { job, segments, entities } = createMockState({ status: "PROCESSING_CLIPS" });
    job.trimStartSec = 10;
    segments.forEach((s, idx) => {
      s.status = "PROCESSING";
      s.requestId = `req-${idx}`;
      s.startSec = 10 + idx * 30;
    });
    const platformClient = {
      status: vi.fn(async (requestId: string) => ({
        status: "completed",
        requestId,
        video: { url: `https://hf.cdn/${requestId}.mp4` },
      })),
      cancel: vi.fn(),
    };
    const downloaded: string[] = [];
    const mediaOps: LongVideoMediaOps = {
      downloadToFile: vi.fn(async (url) => {
        downloaded.push(url);
      }),
      probeDurationSec: vi.fn(),
      splitSegment: vi.fn(),
      uploadClipFile: vi.fn(),
      stitchClips: vi.fn(async () => {}),
      muxSourceAudio: vi.fn(async () => true),
      uploadFinalVideo: vi.fn(async () => ({ s3Key: "k", url: "https://r2/k" })),
    };

    const updated = await syncLongVideoJob({ job, entities, platformClient, mediaOps });

    expect(downloaded).toContain("https://cdn.example.com/2min.mp4");
    expect(mediaOps.muxSourceAudio).toHaveBeenCalledWith(
      expect.objectContaining({ startSec: 10, durationSec: 120 })
    );
    const uploadArgs = (mediaOps.uploadFinalVideo as any).mock.calls[0][0];
    expect(uploadArgs.filePath).toMatch(/-audio\.mp4$/);
    expect(updated.status).toBe("COMPLETED");
  });

  it("still delivers the stitched video if adding source audio fails", async () => {
    const { job, segments, entities } = createMockState({ status: "PROCESSING_CLIPS" });
    segments.forEach((s, idx) => {
      s.status = "PROCESSING";
      s.requestId = `req-${idx}`;
    });
    const platformClient = {
      status: vi.fn(async (requestId: string) => ({
        status: "completed",
        requestId,
        video: { url: `https://hf.cdn/${requestId}.mp4` },
      })),
      cancel: vi.fn(),
    };
    const mediaOps: LongVideoMediaOps = {
      downloadToFile: vi.fn(async () => {}),
      probeDurationSec: vi.fn(),
      splitSegment: vi.fn(),
      uploadClipFile: vi.fn(),
      stitchClips: vi.fn(async () => {}),
      muxSourceAudio: vi.fn(async () => {
        throw new Error("ffmpeg exploded");
      }),
      uploadFinalVideo: vi.fn(async () => ({ s3Key: "k", url: "https://r2/k" })),
    };

    const updated = await syncLongVideoJob({ job, entities, platformClient, mediaOps });

    const uploadArgs = (mediaOps.uploadFinalVideo as any).mock.calls[0][0];
    expect(uploadArgs.filePath).not.toMatch(/-audio\.mp4$/);
    expect(updated.status).toBe("COMPLETED");
  });

  function failingClipSetup(remoteStatus: string, attempts = 1) {
    const state = createMockState({ status: "PROCESSING_CLIPS" });
    state.segments.forEach((s: any, idx) => {
      s.status = "PROCESSING";
      s.requestId = `req-${idx}`;
      s.clipSourceUrl = `https://upload.hf/clip-${idx}.mp4`;
      s.attempts = idx === 1 ? attempts : 1;
    });
    const platformClient = {
      status: vi.fn(async (requestId: string) =>
        requestId === "req-1"
          ? { status: remoteStatus, requestId, error: "Upstream hiccup" }
          : { status: "in_progress", requestId }
      ),
      cancel: vi.fn(async () => {}),
      submit: vi.fn(async () => ({
        status: "queued",
        requestId: "req-1-retry",
        statusUrl: "s",
        cancelUrl: "c",
      })),
    };
    const mediaOps = {} as LongVideoMediaOps;
    return { ...state, platformClient, mediaOps };
  }

  it("re-renders a failed clip from its uploaded piece instead of failing the whole job", async () => {
    const { job, segments, entities, platformClient, mediaOps, userCredits } =
      failingClipSetup("failed");

    const result = await syncLongVideoJob({ job, entities, platformClient, mediaOps });

    expect(platformClient.submit).toHaveBeenCalledWith(
      "higgsfield/genjutsu/motion-transfer/v1.0",
      expect.objectContaining({ video_url: "https://upload.hf/clip-1.mp4" })
    );
    expect(segments[1]!.status).toBe("PROCESSING");
    expect(segments[1]!.requestId).toBe("req-1-retry");
    expect((segments[1] as any).attempts).toBe(2);
    expect(result.status).toBe("PROCESSING_CLIPS");
    expect(platformClient.cancel).not.toHaveBeenCalled();
    expect(userCredits.count).toBe(20);
  });

  it("does not retry a clip blocked by the content filter", async () => {
    const { job, entities, platformClient, mediaOps, userCredits } = failingClipSetup("nsfw");

    const result = await syncLongVideoJob({ job, entities, platformClient, mediaOps });

    expect(platformClient.submit).not.toHaveBeenCalled();
    expect(result.status).toBe("FAILED");
    expect(userCredits.count).toBe(200);
  });

  it("fails and refunds the job once a clip has used all its attempts", async () => {
    const { job, entities, platformClient, mediaOps, userCredits } = failingClipSetup(
      "failed",
      MAX_SEGMENT_ATTEMPTS
    );

    const result = await syncLongVideoJob({ job, entities, platformClient, mediaOps });

    expect(platformClient.submit).not.toHaveBeenCalled();
    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("Upstream hiccup");
    expect(userCredits.count).toBe(200);
  });

  describe("preview first piece", () => {
    function queuedClient() {
      let seq = 0;
      return {
        createUpload: vi.fn(),
        submit: vi.fn(async () => ({
          status: "queued",
          requestId: `req-${++seq}`,
          statusUrl: "s",
          cancelUrl: "c",
        })),
        status: vi.fn(),
        cancel: vi.fn(async () => {}),
      } satisfies LongVideoPlatformClient;
    }

    it("cuts every piece but renders only the first", async () => {
      const { job, segments, entities } = createMockState();
      job.previewFirst = true;
      const platformClient = queuedClient();
      const mediaOps: LongVideoMediaOps = {
        downloadToFile: vi.fn(async () => {}),
        probeDurationSec: vi.fn(async () => 120),
        splitSegment: vi.fn(async () => {}),
        uploadClipFile: vi.fn(async (p) => `https://upload.hf/${p.split("/").pop()}`),
        stitchClips: vi.fn(),
        uploadFinalVideo: vi.fn(),
      };

      await processLongVideoJobSplit({ jobId: job.id, entities, platformClient, mediaOps });

      expect(mediaOps.splitSegment).toHaveBeenCalledTimes(4);
      expect(platformClient.submit).toHaveBeenCalledTimes(1);
      expect(segments[0]!.status).toBe("PROCESSING");
      for (const seg of segments.slice(1)) {
        expect(seg.status).toBe("PENDING");
        expect(seg.requestId).toBeNull();
        expect(seg.clipSourceUrl).toMatch(/^https:\/\/upload\.hf\/clip-/);
      }
    });

    it("pauses for approval once the first piece is ready", async () => {
      const { job, segments, entities } = createMockState({ status: "PROCESSING_CLIPS" });
      job.previewFirst = true;
      segments[0]!.status = "PROCESSING";
      segments[0]!.requestId = "req-0";
      const platformClient = {
        status: vi.fn(async (requestId: string) => ({
          status: "completed",
          requestId,
          video: { url: "https://hf.cdn/piece-1.mp4" },
        })),
        cancel: vi.fn(),
      };

      const result = await syncLongVideoJob({
        job,
        entities,
        platformClient,
        mediaOps: {} as LongVideoMediaOps,
      });

      expect(result.status).toBe("AWAITING_APPROVAL");
      expect(result.previewVideoUrl).toBe("https://hf.cdn/piece-1.mp4");
    });

    it("renders the remaining pieces after approval", async () => {
      const { job, segments, entities } = createMockState({ status: "AWAITING_APPROVAL" });
      segments[0]!.status = "COMPLETED";
      segments.slice(1).forEach((s, i) => (s.clipSourceUrl = `https://upload.hf/clip-${i + 1}.mp4`));
      const platformClient = queuedClient();

      await submitRemainingLongVideoSegments({ job, entities, platformClient });

      expect(platformClient.submit).toHaveBeenCalledTimes(3);
      expect(job.status).toBe("PROCESSING_CLIPS");
      expect(job.approvedAt).toBeInstanceOf(Date);
      expect(segments.slice(1).every((s) => s.status === "PROCESSING")).toBe(true);
    });

    it("leaves the rest to the one-at-a-time carryover flow when carryover is on", async () => {
      const { job, segments, entities } = createMockState({ status: "AWAITING_APPROVAL" });
      job.frameCarryover = true;
      segments[0]!.status = "COMPLETED";
      segments.slice(1).forEach((s, i) => (s.clipSourceUrl = `https://upload.hf/clip-${i + 1}.mp4`));
      const platformClient = queuedClient();

      await submitRemainingLongVideoSegments({ job, entities, platformClient });

      expect(platformClient.submit).not.toHaveBeenCalled();
      expect(job.status).toBe("PROCESSING_CLIPS");
      expect(segments.slice(1).every((s) => s.status === "PENDING")).toBe(true);
    });

    it("rolls back a partly submitted approval", async () => {
      const { job, segments, entities } = createMockState({ status: "AWAITING_APPROVAL" });
      segments[0]!.status = "COMPLETED";
      segments.slice(1).forEach((s, i) => (s.clipSourceUrl = `https://upload.hf/clip-${i + 1}.mp4`));
      const platformClient = queuedClient();
      let calls = 0;
      platformClient.submit.mockImplementation(async () => {
        calls += 1;
        if (calls === 3) throw new Error("quota");
        return { status: "queued", requestId: `req-${calls}`, statusUrl: "s", cancelUrl: "c" };
      });

      await expect(
        submitRemainingLongVideoSegments({ job, entities, platformClient })
      ).rejects.toThrow("quota");
      expect(platformClient.cancel).toHaveBeenCalledTimes(2);
      expect(segments.slice(1).every((s) => s.status === "PENDING" && !s.requestId)).toBe(true);
    });

    it("keeps the preview as the final video when the user declines the rest", async () => {
      const { job, entities } = createMockState({ status: "AWAITING_APPROVAL" });
      job.previewVideoUrl = "https://hf.cdn/piece-1.mp4";
      const mediaOps = {
        downloadToFile: vi.fn(async () => {}),
        uploadFinalVideo: vi.fn(async () => ({ s3Key: "k", url: "https://r2/k" })),
      };

      const result = await keepLongVideoPreviewOnly({ job, entities, mediaOps });

      expect(mediaOps.downloadToFile).toHaveBeenCalledWith(
        "https://hf.cdn/piece-1.mp4",
        expect.any(String)
      );
      expect(result.status).toBe("COMPLETED");
      expect(result.outputStorageKey).toBe("k");
    });

    it("prices each piece the same way as the upfront estimate", () => {
      const plan = estimateLongVideoPlan({ totalDurationSec: 50, resolution: "720p", variant: "light" });
      const sum = plan.segments.reduce(
        (acc, seg) => acc + segmentCredits(seg.durationSec, "720p", "light"),
        0
      );
      expect(sum).toBe(plan.credits);
    });
  });

  describe("frame carryover (experimental)", () => {
    it("is off unless LONG_VIDEO_FRAME_CARRYOVER=true", () => {
      const prev = process.env.LONG_VIDEO_FRAME_CARRYOVER;
      delete process.env.LONG_VIDEO_FRAME_CARRYOVER;
      expect(frameCarryoverEnabled()).toBe(false);
      process.env.LONG_VIDEO_FRAME_CARRYOVER = "true";
      expect(frameCarryoverEnabled()).toBe(true);
      if (prev === undefined) delete process.env.LONG_VIDEO_FRAME_CARRYOVER;
      else process.env.LONG_VIDEO_FRAME_CARRYOVER = prev;
    });

    it("keeps the user's references first and only adds the frame if a slot is free", () => {
      expect(carryoverReferenceImages(["a"], "frame")).toEqual(["a", "frame"]);
      expect(carryoverReferenceImages(["a", "b", "c", "d"], "frame")).toEqual(["a", "b", "c", "d"]);
      expect(carryoverReferenceImages(["a"], null)).toEqual(["a"]);
    });

    it("starts only the first piece at split time", async () => {
      const { job, segments, entities } = createMockState();
      job.frameCarryover = true;
      let seq = 0;
      const platformClient: LongVideoPlatformClient = {
        createUpload: vi.fn(),
        submit: vi.fn(async () => ({ status: "queued", requestId: `req-${++seq}`, statusUrl: "s", cancelUrl: "c" })),
        status: vi.fn(),
        cancel: vi.fn(),
      };
      const mediaOps: LongVideoMediaOps = {
        downloadToFile: vi.fn(async () => {}),
        probeDurationSec: vi.fn(async () => 120),
        splitSegment: vi.fn(async () => {}),
        uploadClipFile: vi.fn(async (p) => `https://upload.hf/${p.split("/").pop()}`),
        stitchClips: vi.fn(),
        uploadFinalVideo: vi.fn(),
      };

      await processLongVideoJobSplit({ jobId: job.id, entities, platformClient, mediaOps });

      expect(platformClient.submit).toHaveBeenCalledTimes(1);
      expect(segments.slice(1).every((s) => s.status === "PENDING" && s.clipSourceUrl)).toBe(true);
    });

    function carryState() {
      const state = createMockState({ status: "PROCESSING_CLIPS" });
      state.job.frameCarryover = true;
      state.segments.forEach((s, i) => (s.clipSourceUrl = `https://upload.hf/clip-${i}.mp4`));
      state.segments[0]!.status = "PROCESSING";
      state.segments[0]!.requestId = "req-0";
      const platformClient = {
        status: vi.fn(async (requestId: string) => ({
          status: "completed",
          requestId,
          video: { url: `https://hf.cdn/${requestId}.mp4` },
        })),
        cancel: vi.fn(),
        submit: vi.fn(async () => ({ status: "queued", requestId: "req-1", statusUrl: "s", cancelUrl: "c" })),
        createUpload: vi.fn(),
      };
      return { ...state, platformClient };
    }

    it("starts the next piece with the previous piece's last frame as an extra reference", async () => {
      const { job, segments, entities, platformClient } = carryState();
      const mediaOps = {
        carryoverFrame: vi.fn(async () => "https://upload.hf/last-frame.png"),
      } as unknown as LongVideoMediaOps;

      const result = await syncLongVideoJob({ job, entities, platformClient, mediaOps });

      expect(mediaOps.carryoverFrame).toHaveBeenCalledWith(
        expect.objectContaining({ videoUrl: "https://hf.cdn/req-0.mp4" })
      );
      expect(platformClient.submit).toHaveBeenCalledWith(
        "higgsfield/genjutsu/motion-transfer/v1.0",
        expect.objectContaining({
          video_url: "https://upload.hf/clip-1.mp4",
          image_urls: ["https://cdn.example.com/ref1.png", "https://upload.hf/last-frame.png"],
        })
      );
      expect(segments[1]!.status).toBe("PROCESSING");
      expect(segments[2]!.status).toBe("PENDING");
      expect(result.status).toBe("PROCESSING_CLIPS");
    });

    it("still starts the next piece if grabbing the frame fails", async () => {
      const { job, segments, entities, platformClient } = carryState();
      const mediaOps = {
        carryoverFrame: vi.fn(async () => {
          throw new Error("ffmpeg failed");
        }),
      } as unknown as LongVideoMediaOps;

      await syncLongVideoJob({ job, entities, platformClient, mediaOps });

      expect(platformClient.submit).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ image_urls: ["https://cdn.example.com/ref1.png"] })
      );
      expect(segments[1]!.status).toBe("PROCESSING");
    });
  });
});
