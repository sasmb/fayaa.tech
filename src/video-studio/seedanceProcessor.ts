import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  failAndRefundLongVideoJob,
  STALE_STITCHING_MS,
  withFfmpegMutex,
  type LongVideoEntities,
  type LongVideoMediaOps,
} from "./longVideoProcessor";
import type { MuapiClient } from "./muapi";
import {
  SEEDANCE_EXTEND_CONTEXT_SEC,
  SEEDANCE_EXTEND_PATH,
  SEEDANCE_TEXT_TO_VIDEO_PATH,
} from "./seedancePlanning";

/** A Seedance chain makes its pieces one after another, so it gets more time than a split job. */
export const MAX_SEEDANCE_JOB_DURATION_MS = 90 * 60 * 1000;
/** An extend output longer than the asked length by more than this holds the input too. */
const COMBINED_OUTPUT_TOLERANCE_SEC = 1.5;

export interface SeedanceEntities extends LongVideoEntities {
  LongVideoSegment: LongVideoEntities["LongVideoSegment"] & {
    updateMany: (args: any) => Promise<{ count: number }>;
  };
}

export type SeedanceMediaOps = Pick<
  LongVideoMediaOps,
  "downloadToFile" | "probeDurationSec" | "splitSegment" | "stitchClips" | "uploadFinalVideo"
>;

/** One seed per job so every piece is drawn from the same seed. */
export function seedanceSeed(jobId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < jobId.length; i++) {
    hash ^= jobId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2147483647;
}

export function seedanceTextToVideoBody(job: {
  id: string;
  prompt: string | null;
  resolution: string;
  aspectRatio?: string | null;
}, durationSec: number): Record<string, unknown> {
  return {
    prompt: job.prompt ?? "",
    resolution: job.resolution,
    duration: Math.round(durationSec),
    aspect_ratio: job.aspectRatio || "16:9",
    seed: seedanceSeed(job.id),
  };
}

export function seedanceExtendBody(
  job: { id: string; prompt: string | null; resolution: string },
  contextVideoUrl: string,
  durationSec: number
): Record<string, unknown> {
  return {
    prompt: job.prompt ?? "",
    video_url: contextVideoUrl,
    resolution: job.resolution,
    duration: Math.round(durationSec),
    generate_audio: true,
    seed: seedanceSeed(job.id),
  };
}

async function failJob(
  job: any,
  entities: SeedanceEntities,
  errorMessage: string
): Promise<any> {
  await failAndRefundLongVideoJob({
    jobId: job.id,
    userId: job.userId,
    creditCost: job.creditCost,
    errorMessage,
    entities,
  });
  return entities.LongVideoJob.findUnique({ where: { id: job.id } });
}

/**
 * Submits the first piece (text-to-video). Called right after the job is created;
 * when it throws the caller refunds the job.
 */
export async function startSeedanceJob({
  job,
  entities,
  muapi,
}: {
  job: any;
  entities: SeedanceEntities;
  muapi: Pick<MuapiClient, "submit">;
}): Promise<void> {
  const segments = await entities.LongVideoSegment.findMany({
    where: { jobId: job.id },
    orderBy: { index: "asc" },
  });
  const first = segments[0];
  if (!first) throw new Error("Seedance job has no pieces.");
  const claimed = await entities.LongVideoSegment.updateMany({
    where: { id: first.id, status: "PENDING" },
    data: { status: "SUBMITTING" },
  });
  if (claimed.count === 0) return;
  const requestId = await muapi.submit(
    SEEDANCE_TEXT_TO_VIDEO_PATH,
    seedanceTextToVideoBody(job, first.durationSec)
  );
  await entities.LongVideoSegment.update({
    where: { id: first.id },
    data: { status: "PROCESSING", requestId },
  });
}

/** Cuts the last few seconds of the previous piece, uploads them, and starts an extend from them. */
async function submitExtendPiece({
  job,
  seg,
  previous,
  entities,
  muapi,
  mediaOps,
}: {
  job: any;
  seg: any;
  previous: any;
  entities: SeedanceEntities;
  muapi: Pick<MuapiClient, "submit">;
  mediaOps: SeedanceMediaOps;
}): Promise<void> {
  const claimed = await entities.LongVideoSegment.updateMany({
    where: { id: seg.id, status: "PENDING" },
    data: { status: "SUBMITTING" },
  });
  if (claimed.count === 0) return;

  const workDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `fayaa-seedance-${job.id}-${seg.index}-`)
  );
  try {
    const prevPath = path.join(workDir, "previous.mp4");
    const contextPath = path.join(workDir, "context.mp4");
    await mediaOps.downloadToFile(previous.outputVideoUrl, prevPath);
    const prevDuration = await mediaOps.probeDurationSec(prevPath);
    const contextSec = Math.min(SEEDANCE_EXTEND_CONTEXT_SEC, prevDuration);
    await withFfmpegMutex(() =>
      mediaOps.splitSegment({
        sourcePath: prevPath,
        outputPath: contextPath,
        startSec: Math.max(0, prevDuration - contextSec),
        durationSec: contextSec,
      })
    );
    const uploaded = await mediaOps.uploadFinalVideo({
      filePath: contextPath,
      fileName: `seedance-context-${job.id}-${seg.index}.mp4`,
      contentType: "video/mp4",
      userId: job.userId,
    });
    const requestId = await muapi.submit(
      SEEDANCE_EXTEND_PATH,
      seedanceExtendBody(job, uploaded.url, seg.durationSec)
    );
    await entities.LongVideoSegment.update({
      where: { id: seg.id },
      data: { status: "PROCESSING", requestId, clipSourceUrl: uploaded.url },
    });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

/** Downloads every piece, drops any repeated input from extend outputs, joins them, and saves the result. */
async function stitchSeedanceJob({
  job,
  segments,
  entities,
  mediaOps,
}: {
  job: any;
  segments: any[];
  entities: SeedanceEntities;
  mediaOps: SeedanceMediaOps;
}): Promise<any> {
  const stitchDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `fayaa-seedance-stitch-${job.id}-`)
  );
  try {
    const clipPaths: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;
      const rawPath = path.join(stitchDir, `raw-${String(i).padStart(3, "0")}.mp4`);
      await mediaOps.downloadToFile(seg.outputVideoUrl, rawPath);
      if (i === 0) {
        clipPaths.push(rawPath);
        continue;
      }
      // MuAPI may return the input plus the new part. Keep only the new part.
      const duration = await mediaOps.probeDurationSec(rawPath);
      if (duration > seg.durationSec + COMBINED_OUTPUT_TOLERANCE_SEC) {
        const trimmedPath = path.join(stitchDir, `piece-${String(i).padStart(3, "0")}.mp4`);
        await withFfmpegMutex(() =>
          mediaOps.splitSegment({
            sourcePath: rawPath,
            outputPath: trimmedPath,
            startSec: Math.max(0, duration - seg.durationSec),
            durationSec: seg.durationSec,
          })
        );
        clipPaths.push(trimmedPath);
      } else {
        clipPaths.push(rawPath);
      }
    }

    let finalPath = clipPaths[0]!;
    if (clipPaths.length > 1) {
      finalPath = path.join(stitchDir, `final-${job.id}.mp4`);
      const outputPath = finalPath;
      await withFfmpegMutex(() =>
        mediaOps.stitchClips({
          clipPaths,
          concatListPath: path.join(stitchDir, "concat-list.txt"),
          outputPath,
        })
      );
    }

    const uploaded = await mediaOps.uploadFinalVideo({
      filePath: finalPath,
      fileName: `fayaa-seedance-${job.id}.mp4`,
      contentType: "video/mp4",
      userId: job.userId,
    });
    return await entities.LongVideoJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        outputVideoUrl: uploaded.url,
        outputStorageKey: uploaded.s3Key,
        completedCount: segments.length,
      },
    });
  } catch (err: unknown) {
    return failJob(
      job,
      entities,
      err instanceof Error ? err.message : "Failed to join and save the Seedance video."
    );
  } finally {
    await fs.rm(stitchDir, { recursive: true, force: true });
  }
}

/**
 * Moves a Seedance job forward by one step: polls the piece in flight, starts the
 * next piece when the previous one is done, and joins the pieces at the end.
 * Safe to call from the background job and from the status query at the same time.
 */
export async function syncSeedanceJob({
  job,
  entities,
  muapi,
  mediaOps,
}: {
  job: any;
  entities: SeedanceEntities;
  muapi: Pick<MuapiClient, "submit" | "result">;
  mediaOps: SeedanceMediaOps;
}): Promise<any> {
  if (job.status === "COMPLETED" || job.status === "FAILED") return job;

  if (job.status === "STITCHING") {
    const sinceUpdateMs = Date.now() - new Date(job.updatedAt ?? job.createdAt).getTime();
    if (sinceUpdateMs <= STALE_STITCHING_MS) return job;
    const claimed = await entities.LongVideoJob.updateMany({
      where: { id: job.id, status: "STITCHING" },
      data: { status: "FAILED", error: "Joining was interrupted. Credits refunded." },
    });
    if (claimed.count > 0) {
      return failJob(job, entities, "Joining was interrupted. Credits refunded.");
    }
    return entities.LongVideoJob.findUnique({ where: { id: job.id } });
  }

  if (Date.now() - new Date(job.createdAt).getTime() > MAX_SEEDANCE_JOB_DURATION_MS) {
    return failJob(job, entities, "Seedance video timed out before every piece finished.");
  }

  const segments = await entities.LongVideoSegment.findMany({
    where: { jobId: job.id },
    orderBy: { index: "asc" },
  });

  // 1. Poll the piece in flight.
  for (const seg of segments) {
    if (seg.status !== "PROCESSING" || !seg.requestId) continue;
    let remote;
    try {
      remote = await muapi.result(seg.requestId);
    } catch {
      continue; // Transient; try again on the next tick.
    }
    if (remote.status === "completed" && remote.videoUrl) {
      const done = await entities.LongVideoSegment.updateMany({
        where: { id: seg.id, status: "PROCESSING" },
        data: { status: "COMPLETED", outputVideoUrl: remote.videoUrl },
      });
      if (done.count > 0) {
        seg.status = "COMPLETED";
        seg.outputVideoUrl = remote.videoUrl;
      }
    } else if (remote.status === "failed") {
      const detail = remote.error || `Piece ${seg.index + 1} of ${segments.length} failed.`;
      await entities.LongVideoSegment.update({
        where: { id: seg.id },
        data: { status: "FAILED", error: detail },
      });
      return failJob(job, entities, detail);
    }
  }

  const completed = segments.filter((s) => s.status === "COMPLETED" && s.outputVideoUrl);
  if (completed.length !== job.completedCount) {
    await entities.LongVideoJob.update({
      where: { id: job.id },
      data: { completedCount: completed.length },
    });
  }

  // 2. Start the next piece once the one before it is done.
  if (completed.length < segments.length) {
    const inFlight = segments.some(
      (s) => s.status === "PROCESSING" || s.status === "SUBMITTING"
    );
    const next = segments.find((s) => s.status === "PENDING");
    if (!inFlight && next) {
      const previous = segments[next.index - 1];
      try {
        if (!previous) {
          await startSeedanceJob({ job, entities, muapi });
        } else if (previous.status === "COMPLETED" && previous.outputVideoUrl) {
          await submitExtendPiece({ job, seg: next, previous, entities, muapi, mediaOps });
        }
      } catch (err: unknown) {
        return failJob(
          job,
          entities,
          err instanceof Error ? err.message : `Could not start piece ${next.index + 1}.`
        );
      }
    }
    return entities.LongVideoJob.findUnique({ where: { id: job.id } });
  }

  // 3. Every piece is done: take the join lock once.
  const locked = await entities.LongVideoJob.updateMany({
    where: { id: job.id, status: "PROCESSING_CLIPS" },
    data: { status: "STITCHING", completedCount: segments.length },
  });
  if (locked.count === 0) {
    return entities.LongVideoJob.findUnique({ where: { id: job.id } });
  }
  return stitchSeedanceJob({ job, segments, entities, mediaOps });
}
