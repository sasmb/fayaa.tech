/**
 * Seedance Week: the launch event for Seedance 2.5 on FAYAA.
 *
 * One place for the dates and the deal. Shared by the app (client and server)
 * and the marketing site in /site, so every banner, page and the payment
 * webhook agree on when the launch is live and what it gives.
 *
 * To move the launch, change START and END. To turn it off, set ENABLED to false.
 */

export const SEEDANCE_LAUNCH = {
  enabled: true,
  name: "Seedance Week",
  /** Inclusive start, UTC. */
  startsAt: "2026-12-01T00:00:00Z",
  /** Exclusive end, UTC (the deal runs through Dec 7). */
  endsAt: "2026-12-08T00:00:00Z",
  /**
   * Extra credits on every credit pack and on the first payment of a new
   * subscription made during the launch. Renders are priced at 1.5x provider
   * cost, so a 25% bonus still leaves a 1.2x margin on those credits.
   */
  bonusPercent: 25,
  /** Path of the launch page on the marketing site and in the app. */
  path: "/seedance",
  /** Studio link that opens Seedance directly. */
  studioPath: "/studio?model=seedance",
} as const;

export type SeedanceLaunchPhase = "off" | "upcoming" | "live" | "ended";

const startMs = () => Date.parse(SEEDANCE_LAUNCH.startsAt);
const endMs = () => Date.parse(SEEDANCE_LAUNCH.endsAt);

export function seedanceLaunchPhase(now: Date = new Date()): SeedanceLaunchPhase {
  if (!SEEDANCE_LAUNCH.enabled) return "off";
  const t = now.getTime();
  if (t < startMs()) return "upcoming";
  if (t < endMs()) return "live";
  return "ended";
}

export function isSeedanceLaunchLive(now: Date = new Date()): boolean {
  return seedanceLaunchPhase(now) === "live";
}

/** Bonus credits for a purchase of `baseCredits` paid at `paidAt`. 0 outside the launch. */
export function seedanceLaunchBonusCredits(baseCredits: number, paidAt: Date): number {
  if (!isSeedanceLaunchLive(paidAt)) return 0;
  if (!Number.isFinite(baseCredits) || baseCredits <= 0) return 0;
  return Math.floor((baseCredits * SEEDANCE_LAUNCH.bonusPercent) / 100);
}

/** Milliseconds until the next phase change (start or end), or null when none is ahead. */
export function msUntilNextLaunchChange(now: Date = new Date()): number | null {
  const phase = seedanceLaunchPhase(now);
  if (phase === "upcoming") return startMs() - now.getTime();
  if (phase === "live") return endMs() - now.getTime();
  return null;
}

/** "Dec 1" style label for the launch dates, in UTC so server and client match. */
function dayLabel(iso: string, offsetMs = 0): string {
  return new Date(Date.parse(iso) + offsetMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export const SEEDANCE_LAUNCH_DATES = `${dayLabel(SEEDANCE_LAUNCH.startsAt)} to ${dayLabel(
  SEEDANCE_LAUNCH.endsAt,
  -1
)}`;

/** Copy for the launch, kept next to the dates so the wording matches the deal. */
export const SEEDANCE_LAUNCH_COPY = {
  badge: { upcoming: "Coming Dec 1", live: "Live now" },
  headline: ["Seedance 2.5", "is here."],
  tagline: "Type an idea. Get a cinematic video in minutes.",
  description:
    "Seedance 2.5 turns a single prompt into a polished video up to two minutes long, in any format from 9:16 to 21:9 at up to 1080p. No clip or photo needed.",
  deal: `+${SEEDANCE_LAUNCH.bonusPercent}% bonus credits on every pack and new plan, ${SEEDANCE_LAUNCH_DATES} only.`,
  announcement: {
    upcoming: `Seedance 2.5 lands Dec 1. Launch week: +${SEEDANCE_LAUNCH.bonusPercent}% bonus credits on every purchase.`,
    live: `Seedance 2.5 is live. +${SEEDANCE_LAUNCH.bonusPercent}% bonus credits on every purchase until Dec 7.`,
  },
  features: [
    {
      title: "Prompt to video",
      body: "Describe the shot, the mood and the camera. Seedance writes the whole scene from text.",
    },
    {
      title: "Up to two minutes",
      body: "Single shots run to 30 seconds. Longer videos are chained piece by piece and joined into one file.",
    },
    {
      title: "Every format",
      body: "9:16 for TikTok, Reels and Shorts, 16:9 for YouTube, 1:1 for feeds, and 21:9 for a cinematic look.",
    },
    {
      title: "Up to 1080p",
      body: "Draft at 480p, post at 720p, or go full 1080p for ads and hero content.",
    },
  ],
  prompts: [
    "Slow dolly shot through a neon Lagos night market in the rain, steam rising, cinematic 35mm",
    "A sneaker drops onto wet asphalt in slow motion, water splashes, golden hour backlight, product ad",
    "Drone shot over a desert at sunrise, a lone rider on horseback, epic orchestral mood",
    "Close-up of a barista pouring latte art, warm cafe light, shallow depth of field, 9:16",
  ],
} as const;
