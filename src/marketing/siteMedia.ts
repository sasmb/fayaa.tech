/**
 * Owner-managed marketing media (the SiteMedia table) and how it overrides
 * the defaults in landingContent.ts / homepageConfig.ts. Pure functions only,
 * so both the client and the tests can use them.
 */
import * as z from "zod";

import type { MediaClip } from "../landing-page/homepageConfig";
import type { LandingContent } from "./landingContent";

export const SITE_MEDIA_SLOTS = [
  { id: "hero", label: "Hero", help: "First clip is the full-screen background; the next three float beside the headline." },
  { id: "reel", label: "Reels", help: "Endless rows under the hero. Clips alternate between the two rows." },
  { id: "story", label: "How it works", help: "One clip per step, in order (trend, product swap, restyle, ship it)." },
  { id: "tools", label: "Tools tile", help: "The big feature tile in the tools grid." },
  { id: "festival", label: "Festival band", help: "Background of the festival banner." },
  { id: "final", label: "Closing CTA", help: "Background of the last call to action." },
  { id: "web", label: "Around the web", help: "Other creators' AI work, always credited and linked to the original." },
] as const;

export type SiteMediaSlot = (typeof SITE_MEDIA_SLOTS)[number]["id"];
export const SITE_MEDIA_SLOT_IDS = SITE_MEDIA_SLOTS.map((s) => s.id) as [SiteMediaSlot, ...SiteMediaSlot[]];

export type SiteMediaItem = {
  id: string;
  slot: string;
  title: string;
  tag: string;
  videoUrl: string | null;
  posterUrl: string | null;
  aspect: string;
  sortOrder: number;
  enabled: boolean;
  creditName: string | null;
  sourceUrl: string | null;
  platform: string | null;
};

const httpsUrl = z
  .string()
  .trim()
  .url()
  .refine((u) => u.startsWith("https://"), "Use an https:// link");

const optionalUrl = z.union([httpsUrl, z.literal("")]).optional().transform((v) => (v ? v : null));
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

export const siteMediaInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    slot: z.enum(SITE_MEDIA_SLOT_IDS),
    title: z.string().trim().min(1, "Add a title").max(120),
    tag: z.string().trim().max(40).optional().default(""),
    videoUrl: optionalUrl,
    posterUrl: optionalUrl,
    aspect: z.enum(["portrait", "landscape", "square"]).default("landscape"),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
    enabled: z.boolean().default(true),
    creditName: optionalText(80),
    sourceUrl: optionalUrl,
    platform: optionalText(40),
  })
  .superRefine((value, ctx) => {
    if (!value.videoUrl && !value.posterUrl && !(value.slot === "web" && value.sourceUrl)) {
      ctx.addIssue({ code: "custom", message: "Add a video or poster link", path: ["videoUrl"] });
    }
    if (value.slot === "web") {
      if (!value.creditName) {
        ctx.addIssue({ code: "custom", message: "Credit the creator", path: ["creditName"] });
      }
      if (!value.sourceUrl) {
        ctx.addIssue({ code: "custom", message: "Link to the original post", path: ["sourceUrl"] });
      }
    }
  });

export type SiteMediaInput = z.input<typeof siteMediaInputSchema>;

/** YouTube id from watch, shorts, embed or youtu.be links, if any. */
export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (/(^|\.)youtube(-nocookie)?\.com$/.test(u.hostname)) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const match = u.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,})/);
      if (match) return match[2] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Guesses the platform label from the source link when none was given. */
export function inferPlatform(item: Pick<SiteMediaItem, "platform" | "sourceUrl">): string {
  if (item.platform) return item.platform;
  const host = (() => {
    try {
      return new URL(item.sourceUrl ?? "").hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  if (/youtu/.test(host)) return "YouTube";
  if (/tiktok/.test(host)) return "TikTok";
  if (/instagram/.test(host)) return "Instagram";
  if (/(^|\.)x\.com$|twitter/.test(host)) return "X";
  if (/vimeo/.test(host)) return "Vimeo";
  return host || "Web";
}

export function siteMediaToClip(item: SiteMediaItem): MediaClip {
  const youTubeId = getYouTubeId(item.sourceUrl);
  const poster =
    item.posterUrl ?? (youTubeId ? `https://i.ytimg.com/vi/${youTubeId}/hqdefault.jpg` : "");
  return {
    id: `db-${item.id}`,
    title: item.title,
    tag: item.tag,
    aspect: item.aspect === "portrait" || item.aspect === "square" ? item.aspect : "landscape",
    poster,
    ...(item.videoUrl ? { videoUrl: item.videoUrl } : {}),
  };
}

function bySlot(items: SiteMediaItem[], slot: SiteMediaSlot): SiteMediaItem[] {
  return items
    .filter((i) => i.enabled && i.slot === slot)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Lays owner-managed media over the coded defaults. Any slot with at least
 * one enabled row replaces that slot's default clips; empty slots keep the
 * defaults, so the site never shows a hole.
 */
export function applySiteMedia(
  content: LandingContent,
  clipsById: Record<string, MediaClip>,
  items: SiteMediaItem[] = []
): { content: LandingContent; clipsById: Record<string, MediaClip>; toolsClipId: string; web: SiteMediaItem[] } {
  const clips = { ...clipsById };
  const register = (item: SiteMediaItem) => {
    const clip = siteMediaToClip(item);
    clips[clip.id] = clip;
    return clip.id;
  };

  let next: LandingContent = content;

  const hero = bySlot(items, "hero").map(register);
  if (hero.length > 0) {
    next = {
      ...next,
      hero: {
        ...next.hero,
        backgroundClipId: hero[0]!,
        floatingClipIds: hero.length > 1 ? hero.slice(1, 4) : next.hero.floatingClipIds,
      },
    };
  }

  const reel = bySlot(items, "reel").map(register);
  if (reel.length > 0) {
    const rowA = reel.filter((_, i) => i % 2 === 0);
    const rowB = reel.filter((_, i) => i % 2 === 1);
    next = { ...next, reel: { ...next.reel, rows: rowB.length ? [rowA, rowB] : [rowA] } };
  }

  const story = bySlot(items, "story").map(register);
  if (story.length > 0) {
    next = {
      ...next,
      capabilities: {
        ...next.capabilities,
        steps: next.capabilities.steps.map((step, i) => ({ ...step, clipId: story[i] ?? step.clipId })),
      },
    };
  }

  const festival = bySlot(items, "festival").map(register);
  if (festival[0]) next = { ...next, festival: { ...next.festival, clipId: festival[0] } };

  const final = bySlot(items, "final").map(register);
  if (final[0]) next = { ...next, finalCta: { ...next.finalCta, clipId: final[0] } };

  const tools = bySlot(items, "tools").map(register);

  return {
    content: next,
    clipsById: clips,
    toolsClipId: tools[0] ?? "ember-director",
    web: bySlot(items, "web"),
  };
}
