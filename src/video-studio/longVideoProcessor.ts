import { execFile } from "node:child_process";
import dns from "node:dns/promises";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

import { MAX_FILE_SIZE_BYTES } from "../file-upload/validation";
import {
  computeLongVideoSegments,
  maxClipDurationSec,
  MIN_CLIP_DURATION_SEC,
} from "./longVideoPlanning";
import type { GenerationStatus, QueuedGeneration } from "./hf/generation/platform";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

const FETCH_TIMEOUT_MS = 120_000;
const FFMPEG_TIMEOUT_MS = 240_000;
const MAX_CONCURRENT_SUBMISSIONS = 4;
const MAX_LONG_JOB_DURATION_MS = 60 * 60 * 1000; // 60 minutes
// A clip that fails upstream is re-rendered automatically before the job is failed,
// so one flaky clip doesn't throw away (and refund) every other finished clip.
export const MAX_SEGMENT_ATTEMPTS = 3;
// Content-filter rejections and user cancels won't change on a retry.
const NON_RETRYABLE_SEGMENT_STATUSES = new Set(["nsfw", "canceled"]);

export function genjutsuModelPath(variant?: string | null): string {
  return variant === "pro"
    ? "higgsfield/genjutsu/motion-transfer/v1.0"
    : "higgsfield/genjutsu-light/motion-transfer/v1.0";
}

/** Genjutsu accepts up to 4 reference images per request. */
export const MAX_GENJUTSU_REFERENCES = 4;
// Carryover renders pieces one after another, so allow more time per piece.
const CARRYOVER_MS_PER_PIECE = 15 * 60 * 1000;

/** Whether new long-video jobs should use experimental frame carryover. */
export function frameCarryoverEnabled(): boolean {
  return process.env.LONG_VIDEO_FRAME_CARRYOVER?.trim().toLowerCase() === "true";
}

/**
 * Reference images for piece N under frame carryover: the user's references stay
 * first (prompts point at @Image1), then the previous piece's last frame if a slot
 * is free.
 */
export function carryoverReferenceImages(
  references: string[],
  previousFrameUrl: string | null | undefined
): string[] {
  if (!previousFrameUrl || references.length >= MAX_GENJUTSU_REFERENCES) {
    return references;
  }
  return [...references, previousFrameUrl];
}

// A stitch (download clips + ffmpeg concat + upload) finishes well within this window.
// A job still marked STITCHING after it was most likely interrupted by a server restart.
export const STALE_STITCHING_MS = 20 * 60 * 1000; // 20 minutes

// In-process mutex so heavy FFmpeg split/concat work runs 1 at a time inside 1024 MB RAM.
let ffmpegMutexChain: Promise<void> = Promise.resolve();

export async function withFfmpegMutex<T>(task: () => Promise<T>): Promise<T> {
  let release!: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = ffmpegMutexChain;
  ffmpegMutexChain = nextLock;
  await previous;
  try {
    return await task();
  } finally {
    release();
  }
}

export function resolveFfmpegBinary(): string {
  const installer = require("@ffmpeg-installer/ffmpeg") as { path?: string };
  if (!installer?.path) {
    throw new Error("FFmpeg binary is not available on server.");
  }
  return installer.path;
}

export function parseFfmpegDurationSec(stderr: string): number | null {
  const match = /Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/i.exec(stderr);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const total = hours * 3600 + minutes * 60 + seconds;
  return Number.isFinite(total) && total > 0 ? total : null;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const norm = ip.toLowerCase();
    if (norm === "::1" || norm === "::") return true;
    if (norm.startsWith("fe80:") || norm.startsWith("fc") || norm.startsWith("fd")) {
      return true;
    }
    if (norm.startsWith("::ffff:")) {
      return isPrivateIp(norm.slice("::ffff:".length));
    }
    return false;
  }
  return true;
}

export async function validateExternalMediaUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid media URL.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Only https media URLs are supported.");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Disallowed media host.");
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) {
      throw new Error("Private media host IP is not allowed.");
    }
    return parsed;
  }
  const resolved = await dns.lookup(host, { all: true });
  if (!resolved.length || resolved.some((entry) => isPrivateIp(entry.address))) {
    throw new Error("Resolved media host is not public.");
  }
  return parsed;
}

export async function downloadMediaToFile(
  rawUrl: string,
  destPath: string
): Promise<void> {
  const safeUrl = await validateExternalMediaUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(safeUrl, {
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch media (${response.status}).`);
    }

    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `Source media exceeds ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB limit.`
      );
    }

    let totalBytes = 0;
    const nodeStream = Readable.fromWeb(response.body as any);
    nodeStream.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_FILE_SIZE_BYTES) {
        nodeStream.destroy(new Error("Source media exceeded maximum size limit."));
      }
    });

    await pipeline(nodeStream, createWriteStream(destPath));
  } finally {
    clearTimeout(timeout);
  }
}

export async function probeVideoDurationSec(filePath: string): Promise<number> {
  const ffmpeg = resolveFfmpegBinary();
  try {
    const { stderr } = await execFileAsync(ffmpeg, ["-i", filePath], {
      timeout: 30_000,
    });
    const parsed = parseFfmpegDurationSec(stderr || "");
    if (parsed !== null) return parsed;
  } catch (err: any) {
    // ffmpeg exits non-zero when -i has no output target; stderr still holds duration metadata.
    const parsed = parseFfmpegDurationSec(String(err?.stderr ?? ""));
    if (parsed !== null) return parsed;
  }
  throw new Error("Could not inspect uploaded video duration.");
}

export async function splitSegmentWithFfmpeg({
  sourcePath,
  outputPath,
  startSec,
  durationSec,
}: {
  sourcePath: string;
  outputPath: string;
  startSec: number;
  durationSec: number;
}): Promise<void> {
  const ffmpeg = resolveFfmpegBinary();
  await execFileAsync(
    ffmpeg,
    [
      "-y",
      "-ss",
      startSec.toFixed(2),
      "-i",
      sourcePath,
      "-t",
      durationSec.toFixed(2),
      "-threads",
      "1",
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-ar",
      "44100",
      "-ac",
      "2",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { timeout: FFMPEG_TIMEOUT_MS }
  );
}

/** True when ffmpeg's stream listing (stderr of `ffmpeg -i`) contains an audio stream. */
export function ffmpegListingHasAudio(stderr: string): boolean {
  return /Stream #\d+:\d+[^\n]*: Audio:/.test(stderr);
}

async function fileHasAudioStream(filePath: string): Promise<boolean> {
  const ffmpeg = resolveFfmpegBinary();
  try {
    const { stderr } = await execFileAsync(ffmpeg, ["-i", filePath], {
      timeout: 30_000,
    });
    return ffmpegListingHasAudio(stderr || "");
  } catch (err: any) {
    // ffmpeg exits non-zero when -i has no output target; stderr still lists streams.
    return ffmpegListingHasAudio(String(err?.stderr ?? ""));
  }
}

/**
 * Lays the original source audio (from the same trimmed range the clips were cut
 * from) over the stitched video. Genjutsu re-renders the picture, so without this
 * the final long video loses the music or voice of the upload.
 * Returns false and leaves `outputPath` unwritten when the source has no audio.
 */
export async function muxSourceAudioWithFfmpeg({
  videoPath,
  sourcePath,
  startSec,
  durationSec,
  outputPath,
}: {
  videoPath: string;
  sourcePath: string;
  startSec: number;
  durationSec: number;
  outputPath: string;
}): Promise<boolean> {
  if (!(await fileHasAudioStream(sourcePath))) return false;
  const ffmpeg = resolveFfmpegBinary();
  await execFileAsync(
    ffmpeg,
    [
      "-y",
      "-i",
      videoPath,
      "-ss",
      Math.max(0, startSec).toFixed(2),
      "-t",
      durationSec.toFixed(2),
      "-i",
      sourcePath,
      "-threads",
      "1",
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-ar",
      "44100",
      "-ac",
      "2",
      "-shortest",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { timeout: FFMPEG_TIMEOUT_MS }
  );
  return true;
}

/** Saves the final frame of a video as a PNG (used for frame carryover between pieces). */
export async function extractLastFrameWithFfmpeg({
  videoPath,
  outputPath,
}: {
  videoPath: string;
  outputPath: string;
}): Promise<void> {
  const ffmpeg = resolveFfmpegBinary();
  await execFileAsync(
    ffmpeg,
    [
      "-y",
      "-sseof",
      "-0.5",
      "-i",
      videoPath,
      "-threads",
      "1",
      "-update",
      "1",
      "-frames:v",
      "1",
      outputPath,
    ],
    { timeout: 60_000 }
  );
  await fs.access(outputPath);
}

export async function stitchClipsWithFfmpeg({
  clipPaths,
  concatListPath,
  outputPath,
}: {
  clipPaths: string[];
  concatListPath: string;
  outputPath: string;
}): Promise<void> {
  const ffmpeg = resolveFfmpegBinary();
  const listContent = clipPaths
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join("\n");
  await fs.writeFile(concatListPath, listContent, "utf8");

  // Fast, <30MB RAM stream copy concat when all Genjutsu clips match encoding parameters.
  try {
    await execFileAsync(
      ffmpeg,
      [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        concatListPath,
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        outputPath,
      ],
      { timeout: FFMPEG_TIMEOUT_MS }
    );
    return;
  } catch {
    // Fall back to low-memory single-thread normalization if clip stream headers diverge.
    await execFileAsync(
      ffmpeg,
      [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        concatListPath,
        "-threads",
        "1",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-movflags",
        "+faststart",
        outputPath,
      ],
      { timeout: FFMPEG_TIMEOUT_MS * 2 }
    );
  }
}

export async function uploadClipFileToPlatform(
  filePath: string,
  createUpload: (contentType: string) => Promise<{
    upload_url: string;
    public_url: string;
    upload_headers: Record<string, string>;
  }>,
  contentType = "video/mp4"
): Promise<string> {
  const ticket = await createUpload(contentType);
  const stat = await fs.stat(filePath);
  const res = await fetch(ticket.upload_url, {
    method: "PUT",
    headers: {
      ...ticket.upload_headers,
      "Content-Length": String(stat.size),
    },
    body: createReadStream(filePath) as any,
    duplex: "half",
  } as any);
  if (!res.ok) {
    throw new Error(`Clip segment upload failed (${res.status}).`);
  }
  return ticket.public_url;
}

export interface LongVideoPlatformClient {
  createUpload: (contentType: unknown) => Promise<{
    upload_url: string;
    public_url: string;
    content_type: string;
    upload_headers: Record<string, string>;
  }>;
  submit: (
    model: string,
    input: Record<string, unknown>
  ) => Promise<QueuedGeneration>;
  status: (requestId: string) => Promise<GenerationStatus>;
  cancel: (requestId: string) => Promise<void>;
}

export interface LongVideoEntities {
  User: {
    update: (args: any) => Promise<any>;
  };
  LongVideoJob: {
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    updateMany: (args: any) => Promise<{ count: number }>;
  };
  LongVideoSegment: {
    findMany: (args: any) => Promise<any[]>;
    update: (args: any) => Promise<any>;
  };
}

export interface LongVideoMediaOps {
  downloadToFile: (url: string, destPath: string) => Promise<void>;
  probeDurationSec: (filePath: string) => Promise<number>;
  splitSegment: (args: {
    sourcePath: string;
    outputPath: string;
    startSec: number;
    durationSec: number;
  }) => Promise<void>;
  stitchClips: (args: {
    clipPaths: string[];
    concatListPath: string;
    outputPath: string;
  }) => Promise<void>;
  /** Optional: replaces the stitched video's audio with the source audio. */
  muxSourceAudio?: (args: {
    videoPath: string;
    sourcePath: string;
    startSec: number;
    durationSec: number;
    outputPath: string;
  }) => Promise<boolean>;
  uploadClipFile: (
    filePath: string,
    createUpload: LongVideoPlatformClient["createUpload"]
  ) => Promise<string>;
  /** Frame carryover: grabs a piece's last frame and uploads it as a PNG. */
  carryoverFrame?: (args: {
    videoUrl: string;
    workDir: string;
    createUpload: LongVideoPlatformClient["createUpload"];
  }) => Promise<string>;
  uploadFinalVideo: (args: {
    filePath: string;
    fileName: string;
    contentType: string;
    userId: string;
  }) => Promise<{ s3Key: string; url: string }>;
}

export const defaultLongVideoMediaOps = (
  uploadFinalVideo: LongVideoMediaOps["uploadFinalVideo"]
): LongVideoMediaOps => ({
  downloadToFile: downloadMediaToFile,
  probeDurationSec: probeVideoDurationSec,
  splitSegment: splitSegmentWithFfmpeg,
  stitchClips: stitchClipsWithFfmpeg,
  muxSourceAudio: muxSourceAudioWithFfmpeg,
  uploadClipFile: (filePath, createUpload) =>
    uploadClipFileToPlatform(filePath, createUpload),
  carryoverFrame: async ({ videoUrl, workDir, createUpload }) => {
    const videoPath = path.join(workDir, "prev-piece.mp4");
    const framePath = path.join(workDir, "prev-piece-last-frame.png");
    await downloadMediaToFile(videoUrl, videoPath);
    await withFfmpegMutex(() =>
      extractLastFrameWithFfmpeg({ videoPath, outputPath: framePath })
    );
    return uploadClipFileToPlatform(framePath, createUpload, "image/png");
  },
  uploadFinalVideo,
});

export async function failAndRefundLongVideoJob({
  jobId,
  userId,
  creditCost,
  errorMessage,
  entities,
  activeRequestIds = [],
  platformClient,
}: {
  jobId: string;
  userId: string;
  creditCost: number;
  errorMessage: string;
  entities: LongVideoEntities;
  activeRequestIds?: string[];
  platformClient?: Pick<LongVideoPlatformClient, "cancel">;
}): Promise<void> {
  if (platformClient && activeRequestIds.length > 0) {
    await Promise.allSettled(
      activeRequestIds.map((rid) => platformClient.cancel(rid))
    );
  }

  await entities.LongVideoJob.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      error: errorMessage,
    },
  });

  if (creditCost > 0) {
    const refunded = await entities.LongVideoJob.updateMany({
      where: { id: jobId, creditsRefunded: false },
      data: { creditsRefunded: true },
    });
    if (refunded.count > 0) {
      await entities.User.update({
        where: { id: userId },
        data: { credits: { increment: creditCost } },
      });
    }
  }
}

/**
 * Runs inside an async worker pass immediately after creating LongVideoJob:
 * downloads source video, probes duration, sequentially cuts segments (<=15s for
 * Light, <=30s for Pro) on
 * 1 thread, uploads each clip, deletes temp files immediately, and submits
 * bounded Genjutsu batches carrying the exact same prompt & reference anchors.
 */
export async function processLongVideoJobSplit({
  jobId,
  entities,
  platformClient,
  mediaOps,
}: {
  jobId: string;
  entities: LongVideoEntities;
  platformClient: LongVideoPlatformClient;
  mediaOps: LongVideoMediaOps;
}): Promise<void> {
  const job = await entities.LongVideoJob.findUnique({
    where: { id: jobId },
  });
  if (!job || job.status !== "SPLITTING") return;

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `fayaa-lv-${job.id}-`));
  const sourcePath = path.join(workDir, "source.mp4");
  const submittedRequestIds: string[] = [];

  try {
    await mediaOps.downloadToFile(job.sourceVideoUrl, sourcePath);

    const probedDuration = await mediaOps.probeDurationSec(sourcePath);
    const availableAfterTrim = Math.max(
      MIN_CLIP_DURATION_SEC,
      Number((probedDuration - (job.trimStartSec ?? 0)).toFixed(2))
    );
    const effectiveTotal = Math.min(job.totalDurationSec, availableAfterTrim);
    const plannedSegments = computeLongVideoSegments(
      effectiveTotal,
      job.trimStartSec ?? 0,
      maxClipDurationSec(job.variant)
    );

    const dbSegments = await entities.LongVideoSegment.findMany({
      where: { jobId: job.id },
      orderBy: { index: "asc" },
    });

    const segmentsToRun = dbSegments.slice(0, plannedSegments.length);

    // If the real source is shorter than the requested span, the extra planned
    // segments are never rendered. Mark them SKIPPED so the job can still finish.
    for (const extra of dbSegments.slice(plannedSegments.length)) {
      await entities.LongVideoSegment.update({
        where: { id: extra.id },
        data: { status: "SKIPPED" },
      });
    }
    const clipUrls: string[] = [];

    // Split + upload sequentially with 1 thread so RAM and /tmp usage remain tiny inside 1 GB.
    await withFfmpegMutex(async () => {
      for (let i = 0; i < segmentsToRun.length; i++) {
        const plan = plannedSegments[i]!;
        const clipPath = path.join(workDir, `clip-${String(i).padStart(3, "0")}.mp4`);
        await mediaOps.splitSegment({
          sourcePath,
          outputPath: clipPath,
          startSec: plan.startSec,
          durationSec: plan.durationSec,
        });
        const uploadedUrl = await mediaOps.uploadClipFile(
          clipPath,
          platformClient.createUpload
        );
        await fs.rm(clipPath, { force: true });
        clipUrls.push(uploadedUrl);
      }
    });

    // Free source file before upstream API queueing.
    await fs.rm(sourcePath, { force: true });

    const modelPath = genjutsuModelPath(job.variant);

    // Preview-first jobs render only piece 1 now; the rest wait (PENDING, with their
    // clip URL) for the user's approval. Frame carryover also starts with piece 1 only,
    // and each later piece starts once the one before it is done (see syncLongVideoJob).
    const submitNow =
      (job.previewFirst || job.frameCarryover) && segmentsToRun.length > 1
        ? segmentsToRun.slice(0, 1)
        : segmentsToRun;
    for (let i = submitNow.length; i < segmentsToRun.length; i++) {
      await entities.LongVideoSegment.update({
        where: { id: segmentsToRun[i]!.id },
        data: { clipSourceUrl: clipUrls[i]! },
      });
    }

    for (
      let offset = 0;
      offset < submitNow.length;
      offset += MAX_CONCURRENT_SUBMISSIONS
    ) {
      const batch = submitNow.slice(offset, offset + MAX_CONCURRENT_SUBMISSIONS);
      await Promise.all(
        batch.map(async (seg, batchIdx) => {
          const segIdx = offset + batchIdx;
          const clipSourceUrl = clipUrls[segIdx]!;
          const queued = await platformClient.submit(modelPath, {
            video_url: clipSourceUrl,
            image_urls: job.referenceImageUrls,
            resolution: job.resolution,
            ...(job.prompt ? { prompt: job.prompt } : {}),
          });
          submittedRequestIds.push(queued.requestId);
          await entities.LongVideoSegment.update({
            where: { id: seg.id },
            data: {
              clipSourceUrl,
              requestId: queued.requestId,
              status: "PROCESSING",
            },
          });
        })
      );
    }

    await entities.LongVideoJob.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING_CLIPS",
        segmentCount: segmentsToRun.length,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to split and queue long video segments.";
    await failAndRefundLongVideoJob({
      jobId: job.id,
      userId: job.userId,
      creditCost: job.creditCost,
      errorMessage: message,
      entities,
      activeRequestIds: submittedRequestIds,
      platformClient,
    });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

/**
 * Advances an active LongVideoJob: polls segment Genjutsu status, stitches all
 * completed segments seamlessly via low-memory FFmpeg concat once ready, stores
 * the final stitched video in R2/S3, or refunds atomically on timeout/failure.
 */
export async function syncLongVideoJob({
  job,
  entities,
  platformClient,
  mediaOps,
}: {
  job: any;
  entities: LongVideoEntities;
  platformClient: Pick<LongVideoPlatformClient, "status" | "cancel"> &
    Partial<Pick<LongVideoPlatformClient, "submit" | "createUpload">>;
  mediaOps: LongVideoMediaOps;
}): Promise<any> {
  if (job.status === "COMPLETED" || job.status === "FAILED") {
    return job;
  }

  if (job.status === "STITCHING") {
    const sinceUpdateMs =
      Date.now() - new Date(job.updatedAt ?? job.createdAt).getTime();
    if (sinceUpdateMs <= STALE_STITCHING_MS) {
      return job;
    }
    // Stitching was interrupted (e.g. the server restarted mid-concat). Fail it once,
    // atomically, so a stitch that is still finishing elsewhere keeps its result.
    const claimed = await entities.LongVideoJob.updateMany({
      where: { id: job.id, status: "STITCHING" },
      data: { status: "FAILED", error: "Stitching was interrupted. Credits refunded." },
    });
    if (claimed.count > 0) {
      await failAndRefundLongVideoJob({
        jobId: job.id,
        userId: job.userId,
        creditCost: job.creditCost,
        errorMessage: "Stitching was interrupted. Credits refunded.",
        entities,
      });
    }
    return entities.LongVideoJob.findUnique({ where: { id: job.id } });
  }

  if (job.status === "AWAITING_APPROVAL") {
    return job;
  }

  // Preview-first jobs restart the clock when the user approves the rest.
  const jobAgeMs =
    Date.now() - new Date(job.approvedAt ?? job.createdAt).getTime();
  const maxJobMs = job.frameCarryover
    ? Math.max(MAX_LONG_JOB_DURATION_MS, Number(job.segmentCount || 1) * CARRYOVER_MS_PER_PIECE)
    : MAX_LONG_JOB_DURATION_MS;
  if (jobAgeMs > maxJobMs) {
    const segs = await entities.LongVideoSegment.findMany({
      where: { jobId: job.id },
      orderBy: { index: "asc" },
    });
    const activeIds = segs
      .filter((s) => s.status === "PROCESSING" && s.requestId)
      .map((s) => s.requestId);
    await failAndRefundLongVideoJob({
      jobId: job.id,
      userId: job.userId,
      creditCost: job.creditCost,
      errorMessage: "Long video job timed out before finishing all clips.",
      entities,
      activeRequestIds: activeIds,
      platformClient,
    });
    return entities.LongVideoJob.findUnique({ where: { id: job.id } });
  }

  if (job.status === "SPLITTING") {
    return job;
  }

  const segments = (
    await entities.LongVideoSegment.findMany({
      where: { jobId: job.id },
      orderBy: { index: "asc" },
    })
  ).filter((s) => s.status !== "SKIPPED");

  const processingSegments = segments.filter(
    (s) => s.status === "PROCESSING" && s.requestId
  );

  for (
    let offset = 0;
    offset < processingSegments.length;
    offset += MAX_CONCURRENT_SUBMISSIONS
  ) {
    const batch = processingSegments.slice(
      offset,
      offset + MAX_CONCURRENT_SUBMISSIONS
    );
    await Promise.all(
      batch.map(async (seg) => {
        try {
          const remote = await platformClient.status(seg.requestId);
          if (remote.status === "completed") {
            const outputUrl = remote.video?.url;
            if (outputUrl) {
              await entities.LongVideoSegment.update({
                where: { id: seg.id },
                data: { status: "COMPLETED", outputVideoUrl: outputUrl },
              });
              seg.status = "COMPLETED";
              seg.outputVideoUrl = outputUrl;
            } else {
              await entities.LongVideoSegment.update({
                where: { id: seg.id },
                data: {
                  status: "FAILED",
                  error: "Upstream clip returned completed without a video URL.",
                },
              });
              seg.status = "FAILED";
              seg.retryable = true;
            }
          } else if (
            remote.status === "failed" ||
            remote.status === "nsfw" ||
            remote.status === "canceled"
          ) {
            const detail =
              typeof remote.error === "string"
                ? remote.error
                : `Segment ${seg.index + 1} failed (${remote.status}).`;
            await entities.LongVideoSegment.update({
              where: { id: seg.id },
              data: { status: "FAILED", error: detail },
            });
            seg.status = "FAILED";
            seg.error = detail;
            seg.retryable = !NON_RETRYABLE_SEGMENT_STATUSES.has(remote.status);
          }
        } catch {
          // Transient polling errors are retried on the next poll tick.
        }
      })
    );
  }

  // Re-render failed clips from their already-uploaded source piece while attempts remain.
  if (platformClient.submit) {
    for (const seg of segments) {
      if (seg.status !== "FAILED" || !seg.retryable || !seg.clipSourceUrl) continue;
      const attempts = Number(seg.attempts ?? 1);
      if (attempts >= MAX_SEGMENT_ATTEMPTS) continue;
      try {
        const queued = await platformClient.submit(genjutsuModelPath(job.variant), {
          video_url: seg.clipSourceUrl,
          image_urls: job.referenceImageUrls,
          resolution: job.resolution,
          ...(job.prompt ? { prompt: job.prompt } : {}),
        });
        await entities.LongVideoSegment.update({
          where: { id: seg.id },
          data: {
            status: "PROCESSING",
            requestId: queued.requestId,
            attempts: attempts + 1,
            outputVideoUrl: null,
            error: null,
          },
        });
        seg.status = "PROCESSING";
        seg.requestId = queued.requestId;
        seg.attempts = attempts + 1;
        seg.error = null;
      } catch {
        // Resubmission failed; the job fails below with the clip's original error.
      }
    }
  }

  const failedSegment = segments.find((s) => s.status === "FAILED");
  if (failedSegment) {
    const remainingIds = segments
      .filter((s) => s.status === "PROCESSING" && s.requestId)
      .map((s) => s.requestId);
    await failAndRefundLongVideoJob({
      jobId: job.id,
      userId: job.userId,
      creditCost: job.creditCost,
      errorMessage:
        failedSegment.error ||
        `Clip ${failedSegment.index + 1} of ${segments.length} failed.`,
      entities,
      activeRequestIds: remainingIds,
      platformClient,
    });
    return entities.LongVideoJob.findUnique({ where: { id: job.id } });
  }

  const completedSegments = segments.filter(
    (s) => s.status === "COMPLETED" && Boolean(s.outputVideoUrl)
  );

  if (completedSegments.length !== job.completedCount) {
    await entities.LongVideoJob.update({
      where: { id: job.id },
      data: { completedCount: completedSegments.length },
    });
  }

  // Preview-first: once piece 1 is ready (and nothing else was started), pause and
  // let the user decide whether to pay for the rest.
  if (job.previewFirst && !job.approvedAt && segments.length > 1) {
    const first = segments[0]!;
    const restUntouched = segments
      .slice(1)
      .every((s) => s.status === "PENDING" && !s.requestId);
    if (first.status === "COMPLETED" && first.outputVideoUrl && restUntouched) {
      await entities.LongVideoJob.updateMany({
        where: { id: job.id, status: "PROCESSING_CLIPS" },
        data: { status: "AWAITING_APPROVAL", previewVideoUrl: first.outputVideoUrl },
      });
      return entities.LongVideoJob.findUnique({ where: { id: job.id } });
    }
  }

  // Frame carryover: start the next piece once the one before it is done, passing
  // the finished piece's last frame as an extra reference so the look carries over.
  if (job.frameCarryover && platformClient.submit && platformClient.createUpload) {
    const nextIdx = segments.findIndex((s) => s.status === "PENDING" && !s.requestId);
    const prev = nextIdx > 0 ? segments[nextIdx - 1] : undefined;
    if (prev && prev.status === "COMPLETED" && prev.outputVideoUrl) {
      const next = segments[nextIdx]!;
      let frameUrl: string | null = null;
      if (mediaOps.carryoverFrame) {
        const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `fayaa-carry-${job.id}-`));
        try {
          frameUrl = await mediaOps.carryoverFrame({
            videoUrl: prev.outputVideoUrl,
            workDir,
            createUpload: platformClient.createUpload,
          });
        } catch (err: unknown) {
          // Fall back to the user's references alone rather than stalling the job.
          console.warn(
            `[longVideo] Frame carryover failed for job ${job.id}, piece ${next.index + 1}:`,
            err instanceof Error ? err.message : err
          );
        } finally {
          await fs.rm(workDir, { recursive: true, force: true });
        }
      }
      try {
        const queued = await platformClient.submit(genjutsuModelPath(job.variant), {
          video_url: next.clipSourceUrl,
          image_urls: carryoverReferenceImages(job.referenceImageUrls, frameUrl),
          resolution: job.resolution,
          ...(job.prompt ? { prompt: job.prompt } : {}),
        });
        await entities.LongVideoSegment.update({
          where: { id: next.id },
          data: { requestId: queued.requestId, status: "PROCESSING" },
        });
        next.status = "PROCESSING";
        next.requestId = queued.requestId;
      } catch {
        // Retried on the next poll tick.
      }
    }
  }

  if (completedSegments.length < segments.length) {
    return entities.LongVideoJob.findUnique({ where: { id: job.id } });
  }

  // All segments completed: acquire atomic STITCHING lock.
  const locked = await entities.LongVideoJob.updateMany({
    where: { id: job.id, status: "PROCESSING_CLIPS" },
    data: { status: "STITCHING", completedCount: segments.length },
  });
  if (locked.count === 0) {
    return entities.LongVideoJob.findUnique({ where: { id: job.id } });
  }

  const stitchDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `fayaa-stitch-${job.id}-`)
  );
  try {
    const clipPaths: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;
      const localPath = path.join(
        stitchDir,
        `render-${String(i).padStart(3, "0")}.mp4`
      );
      await mediaOps.downloadToFile(seg.outputVideoUrl, localPath);
      clipPaths.push(localPath);
    }

    const concatListPath = path.join(stitchDir, "concat-list.txt");
    const stitchedPath = path.join(stitchDir, `final-${job.id}.mp4`);

    await withFfmpegMutex(() =>
      mediaOps.stitchClips({
        clipPaths,
        concatListPath,
        outputPath: stitchedPath,
      })
    );

    // Keep the original soundtrack. This is best effort: if the source has no audio
    // or the mux fails, the silent stitched video is still delivered.
    let finalPath = stitchedPath;
    if (mediaOps.muxSourceAudio) {
      const sourcePath = path.join(stitchDir, "source.mp4");
      const withAudioPath = path.join(stitchDir, `final-${job.id}-audio.mp4`);
      const startSec = Number(segments[0]?.startSec ?? job.trimStartSec ?? 0);
      const durationSec = segments.reduce(
        (sum, s) => sum + Number(s.durationSec || 0),
        0
      );
      try {
        await mediaOps.downloadToFile(job.sourceVideoUrl, sourcePath);
        const muxed = await withFfmpegMutex(() =>
          mediaOps.muxSourceAudio!({
            videoPath: stitchedPath,
            sourcePath,
            startSec,
            durationSec,
            outputPath: withAudioPath,
          })
        );
        if (muxed) finalPath = withAudioPath;
      } catch (err: unknown) {
        console.warn(
          `[longVideo] Could not add source audio to job ${job.id}:`,
          err instanceof Error ? err.message : err
        );
      } finally {
        await fs.rm(sourcePath, { force: true });
      }
    }

    const uploaded = await mediaOps.uploadFinalVideo({
      filePath: finalPath,
      fileName: `fayaa-genjutsu-${job.id}.mp4`,
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
    await failAndRefundLongVideoJob({
      jobId: job.id,
      userId: job.userId,
      creditCost: job.creditCost,
      errorMessage:
        err instanceof Error
          ? err.message
          : "Failed to stitch and save final long video.",
      entities,
    });
    return entities.LongVideoJob.findUnique({ where: { id: job.id } });
  } finally {
    await fs.rm(stitchDir, { recursive: true, force: true });
  }
}

/**
 * Approves a preview-first job: queues every remaining piece (already cut and
 * uploaded) and moves the job back to PROCESSING_CLIPS. The caller charges the
 * remaining credits before calling this, and refunds them if it throws.
 */
export async function submitRemainingLongVideoSegments({
  job,
  entities,
  platformClient,
}: {
  job: any;
  entities: LongVideoEntities;
  platformClient: Pick<LongVideoPlatformClient, "submit" | "cancel">;
}): Promise<void> {
  const claimed = await entities.LongVideoJob.updateMany({
    where: { id: job.id, status: "AWAITING_APPROVAL" },
    data: { status: "PROCESSING_CLIPS", approvedAt: new Date() },
  });
  if (claimed.count === 0) {
    throw new Error("This preview is no longer waiting for approval.");
  }
  // Frame carryover renders the rest one piece at a time from syncLongVideoJob.
  if (job.frameCarryover) return;

  const segments = (
    await entities.LongVideoSegment.findMany({
      where: { jobId: job.id },
      orderBy: { index: "asc" },
    })
  ).filter((s) => s.status === "PENDING" && s.clipSourceUrl);

  const submitted: string[] = [];
  const queuedSegmentIds: string[] = [];
  try {
    for (
      let offset = 0;
      offset < segments.length;
      offset += MAX_CONCURRENT_SUBMISSIONS
    ) {
      const batch = segments.slice(offset, offset + MAX_CONCURRENT_SUBMISSIONS);
      await Promise.all(
        batch.map(async (seg) => {
          const queued = await platformClient.submit(genjutsuModelPath(job.variant), {
            video_url: seg.clipSourceUrl,
            image_urls: job.referenceImageUrls,
            resolution: job.resolution,
            ...(job.prompt ? { prompt: job.prompt } : {}),
          });
          submitted.push(queued.requestId);
          queuedSegmentIds.push(seg.id);
          await entities.LongVideoSegment.update({
            where: { id: seg.id },
            data: { requestId: queued.requestId, status: "PROCESSING" },
          });
        })
      );
    }
  } catch (err) {
    // Undo the partial submission so the job can go back to waiting for approval.
    await Promise.allSettled(submitted.map((rid) => platformClient.cancel(rid)));
    await Promise.allSettled(
      queuedSegmentIds.map((id) =>
        entities.LongVideoSegment.update({
          where: { id },
          data: { requestId: null, status: "PENDING" },
        })
      )
    );
    throw err;
  }
}

/**
 * Declines the rest of a preview-first job: the rendered first piece becomes the
 * final result, stored like any finished long video. Nothing more is charged.
 */
export async function keepLongVideoPreviewOnly({
  job,
  entities,
  mediaOps,
}: {
  job: any;
  entities: LongVideoEntities;
  mediaOps: Pick<LongVideoMediaOps, "downloadToFile" | "uploadFinalVideo">;
}): Promise<any> {
  if (job.status !== "AWAITING_APPROVAL" || !job.previewVideoUrl) {
    throw new Error("This preview is no longer waiting for approval.");
  }
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `fayaa-preview-${job.id}-`));
  try {
    const localPath = path.join(workDir, "preview.mp4");
    await mediaOps.downloadToFile(job.previewVideoUrl, localPath);
    const uploaded = await mediaOps.uploadFinalVideo({
      filePath: localPath,
      fileName: `fayaa-genjutsu-${job.id}-preview.mp4`,
      contentType: "video/mp4",
      userId: job.userId,
    });
    const claimed = await entities.LongVideoJob.updateMany({
      where: { id: job.id, status: "AWAITING_APPROVAL" },
      data: {
        status: "COMPLETED",
        outputVideoUrl: uploaded.url,
        outputStorageKey: uploaded.s3Key,
        completedCount: 1,
        segmentCount: 1,
      },
    });
    if (claimed.count === 0) {
      throw new Error("This preview is no longer waiting for approval.");
    }
    return entities.LongVideoJob.findUnique({ where: { id: job.id } });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
