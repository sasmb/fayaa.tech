import type { ExperimentAssignments } from "./experiments";

/**
 * Marketing events go to whichever analytics script is on the page
 * (Plausible and/or Google Analytics, see src/client/head.wasp.ts and the
 * cookie consent config). Every event carries the visitor's experiment
 * variants, so any funnel can be split by variant in either tool.
 */

type PlausibleFn = (event: string, options?: { props?: Record<string, string> }) => void;
type GtagFn = (command: "event", name: string, params?: Record<string, string>) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
    gtag?: GtagFn;
  }
}

let currentAssignments: ExperimentAssignments = {};

export function setAnalyticsExperimentContext(assignments: ExperimentAssignments) {
  currentAssignments = assignments;
}

function experimentProps(): Record<string, string> {
  const props: Record<string, string> = {};
  for (const [experimentId, variantId] of Object.entries(currentAssignments)) {
    props[`exp_${experimentId.replace(/-/g, "_")}`] = variantId;
  }
  return props;
}

export function trackMarketingEvent(name: string, props: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const merged = { ...experimentProps(), ...props };
  try {
    window.plausible?.(name, { props: merged });
    window.gtag?.("event", name.toLowerCase().replace(/\s+/g, "_"), merged);
  } catch {
    /* Analytics must never break the page. */
  }
  if (import.meta.env?.DEV) {
    console.debug("[fayaa:marketing]", name, merged);
  }
}

const EXPOSURE_KEY = "fy_exp_exposed";

/** Logs "Experiment Viewed" once per experiment per browser session. */
export function trackExposure(experimentId: string, variantId: string) {
  if (typeof window === "undefined") return;
  let seen: string[] = [];
  try {
    seen = JSON.parse(window.sessionStorage.getItem(EXPOSURE_KEY) ?? "[]") as string[];
  } catch {
    seen = [];
  }
  const key = `${experimentId}:${variantId}`;
  if (seen.includes(key)) return;
  trackMarketingEvent("Experiment Viewed", { experiment: experimentId, variant: variantId });
  try {
    window.sessionStorage.setItem(EXPOSURE_KEY, JSON.stringify([...seen, key]));
  } catch {
    /* Private mode: exposure may be logged again, which is acceptable. */
  }
}
