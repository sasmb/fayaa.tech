/**
 * Lightweight, dependency-free A/B testing for the marketing site.
 *
 * - Assignment is deterministic: hash(experimentId + visitorId) picks a
 *   weighted bucket, so a visitor keeps the same variant across visits.
 * - Any variant can be previewed with ?fy_exp=<experiment>:<variant>
 *   (comma-separate several, ?fy_exp=reset clears previews).
 * - Concluded experiments serve their winner to everyone, so you can ship a
 *   result by editing one line and delete the losing copy later.
 *
 * Add an experiment here, then read it with useExperiment() or describe its
 * content changes in src/marketing/landingContent.ts (CONTENT_VARIANTS).
 */

export type ExperimentStatus = "running" | "paused" | "concluded";

export interface ExperimentVariant {
  id: string;
  /** Relative traffic share. Weights don't need to add up to 100. */
  weight: number;
  /** Short human description, shown on the admin experiments page. */
  description: string;
}

export interface ExperimentDefinition {
  id: string;
  /** What we're trying to learn. */
  hypothesis: string;
  /** Event that decides the winner (see analytics.ts). */
  primaryMetric: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  /** Served to everyone when concluded (and while paused, if set). */
  winner?: string;
}

export const CONTROL = "control";

export const EXPERIMENTS: ExperimentDefinition[] = [
  {
    id: "hero-copy",
    hypothesis:
      "A creator-first headline that names the outcome (your clip, any star) beats the capability headline on signups.",
    primaryMetric: "Signup CTA Click",
    status: "running",
    variants: [
      { id: CONTROL, weight: 50, description: "Capability headline: 'Direct any motion.'" },
      { id: "creator", weight: 50, description: "Outcome headline: 'Your moves. Any star.'" },
    ],
  },
  {
    id: "landing-layout",
    hypothesis:
      "Showing community proof right after the hero builds trust faster than explaining the product first.",
    primaryMetric: "Studio Open",
    status: "running",
    variants: [
      { id: CONTROL, weight: 50, description: "Hero, reel, how it works, community, tools, templates" },
      { id: "proof-first", weight: 50, description: "Hero, community, reel, how it works, tools, templates" },
    ],
  },
  {
    id: "primary-cta",
    hypothesis: "Naming the first output ('Make your first video') beats a generic 'Start creating'.",
    primaryMetric: "Signup CTA Click",
    status: "running",
    variants: [
      { id: CONTROL, weight: 50, description: "'Start creating free'" },
      { id: "first-video", weight: 50, description: "'Make your first video'" },
    ],
  },
];

export type ExperimentAssignments = Record<string, string>;

/** 32-bit FNV-1a. Stable across browsers and fast enough for page load. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Picks a variant for one visitor. Pure, so it is unit-testable. */
export function assignVariant(experiment: ExperimentDefinition, visitorId: string): string {
  if (experiment.status === "concluded") {
    return experiment.winner ?? CONTROL;
  }
  if (experiment.status === "paused") {
    return experiment.winner ?? CONTROL;
  }
  const variants = experiment.variants.filter((v) => v.weight > 0);
  const total = variants.reduce((sum, v) => sum + v.weight, 0);
  if (variants.length === 0 || total <= 0) return CONTROL;

  const bucket = (hashString(`${experiment.id}:${visitorId}`) / 0x100000000) * total;
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant.id;
  }
  return variants[variants.length - 1]!.id;
}

/**
 * Reads ?fy_exp=hero-copy:creator,landing-layout:proof-first.
 * Returns null for ?fy_exp=reset so callers can clear stored previews.
 */
export function parseExperimentOverrides(search: string): ExperimentAssignments | null {
  const params = new URLSearchParams(search);
  const raw = params.get("fy_exp");
  if (raw === null) return {};
  if (raw.trim() === "reset") return null;
  const overrides: ExperimentAssignments = {};
  for (const pair of raw.split(",")) {
    const [experimentId, variantId] = pair.split(":").map((s) => s?.trim());
    if (experimentId && variantId) overrides[experimentId] = variantId;
  }
  return overrides;
}

/** Assigns every experiment, letting valid preview overrides win. */
export function resolveAssignments(
  visitorId: string,
  overrides: ExperimentAssignments = {},
  experiments: ExperimentDefinition[] = EXPERIMENTS
): ExperimentAssignments {
  const assignments: ExperimentAssignments = {};
  for (const experiment of experiments) {
    const override = overrides[experiment.id];
    const isKnown = override && experiment.variants.some((v) => v.id === override);
    assignments[experiment.id] = isKnown ? override : assignVariant(experiment, visitorId);
  }
  return assignments;
}

export function getExperiment(id: string): ExperimentDefinition | undefined {
  return EXPERIMENTS.find((e) => e.id === id);
}
