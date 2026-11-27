import fs from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import { formatLongVideoProgressLabel } from "./longVideoPlanning";
import { createMuapiClient, parseMuapiBalance, parseMuapiResult } from "./muapi";
import {
  estimateSeedancePlan,
  splitSeedancePieces,
  SEEDANCE_EXTEND_PATH,
  SEEDANCE_TEXT_TO_VIDEO_PATH,
} from "./seedancePlanning";
import {
  MAX_SEEDANCE_JOB_DURATION_MS,
  seedanceSeed,
  startSeedanceJob,
  syncSeedanceJob,
  type SeedanceEntities,
  type SeedanceMediaOps,
} from "./seedanceProcessor";

describe("Seedance planning", () => {
  it("keeps up to 30s as one piece and splits longer videos into even pieces", () => {
    expect(splitSeedancePieces(10)).toEqual([10]);
    expect(splitSeedancePieces(30)).toEqual([30]);
    expect(splitSeedancePieces(31)).toEqual([16, 15]);
    expect(splitSeedancePieces(75)).toEqual([25, 25, 25]);
    expect(splitSeedancePieces(120)).toEqual([30, 30, 30, 30]);
  });

  it("clamps to 4s to 120s", () => {
    expect(splitSeedancePieces(1)).toEqual([4]);
    expect(splitSeedancePieces(500).reduce((a, b) => a + b, 0)).toBe(120);
  });

  it("prices the first piece at the full rate and extends at 65% of context plus new seconds", () => {
    const single = estimateSeedancePlan({ totalDurationSec: 10, resolution: "720p" });
    expect(single.pieces).toHaveLength(1);
    expect(single.usd).toBeCloseTo(3.4);
    expect(single.credits).toBe(102);

    const chain = estimateSeedancePlan({ totalDurationSec: 60, resolution: "720p" });
    expect(chain.pieces.map((p) => p.kind)).toEqual(["text", "extend"]);
    expect(chain.pieces[1]!.contextSec).toBe(5);
    // 30s * 0.34 + 0.65 * 0.34 * (5 + 30)
    expect(chain.usd).toBeCloseTo(10.2 + 7.735);
    expect(chain.credits).toBe(Math.ceil((10.2 + 7.735) * 30));
  });

  it("defaults unknown resolutions to 720p", () => {
    expect(estimateSeedancePlan({ totalDurationSec: 5, resolution: "4k" }).resolution).toBe(
      "720p"
    );
  });
});

describe("MuAPI response parsing", () => {
  it("reads outputs[0], output.video_url and output strings", () => {
    expect(parseMuapiResult({ status: "completed", outputs: ["https://a/v.mp4"] })).toEqual({
      status: "completed",
      videoUrl: "https://a/v.mp4",
    });
    expect(
      parseMuapiResult({ data: { status: "completed", output: { video_url: "https://b" } } })
    ).toEqual({ status: "completed", videoUrl: "https://b" });
    expect(parseMuapiResult({ status: "completed", output: "https://c" }).videoUrl).toBe(
      "https://c"
    );
  });

  it("maps failures and in-progress states", () => {
    expect(parseMuapiResult({ status: "failed", error: "bad prompt" })).toEqual({
      status: "failed",
      error: "bad prompt",
    });
    expect(parseMuapiResult({ status: "completed" }).status).toBe("failed");
    expect(parseMuapiResult({ status: "processing" }).status).toBe("processing");
    expect(parseMuapiResult({}).status).toBe("processing");
  });

  it("reads balances from several shapes", () => {
    expect(parseMuapiBalance({ balance: 12.5 })).toBe(12.5);
    expect(parseMuapiBalance({ data: { balance: "3.20" } })).toBe(3.2);
    expect(parseMuapiBalance({ nothing: true })).toBeNull();
  });

  it("submits with the x-api-key header and reports the balance header", async () => {
    const onBalance = vi.fn();
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ request_id: "req-1" }), {
        status: 200,
        headers: { "X-Account-Balance": "42.5" },
      })
    );
    const client = createMuapiClient("key-123", fetchImpl as any, onBalance);
    await expect(client.submit(SEEDANCE_TEXT_TO_VIDEO_PATH, { prompt: "x" })).resolves.toBe(
      "req-1"
    );
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://api.muapi.ai/api/v1/${SEEDANCE_TEXT_TO_VIDEO_PATH}`);
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("key-123");
    expect(onBalance).toHaveBeenCalledWith(42.5);
  });

  it("turns a 402 from MuAPI into a friendly message", async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ detail: "Insufficient balance" }), { status: 402 })
    );
    const client = createMuapiClient("k", fetchImpl as any);
    await expect(client.submit("x", {})).rejects.toThrow(/temporarily unavailable/);
  });
});

type Seg = {
  id: string;
  jobId: string;
  index: number;
  startSec: number;
  durationSec: number;
  status: string;
  requestId?: string | null;
  outputVideoUrl?: string | null;
  clipSourceUrl?: string | null;
  error?: string | null;
};

function makeStore(durations: number[], overrides: Record<string, unknown> = {}) {
  const job: any = {
    id: "job-1",
    userId: "user-1",
    status: "PROCESSING_CLIPS",
    variant: "seedance",
    resolution: "720p",
    aspectRatio: "9:16",
    prompt: "a fox running through snow",
    segmentCount: durations.length,
    completedCount: 0,
    creditCost: 300,
    creditsRefunded: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  let start = 0;
  const segments: Seg[] = durations.map((d, index) => {
    const seg = { id: `seg-${index}`, jobId: job.id, index, startSec: start, durationSec: d, status: "PENDING" };
    start += d;
    return seg;
  });
  const refunds: number[] = [];
  const matches = (row: any, where: any) =>
    Object.entries(where).every(([k, v]) => row[k] === v);
  const entities: SeedanceEntities = {
    User: {
      update: vi.fn(async ({ data }: any) => {
        refunds.push(data.credits.increment);
      }),
    },
    LongVideoJob: {
      findUnique: vi.fn(async () => ({ ...job })),
      update: vi.fn(async ({ data }: any) => {
        Object.assign(job, data);
        return { ...job };
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        if (!matches(job, where)) return { count: 0 };
        Object.assign(job, data);
        return { count: 1 };
      }),
    },
    LongVideoSegment: {
      findMany: vi.fn(async () => segments.map((s) => ({ ...s }))),
      update: vi.fn(async ({ where, data }: any) => {
        const seg = segments.find((s) => s.id === where.id)!;
        Object.assign(seg, data);
        return { ...seg };
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        const seg = segments.find((s) => matches(s, where));
        if (!seg) return { count: 0 };
        Object.assign(seg, data);
        return { count: 1 };
      }),
    },
  };
  return { job, segments, refunds, entities };
}

function makeMediaOps(probe: (path: string) => number) {
  const ops = {
    downloadToFile: vi.fn(async (_url: string, dest: string) => {
      await fs.writeFile(dest, "x");
    }),
    probeDurationSec: vi.fn(async (p: string) => probe(p)),
    splitSegment: vi.fn(async ({ outputPath }: { outputPath: string }) => {
      await fs.writeFile(outputPath, "x");
    }),
    stitchClips: vi.fn(async ({ outputPath }: { outputPath: string }) => {
      await fs.writeFile(outputPath, "x");
    }),
    uploadFinalVideo: vi.fn(async ({ fileName }: { fileName: string }) => ({
      s3Key: `k/${fileName}`,
      url: `https://s3/${fileName}`,
    })),
  };
  return ops satisfies SeedanceMediaOps;
}

describe("Seedance chain", () => {
  it("starts with text-to-video using the job's prompt, aspect ratio and a stable seed", async () => {
    const { job, segments, entities } = makeStore([10]);
    const submit = vi.fn(async () => "req-0");
    await startSeedanceJob({ job, entities, muapi: { submit } });
    expect(submit).toHaveBeenCalledWith(SEEDANCE_TEXT_TO_VIDEO_PATH, {
      prompt: "a fox running through snow",
      resolution: "720p",
      duration: 10,
      aspect_ratio: "9:16",
      seed: seedanceSeed("job-1"),
    });
    expect(segments[0]).toMatchObject({ status: "PROCESSING", requestId: "req-0" });

    // A second start does not submit twice.
    await startSeedanceJob({ job, entities, muapi: { submit } });
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("extends from the last 5 seconds of the previous piece, then joins and trims repeated input", async () => {
    const { job, segments, entities } = makeStore([30, 30]);
    const submit = vi.fn(async (p: string) => (p === SEEDANCE_TEXT_TO_VIDEO_PATH ? "req-0" : "req-1"));
    const results: Record<string, any> = {
      "req-0": { status: "completed", videoUrl: "https://mu/0.mp4" },
      "req-1": { status: "processing" },
    };
    const muapi = { submit, result: vi.fn(async (id: string) => results[id]) };
    // Piece 0 is 30s; the extend output holds 5s of input plus 30s new.
    const mediaOps = makeMediaOps((p) => (p.includes("raw-001") ? 35 : 30));

    await startSeedanceJob({ job, entities, muapi });

    // Tick 1: piece 0 done, piece 1 starts from a 5s tail.
    await syncSeedanceJob({ job: { ...job }, entities, muapi, mediaOps });
    expect(segments[0]!.status).toBe("COMPLETED");
    expect(mediaOps.splitSegment).toHaveBeenCalledWith(
      expect.objectContaining({ startSec: 25, durationSec: 5 })
    );
    expect(submit).toHaveBeenLastCalledWith(
      SEEDANCE_EXTEND_PATH,
      expect.objectContaining({
        video_url: "https://s3/seedance-context-job-1-1.mp4",
        duration: 30,
        generate_audio: true,
        seed: seedanceSeed("job-1"),
      })
    );
    expect(segments[1]).toMatchObject({ status: "PROCESSING", requestId: "req-1" });
    expect(job.completedCount).toBe(1);

    // Tick 2: still running, nothing new is submitted.
    await syncSeedanceJob({ job: { ...job }, entities, muapi, mediaOps });
    expect(submit).toHaveBeenCalledTimes(2);

    // Tick 3: piece 1 done, pieces are joined and the 5s of repeated input is cut.
    results["req-1"] = { status: "completed", videoUrl: "https://mu/1.mp4" };
    const done = await syncSeedanceJob({ job: { ...job }, entities, muapi, mediaOps });
    expect(mediaOps.splitSegment).toHaveBeenLastCalledWith(
      expect.objectContaining({ startSec: 5, durationSec: 30 })
    );
    expect(mediaOps.stitchClips).toHaveBeenCalledTimes(1);
    expect(done).toMatchObject({
      status: "COMPLETED",
      outputVideoUrl: "https://s3/fayaa-seedance-job-1.mp4",
      completedCount: 2,
    });
  });

  it("saves a single piece without joining", async () => {
    const { job, entities } = makeStore([10]);
    const muapi = {
      submit: vi.fn(async () => "req-0"),
      result: vi.fn(async () => ({ status: "completed" as const, videoUrl: "https://mu/0.mp4" })),
    };
    const mediaOps = makeMediaOps(() => 10);
    await startSeedanceJob({ job, entities, muapi });
    const done = await syncSeedanceJob({ job: { ...job }, entities, muapi, mediaOps });
    expect(mediaOps.stitchClips).not.toHaveBeenCalled();
    expect(done.status).toBe("COMPLETED");
  });

  it("fails and refunds once when a piece fails", async () => {
    const { job, refunds, entities } = makeStore([30, 30]);
    const muapi = {
      submit: vi.fn(async () => "req-0"),
      result: vi.fn(async () => ({ status: "failed" as const, error: "content policy" })),
    };
    await startSeedanceJob({ job, entities, muapi });
    const out = await syncSeedanceJob({ job: { ...job }, entities, muapi, mediaOps: makeMediaOps(() => 30) });
    expect(out).toMatchObject({ status: "FAILED", error: "content policy" });
    expect(refunds).toEqual([300]);
    await syncSeedanceJob({ job: { ...job }, entities, muapi, mediaOps: makeMediaOps(() => 30) });
    expect(refunds).toEqual([300]);
  });

  it("fails and refunds when the next piece cannot be submitted", async () => {
    const { job, refunds, entities } = makeStore([30, 30]);
    const muapi = {
      submit: vi
        .fn()
        .mockResolvedValueOnce("req-0")
        .mockRejectedValueOnce(new Error("Seedance is temporarily unavailable.")),
      result: vi.fn(async () => ({ status: "completed" as const, videoUrl: "https://mu/0.mp4" })),
    };
    await startSeedanceJob({ job, entities, muapi });
    const out = await syncSeedanceJob({ job: { ...job }, entities, muapi, mediaOps: makeMediaOps(() => 30) });
    expect(out.status).toBe("FAILED");
    expect(refunds).toEqual([300]);
  });

  it("times out old jobs with a refund", async () => {
    const { job, refunds, entities } = makeStore([30], {
      createdAt: new Date(Date.now() - MAX_SEEDANCE_JOB_DURATION_MS - 1000),
    });
    const muapi = { submit: vi.fn(), result: vi.fn() };
    const out = await syncSeedanceJob({ job: { ...job }, entities, muapi, mediaOps: makeMediaOps(() => 30) });
    expect(out.status).toBe("FAILED");
    expect(refunds).toEqual([300]);
    expect(muapi.result).not.toHaveBeenCalled();
  });
});

describe("Seedance progress labels", () => {
  it("talks about pieces, not frame swapping", () => {
    expect(
      formatLongVideoProgressLabel({
        status: "PROCESSING_CLIPS",
        segmentCount: 3,
        completedCount: 1,
        variant: "seedance",
      })
    ).toBe("Generating (1/3 pieces ready)");
    expect(
      formatLongVideoProgressLabel({ status: "STITCHING", segmentCount: 1, completedCount: 1, variant: "seedance" })
    ).toBe("Saving video…");
  });
});
