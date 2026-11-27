import { describe, expect, it } from "vitest";

import { creditsToProviderCents, PRICE_MARKUP, usdToCredits } from "./pricing";
import { estimateSeedancePlan } from "./seedancePlanning";
import { creditCostForResolution } from "./taskSync";

describe("pricing markup", () => {
  it("charges provider cost x 1.5 at 30 credits per $1", () => {
    expect(PRICE_MARKUP).toBe(1.5);
    expect(usdToCredits(1)).toBe(45);
    expect(usdToCredits(0.25)).toBe(12); // 11.25 rounds up
    expect(usdToCredits(0)).toBe(2); // minimum charge
  });

  it("keeps every model's price above its provider cost", () => {
    // Genjutsu Light 720p 5s = $0.25, Pro 720p 5s = $1.70, Seedance 720p 10s = $3.40
    for (const [credits, usd] of [
      [creditCostForResolution("720p", "light", 5), 0.25],
      [creditCostForResolution("720p", "pro", 5), 1.7],
      [estimateSeedancePlan({ totalDurationSec: 10, resolution: "720p" }).credits, 3.4],
    ] as const) {
      expect(credits / 30).toBeGreaterThanOrEqual(usd * 1.5 - 1e-9);
    }
  });

  it("turns a credit price back into the provider cost", () => {
    expect(creditsToProviderCents(45)).toBe(100);
    expect(creditsToProviderCents(153)).toBe(340);
  });
});
