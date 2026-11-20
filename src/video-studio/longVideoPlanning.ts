import { creditCostForResolution } from "./taskSync";

export const MAX_CLIP_DURATION_SEC = 30;
export const MIN_CLIP_DURATION_SEC = 4;

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
 * Slices a source video span of `totalDurationSec` into sequential <=30s segments,
 * balancing the final segment so no clip is shorter than Genjutsu's 4s minimum.
 */
export function computeLongVideoSegments(
  totalDurationSec: number,
  trimStartSec = 0
): LongVideoSegmentPlan[] {
  if (!Number.isFinite(totalDurationSec) || totalDurationSec <= 0) {
    throw new Error("Video duration must be greater than 0 seconds.");
  }

  const startOffset = Math.max(0, Number(trimStartSec.toFixed(2)));
  const clampedTotal = Math.max(
    MIN_CLIP_DURATION_SEC,
    Number(totalDurationSec.toFixed(2))
  );

  if (clampedTotal <= MAX_CLIP_DURATION_SEC) {
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

    if (remaining <= MAX_CLIP_DURATION_SEC) {
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
      durationSec: MAX_CLIP_DURATION_SEC,
    });
    cursor = Number((cursor + MAX_CLIP_DURATION_SEC).toFixed(2));
  }

  return segments;
}

/**
 * Estimates upfront credits and segment count for both standard (<=30s) and
 * multi-clip long-form (>30s, credit-gated) Genjutsu workflows.
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
  const isPro =
    variant === "pro" || variant === "higgsfield/genjutsu/motion-transfer/v1.0";
  const rates = usdPerSecByRes ?? (isPro ? DEFAULT_RATES.pro : DEFAULT_RATES.light);
  const usdPerSec = rates[resKey];

  const segments = computeLongVideoSegments(safeDuration, trimStartSec);
  const isLongForm = segments.length > 1;
  const modelKey = isPro ? "pro" : "light";

  let credits = 0;
  let billableSeconds = 0;

  for (const seg of segments) {
    const segSec = Math.max(
      MIN_CLIP_DURATION_SEC,
      Math.min(MAX_CLIP_DURATION_SEC, Math.ceil(seg.durationSec))
    );
    billableSeconds += segSec;
    credits += creditCostForResolution(resKey, modelKey, segSec);
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
}: {
  status: string;
  segmentCount: number;
  completedCount: number;
}): string {
  switch (status) {
    case "SPLITTING":
      return `Preparing ${segmentCount}×30s clips…`;
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
