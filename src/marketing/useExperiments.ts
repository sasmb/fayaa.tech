import { useEffect, useMemo } from "react";

import { setAnalyticsExperimentContext, trackExposure } from "./analytics";
import {
  CONTROL,
  EXPERIMENTS,
  parseExperimentOverrides,
  resolveAssignments,
  type ExperimentAssignments,
} from "./experiments";

const VISITOR_KEY = "fy_vid";
const OVERRIDE_KEY = "fy_exp_preview";

function safeLocal(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function safeSession(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Anonymous, first-party id used only to keep A/B variants sticky. */
export function getVisitorId(): string {
  const store = safeLocal();
  const existing = store?.getItem(VISITOR_KEY);
  if (existing) return existing;
  const id = randomId();
  store?.setItem(VISITOR_KEY, id);
  return id;
}

function readOverrides(): ExperimentAssignments {
  if (typeof window === "undefined") return {};
  const session = safeSession();
  const fromUrl = parseExperimentOverrides(window.location.search);
  if (fromUrl === null) {
    session?.removeItem(OVERRIDE_KEY);
    return {};
  }
  let stored: ExperimentAssignments = {};
  try {
    stored = JSON.parse(session?.getItem(OVERRIDE_KEY) ?? "{}") as ExperimentAssignments;
  } catch {
    stored = {};
  }
  const merged = { ...stored, ...fromUrl };
  if (Object.keys(fromUrl).length > 0) {
    session?.setItem(OVERRIDE_KEY, JSON.stringify(merged));
  }
  return merged;
}

/**
 * All experiment assignments for this visitor. Logs an exposure for each
 * running experiment the first time a page that uses them renders.
 */
export function useExperiments(): ExperimentAssignments {
  const assignments = useMemo(() => resolveAssignments(getVisitorId(), readOverrides()), []);

  useEffect(() => {
    setAnalyticsExperimentContext(assignments);
    for (const experiment of EXPERIMENTS) {
      if (experiment.status !== "running") continue;
      trackExposure(experiment.id, assignments[experiment.id] ?? CONTROL);
    }
  }, [assignments]);

  return assignments;
}
