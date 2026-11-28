import { describe, expect, it } from "vitest";

import { CONTROL } from "./experiments";
import { getActiveCampaign, resolveLandingContent } from "./landingContent";
import {
  SEEDANCE_LAUNCH,
  SEEDANCE_LAUNCH_DATES,
  msUntilNextLaunchChange,
  seedanceLaunchBonusCredits,
  seedanceLaunchPhase,
} from "./seedanceLaunch";
import { seedanceStudioHref, splitCountdown } from "./useSeedanceLaunch";

const before = new Date("2026-11-29T12:00:00Z");
const during = new Date("2026-12-03T12:00:00Z");
const lastMinute = new Date("2026-12-07T23:59:59Z");
const after = new Date("2026-12-08T00:00:00Z");

describe("Seedance Week", () => {
  it("moves from upcoming to live to ended on the configured dates", () => {
    expect(seedanceLaunchPhase(before)).toBe("upcoming");
    expect(seedanceLaunchPhase(new Date(SEEDANCE_LAUNCH.startsAt))).toBe("live");
    expect(seedanceLaunchPhase(during)).toBe("live");
    expect(seedanceLaunchPhase(lastMinute)).toBe("live");
    expect(seedanceLaunchPhase(after)).toBe("ended");
  });

  it("gives the bonus only on purchases paid during the week", () => {
    expect(seedanceLaunchBonusCredits(360, before)).toBe(0);
    expect(seedanceLaunchBonusCredits(360, during)).toBe(90);
    expect(seedanceLaunchBonusCredits(1170, during)).toBe(292);
    expect(seedanceLaunchBonusCredits(3900, lastMinute)).toBe(975);
    expect(seedanceLaunchBonusCredits(360, after)).toBe(0);
    expect(seedanceLaunchBonusCredits(0, during)).toBe(0);
    expect(seedanceLaunchBonusCredits(Number.NaN, during)).toBe(0);
  });

  it("counts down to launch, then to the end of the deal", () => {
    expect(msUntilNextLaunchChange(before)).toBe(Date.parse(SEEDANCE_LAUNCH.startsAt) - before.getTime());
    expect(msUntilNextLaunchChange(during)).toBe(Date.parse(SEEDANCE_LAUNCH.endsAt) - during.getTime());
    expect(msUntilNextLaunchChange(after)).toBeNull();
    expect(splitCountdown(90061000)).toEqual({ d: 1, h: 1, m: 1, s: 1 });
  });

  it("labels the dates in UTC", () => {
    expect(SEEDANCE_LAUNCH_DATES).toBe("Dec 1 to Dec 7");
  });

  it("switches the homepage announcement with the launch", () => {
    const control = { "hero-copy": CONTROL };
    expect(getActiveCampaign(before)?.id).toBe("seedance-teaser");
    expect(getActiveCampaign(during)?.id).toBe("seedance-week");
    expect(getActiveCampaign(after)).toBeUndefined();
    const live = resolveLandingContent(control, during);
    expect(live.announcement.message).toContain("Seedance 2.5 is live");
    expect(live.announcement.cta.href).toBe(SEEDANCE_LAUNCH.path);
  });

  it("builds studio links that open Seedance", () => {
    expect(seedanceStudioHref()).toBe("/studio?model=seedance");
    expect(seedanceStudioHref("a b")).toBe("/studio?model=seedance&prompt=a+b");
  });
});
