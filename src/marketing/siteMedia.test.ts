import { describe, expect, it } from "vitest";

import { BASE_CONTENT } from "./landingContent";
import { applySiteMedia, getYouTubeId, inferPlatform, siteMediaInputSchema, type SiteMediaItem } from "./siteMedia";

const item = (over: Partial<SiteMediaItem>): SiteMediaItem => ({
  id: "1",
  slot: "reel",
  title: "Clip",
  tag: "",
  videoUrl: "https://cdn.example.com/a.mp4",
  posterUrl: null,
  aspect: "portrait",
  sortOrder: 0,
  enabled: true,
  creditName: null,
  sourceUrl: null,
  platform: null,
  ...over,
});

describe("siteMediaInputSchema", () => {
  it("accepts a FAYAA clip with a video link", () => {
    const r = siteMediaInputSchema.safeParse({ slot: "hero", title: "Ember intro", videoUrl: "https://x.com/a.mp4" });
    expect(r.success).toBe(true);
  });

  it("rejects http links and clips with no media", () => {
    expect(siteMediaInputSchema.safeParse({ slot: "reel", title: "A", videoUrl: "http://x.com/a.mp4" }).success).toBe(false);
    expect(siteMediaInputSchema.safeParse({ slot: "reel", title: "A" }).success).toBe(false);
  });

  it("requires credit and source for around-the-web items", () => {
    expect(siteMediaInputSchema.safeParse({ slot: "web", title: "A", posterUrl: "https://x.com/p.jpg" }).success).toBe(false);
    expect(
      siteMediaInputSchema.safeParse({
        slot: "web",
        title: "A",
        creditName: "@creator",
        sourceUrl: "https://www.youtube.com/watch?v=abcdefghijk",
      }).success
    ).toBe(true);
  });
});

describe("getYouTubeId / inferPlatform", () => {
  it("reads watch, shorts and short links", () => {
    expect(getYouTubeId("https://www.youtube.com/watch?v=abcdefghijk")).toBe("abcdefghijk");
    expect(getYouTubeId("https://youtube.com/shorts/abcdefghijk")).toBe("abcdefghijk");
    expect(getYouTubeId("https://youtu.be/abcdefghijk")).toBe("abcdefghijk");
    expect(getYouTubeId("https://vimeo.com/123")).toBeNull();
  });

  it("guesses the platform from the link", () => {
    expect(inferPlatform({ platform: null, sourceUrl: "https://www.tiktok.com/@a/video/1" })).toBe("TikTok");
    expect(inferPlatform({ platform: "Custom", sourceUrl: null })).toBe("Custom");
  });
});

describe("applySiteMedia", () => {
  it("keeps defaults when there are no rows", () => {
    const out = applySiteMedia(BASE_CONTENT, {}, []);
    expect(out.content).toBe(BASE_CONTENT);
    expect(out.web).toEqual([]);
  });

  it("replaces hero and reel slots and skips hidden rows", () => {
    const out = applySiteMedia(BASE_CONTENT, {}, [
      item({ id: "h1", slot: "hero" }),
      item({ id: "h2", slot: "hero", sortOrder: 1 }),
      item({ id: "r1", slot: "reel" }),
      item({ id: "r2", slot: "reel", sortOrder: 1 }),
      item({ id: "r3", slot: "reel", sortOrder: 2, enabled: false }),
    ]);
    expect(out.content.hero.backgroundClipId).toBe("db-h1");
    expect(out.content.hero.floatingClipIds).toEqual(["db-h2"]);
    expect(out.content.reel.rows).toEqual([["db-r1"], ["db-r2"]]);
    expect(out.clipsById["db-r3"]).toBeUndefined();
  });

  it("passes web items through in order", () => {
    const out = applySiteMedia(BASE_CONTENT, {}, [
      item({ id: "w2", slot: "web", sortOrder: 2 }),
      item({ id: "w1", slot: "web", sortOrder: 1 }),
    ]);
    expect(out.web.map((w) => w.id)).toEqual(["w1", "w2"]);
  });
});
