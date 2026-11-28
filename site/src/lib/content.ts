/**
 * Build-time homepage data. Copy, clips, campaigns and A/B variants come
 * from the app's own config (src/marketing/landingContent.ts and
 * src/landing-page/homepageConfig.ts), and owner-managed clips from
 * /admin/site-media are laid over them, exactly as the app's homepage does.
 */
import { MEDIA_CLIPS, type MediaClip } from "../../../src/landing-page/homepageConfig";
import { CONTROL, EXPERIMENTS } from "../../../src/marketing/experiments";
import { resolveLandingContent, type LandingContent } from "../../../src/marketing/landingContent";
import { applySiteMedia, type SiteMediaItem } from "../../../src/marketing/siteMedia";
import { API_URL } from "../config";

export type { LandingContent, MediaClip, SiteMediaItem };
export { CONTROL, EXPERIMENTS };

let siteMediaPromise: Promise<SiteMediaItem[]> | undefined;

/** Fetches /api/public/site-media once per build. Never fails the build. */
export function loadSiteMedia(): Promise<SiteMediaItem[]> {
  siteMediaPromise ??= (async () => {
    const url = `${API_URL}/api/public/site-media`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { items?: SiteMediaItem[] };
      const items = Array.isArray(body.items) ? body.items : [];
      console.log(`[site-media] ${items.length} owner-managed clips from ${url}`);
      return items;
    } catch (error) {
      console.warn(`[site-media] using coded defaults (${url}: ${(error as Error).message})`);
      return [];
    }
  })();
  return siteMediaPromise;
}

const DEFAULT_CLIPS: Record<string, MediaClip> = Object.fromEntries(MEDIA_CLIPS.map((c) => [c.id, c]));

export interface HomepageData {
  /** Content for everyone in the control group. */
  content: LandingContent;
  /** Content for each non-control variant, keyed "experiment:variant". */
  variants: Record<string, LandingContent>;
  clips: Record<string, MediaClip>;
  toolsClipId: string;
  web: SiteMediaItem[];
}

export async function loadHomepage(now = new Date()): Promise<HomepageData> {
  const items = await loadSiteMedia();
  const control = Object.fromEntries(EXPERIMENTS.map((e) => [e.id, CONTROL]));
  const base = applySiteMedia(resolveLandingContent(control, now), DEFAULT_CLIPS, items);

  const variants: Record<string, LandingContent> = {};
  for (const experiment of EXPERIMENTS) {
    for (const variant of experiment.variants) {
      if (variant.id === CONTROL) continue;
      const resolved = resolveLandingContent({ ...control, [experiment.id]: variant.id }, now);
      variants[`${experiment.id}:${variant.id}`] = applySiteMedia(resolved, DEFAULT_CLIPS, items).content;
    }
  }

  return { content: base.content, variants, clips: base.clipsById, toolsClipId: base.toolsClipId, web: base.web };
}

export function getClip(clips: Record<string, MediaClip>, id: string): MediaClip | undefined {
  return clips[id] ?? DEFAULT_CLIPS[id];
}

export function clipsFor(ids: string[]): MediaClip[] {
  return ids.map((id) => DEFAULT_CLIPS[id]).filter((c): c is MediaClip => Boolean(c));
}
