import { useEffect, useState } from "react";

import { msUntilNextLaunchChange, seedanceLaunchPhase, type SeedanceLaunchPhase } from "./seedanceLaunch";

export interface SeedanceLaunchState {
  phase: SeedanceLaunchPhase;
  /** Milliseconds to the next change (launch start or deal end), or null. */
  remainingMs: number | null;
}

/** Launch phase plus a countdown that ticks every second while one is running. */
export function useSeedanceLaunch(): SeedanceLaunchState {
  const [now, setNow] = useState(() => new Date());
  const phase = seedanceLaunchPhase(now);
  const ticking = phase === "upcoming" || phase === "live";

  useEffect(() => {
    if (!ticking) return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [ticking]);

  return { phase, remainingMs: msUntilNextLaunchChange(now) };
}

/** Days, hours, minutes and seconds left, for a countdown display. */
export function splitCountdown(ms: number): { d: number; h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

/** Studio link that opens Seedance, optionally with a prompt filled in. */
export function seedanceStudioHref(prompt?: string): string {
  const params = new URLSearchParams({ model: "seedance" });
  if (prompt) params.set("prompt", prompt);
  return `/studio?${params.toString()}`;
}
