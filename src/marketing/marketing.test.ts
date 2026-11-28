import { describe, expect, it } from "vitest";

import {
  CONTROL,
  assignVariant,
  parseExperimentOverrides,
  resolveAssignments,
  type ExperimentDefinition,
} from "./experiments";
import {
  BASE_CONTENT,
  getActiveCampaign,
  mergeContent,
  resolveLandingContent,
  type Campaign,
} from "./landingContent";
import { HOMEPAGE_LAYOUT, MEDIA_CLIPS } from "../landing-page/homepageConfig";

const experiment: ExperimentDefinition = {
  id: "test-exp",
  hypothesis: "",
  primaryMetric: "x",
  status: "running",
  variants: [
    { id: CONTROL, weight: 50, description: "" },
    { id: "b", weight: 50, description: "" },
  ],
};

describe("experiment assignment", () => {
  it("is sticky for the same visitor", () => {
    expect(assignVariant(experiment, "visitor-1")).toBe(assignVariant(experiment, "visitor-1"));
  });

  it("splits traffic roughly by weight", () => {
    let b = 0;
    for (let i = 0; i < 4000; i += 1) {
      if (assignVariant(experiment, `v-${i}`) === "b") b += 1;
    }
    expect(b / 4000).toBeGreaterThan(0.45);
    expect(b / 4000).toBeLessThan(0.55);
  });

  it("serves the winner to everyone once concluded", () => {
    const done = { ...experiment, status: "concluded" as const, winner: "b" };
    expect(assignVariant(done, "anyone")).toBe("b");
  });

  it("serves control when paused without a winner", () => {
    expect(assignVariant({ ...experiment, status: "paused" }, "anyone")).toBe(CONTROL);
  });

  it("parses preview overrides and the reset keyword", () => {
    expect(parseExperimentOverrides("?fy_exp=a:x,b:y")).toEqual({ a: "x", b: "y" });
    expect(parseExperimentOverrides("?fy_exp=reset")).toBeNull();
    expect(parseExperimentOverrides("?utm_source=x")).toEqual({});
  });

  it("ignores overrides for unknown variants", () => {
    const result = resolveAssignments("v", { "test-exp": "nope" }, [experiment]);
    expect([CONTROL, "b"]).toContain(result["test-exp"]);
    expect(resolveAssignments("v", { "test-exp": "b" }, [experiment])["test-exp"]).toBe("b");
  });
});

describe("landing content", () => {
  it("deep-merges objects and replaces arrays", () => {
    const merged = mergeContent(BASE_CONTENT, { hero: { headline: ["A"] } });
    expect(merged.hero.headline).toEqual(["A"]);
    expect(merged.hero.subhead).toBe(BASE_CONTENT.hero.subhead);
  });

  it("applies variant patches only for non-control assignments", () => {
    const control = resolveLandingContent({ "hero-copy": CONTROL });
    const creator = resolveLandingContent({ "hero-copy": "creator" });
    expect(control.hero.headline).toEqual(BASE_CONTENT.hero.headline);
    expect(creator.hero.headline).not.toEqual(BASE_CONTENT.hero.headline);
  });

  it("switches campaigns on and off by date", () => {
    const campaigns: Campaign[] = [
      {
        id: "sale",
        startsAt: "2026-01-01T00:00:00Z",
        endsAt: "2026-01-08T00:00:00Z",
        patch: { announcement: { badge: "Sale" } },
      },
    ];
    expect(getActiveCampaign(new Date("2026-01-03T00:00:00Z"), campaigns)?.id).toBe("sale");
    expect(getActiveCampaign(new Date("2026-02-01T00:00:00Z"), campaigns)).toBeUndefined();
    const during = resolveLandingContent({}, new Date("2026-01-03T00:00:00Z"), { campaigns });
    expect(during.announcement.badge).toBe("Sale");
  });

  it("only references clips and sections that exist", () => {
    const clipIds = new Set(MEDIA_CLIPS.map((c) => c.id));
    const sectionIds = new Set(HOMEPAGE_LAYOUT.map((s) => s.id));
    const variants = [
      resolveLandingContent({}),
      resolveLandingContent({ "hero-copy": "creator", "landing-layout": "proof-first", "primary-cta": "first-video" }),
    ];
    for (const content of variants) {
      const referenced = [
        content.hero.backgroundClipId,
        ...content.hero.floatingClipIds,
        ...content.reel.rows.flat(),
        ...content.capabilities.steps.map((s) => s.clipId),
        content.festival.clipId,
        content.finalCta.clipId,
      ];
      for (const id of referenced) expect(clipIds.has(id), `missing clip ${id}`).toBe(true);
      for (const id of content.layout) expect(sectionIds.has(id), `missing section ${id}`).toBe(true);
    }
  });
});
