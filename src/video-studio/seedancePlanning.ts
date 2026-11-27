/**
 * Seedance 2.5 (through MuAPI) planning, shared by the client and the server.
 *
 * A Seedance video is one text-to-video generation for the first piece, then one
 * "video extend" per extra piece. Each extend gets only the last few seconds of
 * the previous piece as its input, because MuAPI bills an extend on the input
 * length plus the new length.
 */

export const SEEDANCE_VARIANT = "seedance";
export const SEEDANCE_MODEL_ID = "seedance";

export const SEEDANCE_TEXT_TO_VIDEO_PATH = "seedance-2.5-text-to-video";
export const SEEDANCE_EXTEND_PATH = "seedance-2.5-video-extend";

export const SEEDANCE_MIN_DURATION_SEC = 4;
/** Longest piece one MuAPI call makes (text-to-video and extend both allow 4 to 30s). */
export const SEEDANCE_MAX_PIECE_SEC = 30;
/** Longest video we chain, which caps what one job can cost. */
export const SEEDANCE_MAX_TOTAL_SEC = 120;
/** Seconds of the previous piece sent to each extend, for continuity. */
export const SEEDANCE_EXTEND_CONTEXT_SEC = 5;

export const SEEDANCE_RESOLUTIONS = ["480p", "720p", "1080p"] as const;
export type SeedanceResolution = (typeof SEEDANCE_RESOLUTIONS)[number];

export const SEEDANCE_ASPECT_RATIOS = [
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
  "21:9",
  "9:21",
] as const;
export type SeedanceAspectRatio = (typeof SEEDANCE_ASPECT_RATIOS)[number];

/**
 * MuAPI's listed text-to-video price per second (muapi.ai playground page, Nov 2026).
 * Check these against your MuAPI dashboard: if MuAPI charges more, users pay less than it costs.
 */
export const SEEDANCE_USD_PER_SEC: Record<SeedanceResolution, number> = {
  "480p": 0.17,
  "720p": 0.34,
  "1080p": 0.85,
};
/** MuAPI bills an extend at 65% of the base rate, on input plus new seconds. */
export const SEEDANCE_EXTEND_RATE_FACTOR = 0.65;
/** Same rate as the rest of the app: 30 credits = $1. */
export const CREDITS_PER_USD = 30;

export function normalizeSeedanceResolution(value: unknown): SeedanceResolution {
  return value === "480p" || value === "1080p" ? value : "720p";
}

export function normalizeSeedanceAspectRatio(value: unknown): SeedanceAspectRatio {
  return (SEEDANCE_ASPECT_RATIOS as readonly string[]).includes(String(value))
    ? (value as SeedanceAspectRatio)
    : "16:9";
}

export function clampSeedanceDuration(value: unknown): number {
  const sec = Math.round(Number(value));
  if (!Number.isFinite(sec)) return SEEDANCE_MIN_DURATION_SEC;
  return Math.min(SEEDANCE_MAX_TOTAL_SEC, Math.max(SEEDANCE_MIN_DURATION_SEC, sec));
}

/** Whole-second pieces of near-equal length, each between 4 and 30 seconds. */
export function splitSeedancePieces(totalSec: number): number[] {
  const total = clampSeedanceDuration(totalSec);
  const count = Math.ceil(total / SEEDANCE_MAX_PIECE_SEC);
  const base = Math.floor(total / count);
  const extra = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}

export interface SeedancePiecePlan {
  index: number;
  startSec: number;
  durationSec: number;
  /** "text" for the first piece, "extend" for the rest. */
  kind: "text" | "extend";
  /** Seconds of the previous piece sent as the extend input (0 for the first). */
  contextSec: number;
  usd: number;
}

export interface SeedancePlan {
  totalDurationSec: number;
  resolution: SeedanceResolution;
  pieces: SeedancePiecePlan[];
  usd: number;
  credits: number;
}

export function estimateSeedancePlan({
  totalDurationSec,
  resolution,
}: {
  totalDurationSec: number;
  resolution: unknown;
}): SeedancePlan {
  const res = normalizeSeedanceResolution(resolution);
  const rate = SEEDANCE_USD_PER_SEC[res];
  const durations = splitSeedancePieces(totalDurationSec);
  let startSec = 0;
  const pieces = durations.map((durationSec, index): SeedancePiecePlan => {
    const contextSec =
      index === 0 ? 0 : Math.min(SEEDANCE_EXTEND_CONTEXT_SEC, durations[index - 1]!);
    const usd =
      index === 0
        ? rate * durationSec
        : rate * SEEDANCE_EXTEND_RATE_FACTOR * (contextSec + durationSec);
    const piece: SeedancePiecePlan = {
      index,
      startSec,
      durationSec,
      kind: index === 0 ? "text" : "extend",
      contextSec,
      usd: Number(usd.toFixed(4)),
    };
    startSec += durationSec;
    return piece;
  });
  const usd = Number(pieces.reduce((sum, p) => sum + p.usd, 0).toFixed(4));
  return {
    totalDurationSec: startSec,
    resolution: res,
    pieces,
    usd,
    credits: Math.max(2, Math.ceil(usd * CREDITS_PER_USD)),
  };
}
