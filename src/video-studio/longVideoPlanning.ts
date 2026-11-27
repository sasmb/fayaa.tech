import { creditCostForResolution } from "./taskSync";

/** Longest clip Genjutsu Pro renders in one request. */
export const MAX_CLIP_DURATION_SEC = 30;
/** Longest clip Genjutsu Light renders in one request. Longer inputs come back cut at 15s. */
export const LIGHT_MAX_CLIP_DURATION_SEC = 15;
export const MIN_CLIP_DURATION_SEC = 4;

export type GenjutsuVariant = "light" | "pro";

/** Normalizes a variant name or full Genjutsu model path to "light" | "pro". */
export function normalizeGenjutsuVariant(variant?: string | null): GenjutsuVariant {
  return variant === "pro" || variant === "higgsfield/genjutsu/motion-transfer/v1.0"
    ? "pro"
    : "light";
}

/** Longest single clip the given Genjutsu variant can render without truncating it. */
export function maxClipDurationSec(variant?: string | null): number {
  return normalizeGenjutsuVariant(variant) === "pro"
    ? MAX_CLIP_DURATION_SEC
    : LIGHT_MAX_CLIP_DURATION_SEC;
}

export interface LongVideoSegmentPlan {
  index: number;
  startSec: number;
  durationSec: number;
}

export interface LongVideoCostPlan {
  isLongForm: boolean;
  totalDurationSec: number;
  billableSeconds: number;
  segments: LongVideoSegmentPlan[];
  segmentCount: number;
  usdPerSec: number;
  totalUsd: number;
  credits: number;
}

const DEFAULT_RATES = {
  light: { "480p": 0.025, "720p": 0.05, "1080p": 0.1 },
  pro: { "480p": 0.159, "720p": 0.3405, "1080p": 0.816 },
} as const;

/**
 * Slices a source video span of `totalDurationSec` into sequential segments no longer
 * than `maxClipSec` (15s for Light, 30s for Pro), balancing the final segment so no
 * clip is shorter than Genjutsu's 4s minimum.
 */
export function computeLongVideoSegments(
  totalDurationSec: number,
  trimStartSec = 0,
  maxClipSec: number = MAX_CLIP_DURATION_SEC
): LongVideoSegmentPlan[] {
  const maxClip = Math.max(MIN_CLIP_DURATION_SEC * 2, maxClipSec);
  if (!Number.isFinite(totalDurationSec) || totalDurationSec <= 0) {
    throw new Error("Video duration must be greater than 0 seconds.");
  }

  const startOffset = Math.max(0, Number(trimStartSec.toFixed(2)));
  const clampedTotal = Math.max(
    MIN_CLIP_DURATION_SEC,
    Number(totalDurationSec.toFixed(2))
  );

  if (clampedTotal <= maxClip) {
    return [
      {
        index: 0,
        startSec: startOffset,
        durationSec: clampedTotal,
      },
    ];
  }

  const segments: LongVideoSegmentPlan[] = [];
  let cursor = 0;

  while (cursor < clampedTotal) {
    const remaining = Number((clampedTotal - cursor).toFixed(2));
    if (remaining <= 0) break;

    if (remaining <= maxClip) {
      if (remaining < MIN_CLIP_DURATION_SEC && segments.length > 0) {
        const deficit = Number((MIN_CLIP_DURATION_SEC - remaining).toFixed(2));
        const prev = segments[segments.length - 1]!;
        prev.durationSec = Number((prev.durationSec - deficit).toFixed(2));
        segments.push({
          index: segments.length,
          startSec: Number((startOffset + cursor - deficit).toFixed(2)),
          durationSec: MIN_CLIP_DURATION_SEC,
        });
      } else {
        segments.push({
          index: segments.length,
          startSec: Number((startOffset + cursor).toFixed(2)),
          durationSec: remaining,
        });
      }
      break;
    }

    segments.push({
      index: segments.length,
      startSec: Number((startOffset + cursor).toFixed(2)),
      durationSec: maxClip,
    });
    cursor = Number((cursor + maxClip).toFixed(2));
  }

  return segments;
}

function billableSegmentSeconds(durationSec: number, maxClip: number): number {
  return Math.max(MIN_CLIP_DURATION_SEC, Math.min(maxClip, Math.ceil(durationSec)));
}

/** Credits for rendering one piece, priced the same way as the upfront estimate. */
export function segmentCredits(
  durationSec: number,
  resolution: string,
  variant: string
): number {
  const sec = billableSegmentSeconds(durationSec, maxClipDurationSec(variant));
  return creditCostForResolution(resolution, normalizeGenjutsuVariant(variant), sec);
}

/**
 * Estimates upfront credits and segment count for both single-clip and
 * multi-clip long-form Genjutsu workflows. The clip length follows the variant:
 * anything over 15s on Light, or over 30s on Pro, is split into several clips.
 */
export function estimateLongVideoPlan({
  totalDurationSec,
  trimStartSec = 0,
  resolution = "480p",
  variant = "light",
  usdPerSecByRes,
}: {
  totalDurationSec: number;
  trimStartSec?: number;
  resolution?: "480p" | "720p" | "1080p" | string;
  variant?: "light" | "pro" | string;
  usdPerSecByRes?: { "480p": number; "720p": number; "1080p": number };
}): LongVideoCostPlan {
  const safeDuration = Math.max(MIN_CLIP_DURATION_SEC, totalDurationSec);
  const resKey = (
    resolution === "1080p" || resolution === "480p" ? resolution : "720p"
  ) as "480p" | "720p" | "1080p";
  const isPro = normalizeGenjutsuVariant(variant) === "pro";
  const maxClip = maxClipDurationSec(variant);
  const rates = usdPerSecByRes ?? (isPro ? DEFAULT_RATES.pro : DEFAULT_RATES.light);
  const usdPerSec = rates[resKey];

  const segments = computeLongVideoSegments(safeDuration, trimStartSec, maxClip);
  const isLongForm = segments.length > 1;
  const modelKey = isPro ? "pro" : "light";

  let credits = 0;
  let billableSeconds = 0;

  for (const seg of segments) {
    billableSeconds += billableSegmentSeconds(seg.durationSec, maxClip);
    credits += segmentCredits(seg.durationSec, resKey, modelKey);
  }

  const totalUsd = Number((billableSeconds * usdPerSec).toFixed(2));

  return {
    isLongForm,
    totalDurationSec: safeDuration,
    billableSeconds,
    segments,
    segmentCount: segments.length,
    usdPerSec,
    totalUsd,
    credits,
  };
}

/**
 * Computes human-readable progress label for an active LongVideoJob card.
 */
export function formatLongVideoProgressLabel({
  status,
  segmentCount,
  completedCount,
  variant,
}: {
  status: string;
  segmentCount: number;
  completedCount: number;
  variant?: string | null;
}): string {
  if (variant === "seedance") {
    switch (status) {
      case "PROCESSING_CLIPS":
        return segmentCount > 1
          ? `Generating (${completedCount}/${segmentCount} pieces ready)`
          : "Generating…";
      case "STITCHING":
        return segmentCount > 1 ? `Joining ${segmentCount} pieces…` : "Saving video…";
      case "COMPLETED":
        return "Final video ready";
      case "FAILED":
        return "Seedance video failed";
      default:
        return "Generating…";
    }
  }
  switch (status) {
    case "SPLITTING":
      return `Preparing ${segmentCount} clips…`;
    case "PROCESSING_CLIPS":
      return `Swapping frames (${completedCount}/${segmentCount} clips ready)`;
    case "STITCHING":
      return `Assembling final ${segmentCount}-clip video…`;
    case "COMPLETED":
      return "Final video ready";
    case "FAILED":
      return "Long video generation failed";
    default:
      return "Processing long video…";
  }
}

export type LongVideoPieceStatus = "pending" | "rendering" | "ready" | "failed";

export interface LongVideoPieceState {
  index: number;
  status: LongVideoPieceStatus;
  startSec: number;
  durationSec: number;
  /** Render attempts so far, when the server tracks them (>1 means it was retried). */
  attempts?: number;
}

/**
 * Turns stored LongVideoSegment rows into the ordered per-piece states the studio
 * shows on a running long-video card. Skipped segments are left out.
 */
export function summarizeLongVideoPieces(
  segments: Array<{
    index: number;
    status: string;
    startSec?: number | null;
    durationSec?: number | null;
    attempts?: number | null;
  }>
): LongVideoPieceState[] {
  return segments
    .filter((s) => s.status !== "SKIPPED")
    .sort((a, b) => a.index - b.index)
    .map((s) => {
      const status: LongVideoPieceStatus =
        s.status === "COMPLETED"
          ? "ready"
          : s.status === "FAILED"
            ? "failed"
            : s.status === "PROCESSING" || s.status === "SUBMITTING"
              ? "rendering"
              : "pending";
      return {
        index: s.index,
        status,
        startSec: Number(s.startSec ?? 0),
        durationSec: Number(s.durationSec ?? 0),
        ...(typeof s.attempts === "number" ? { attempts: s.attempts } : {}),
      };
    });
}
