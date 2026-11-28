import type { PublicShowcaseItem, ShowcaseCategory } from "../video-studio/showcaseService";

export type HomepageSectionId =
  | "hero-showcase"
  | "reel-marquee"
  | "capabilities-story"
  | "community-showcase"
  | "tools-bento"
  | "workflow-templates"
  | "film-festival"
  | "around-the-web"
  | "final-cta";

export interface HomepageSectionConfig {
  id: HomepageSectionId;
  enabled: boolean;
  ariaLabel: string;
}

/**
 * Default order of the homepage. Experiments can reorder it (see
 * src/marketing/landingContent.ts), and any section can be switched off here
 * without touching JSX.
 */
export const HOMEPAGE_LAYOUT: HomepageSectionConfig[] = [
  { id: "hero-showcase", enabled: true, ariaLabel: "FAYAA video studio" },
  { id: "reel-marquee", enabled: true, ariaLabel: "Made with FAYAA" },
  { id: "capabilities-story", enabled: true, ariaLabel: "How FAYAA Genjutsu works" },
  { id: "community-showcase", enabled: true, ariaLabel: "FAYAA Genjutsu by community" },
  { id: "tools-bento", enabled: true, ariaLabel: "FAYAA tools and models" },
  { id: "workflow-templates", enabled: true, ariaLabel: "One-click Genjutsu templates" },
  { id: "film-festival", enabled: true, ariaLabel: "FAYAA Global Film Festival" },
  { id: "around-the-web", enabled: true, ariaLabel: "AI video from around the web" },
  { id: "final-cta", enabled: true, ariaLabel: "Start creating with FAYAA" },
];

/**
 * Every video or still the marketing site plays lives in this library and is
 * referenced by id from src/marketing/landingContent.ts. To swap footage:
 * upload to R2 and set videoStorageKey/posterStorageKey (resolved server-side),
 * or paste a public URL into videoUrl/poster. Clips without video still move,
 * with a slow push-in on the poster.
 */
export interface MediaClip {
  id: string;
  title: string;
  /** Short label shown on the tile, e.g. "Motion transfer". */
  tag: string;
  aspect: "portrait" | "landscape" | "square";
  poster: string;
  posterStorageKey?: string;
  videoUrl?: string;
  videoStorageKey?: string;
  /** Optional remix prompt when the clip is opened in the studio. */
  prompt?: string;
}

/** FAYAA's own renders. Swap or add clips here, or without code at /admin/site-media. */
const CLIP_CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3DNQ4ZWloyKLj4vd7CJjEXvpMje/";
const clip = (file: string) => `${CLIP_CDN}${file}`;

export const MEDIA_CLIPS: MediaClip[] = [
  { id: "ember-hero", title: "Ember rises", tag: "FAYAA", aspect: "landscape", poster: "", videoUrl: clip("hf_20261128_025758_459b7849-323f-4918-a21b-e6ea5272239b.mp4"), prompt: "Cinematic reveal of my product rising out of sparks and smoke" },
  { id: "trend-dance", title: "Bedroom dance trend", tag: "Trend", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_030134_96c1f000-6b96-4b2e-8fd5-3d1865b11988.mp4"), prompt: "Put me in this trending dance, same moves, LED bedroom" },
  { id: "snap-transition", title: "Snap outfit transition", tag: "Transition", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_030134_102b7d11-1578-4dec-b182-f87c6f0b1e18.mp4"), prompt: "Snap transition from hoodie to an evening look on a neon street" },
  { id: "sneaker-hook", title: "Sneaker slam hook", tag: "Product hook", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_030257_7ab6f6bc-4585-4337-8563-6cc435565ff7.mp4"), prompt: "Turn my sneaker into a 3-second hook that stops the scroll" },
  { id: "street-interview", title: "Street interview twist", tag: "Format", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_030257_9a8bb967-602a-48d4-abd6-a68c38b64456.mp4"), prompt: "Street interview that turns into a movie trailer halfway" },
  { id: "grwm-anime", title: "GRWM anime switch", tag: "Restyle", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_030533_c8b52ae6-88d4-45aa-9296-0e3a0b1a8e01.mp4"), prompt: "Get ready with me, then the room turns into a 90s anime opening" },
  { id: "gym-spin", title: "Box jump 360", tag: "Sports", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_030533_17ba10ab-4d33-4545-837f-f9cfa03b8949.mp4"), prompt: "Slow-motion box jump with a 360 spin into a rainy rooftop" },
  { id: "burger-drop", title: "Burger drop", tag: "Food", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_030533_2fa9d1e7-c1a7-4c0b-a5fb-0c011a5cd71e.mp4"), prompt: "Slow-motion food drop hook with a chef reveal" },
  { id: "night-market-pov", title: "Night market POV", tag: "POV", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_030711_4312d99d-4f8e-4f75-b011-e532274daf2b.mp4"), prompt: "POV run through a night market ending on fireworks" },
  { id: "skate-dog", title: "Skater dog", tag: "Pets", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_030810_998545c4-5d5f-4c77-a3f0-1d0e246e6215.mp4"), prompt: "My dog in sunglasses skateboarding down the boardwalk" },
  { id: "perfume-spin", title: "Perfume spin ad", tag: "Product ad", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_031406_89742dfc-08de-497d-b443-12e70ae75574.mp4"), prompt: "Glossy perfume ad with light ribbons and a hand catch" },
  { id: "cliff-freeze", title: "Cliff jump freeze", tag: "Travel", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_031406_2b0b45d1-ba4b-4f7a-9c51-1e93b1662590.mp4"), prompt: "Cliff jump with a mid-air freeze and spin" },
  { id: "sneaker-unbox", title: "Glow unboxing", tag: "Unboxing", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_031406_c23df597-c0f5-4cc7-9121-f9b40e261cd3.mp4"), prompt: "Unboxing with light spilling out and a floating spin" },
  { id: "ember-dance", title: "Ember dance break", tag: "FAYAA", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_025758_b31435b9-e3f7-4cfd-8d0b-6e600766693d.mp4"), prompt: "Dance trend with flame trails on every move" },
  { id: "ember-rooftop", title: "Ember on the rooftop", tag: "FAYAA", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_025758_fdbc10c9-ffcd-4405-aaf5-b9430ae39110.mp4"), prompt: "Neon rooftop in the rain, slow orbit" },
  { id: "ember-director", title: "Ember calls action", tag: "FAYAA", aspect: "landscape", poster: "", videoUrl: clip("hf_20261128_025758_f8124270-1ece-4843-b92b-f8b73ebf0afd.mp4"), prompt: "Director's chair, clapperboard snaps with sparks" },
  { id: "ember-sprint", title: "Ember stadium sprint", tag: "FAYAA", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_025758_3c570d6f-bbb5-4155-8c40-15c99f3cf8bb.mp4"), prompt: "Stadium tunnel sprint into floodlights" },
  { id: "ember-sneakers", title: "Ember sneaker swap", tag: "FAYAA", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_025758_fb252d4d-23d4-4699-89e4-7c70863fc7a4.mp4"), prompt: "Swap these sneakers for @Image1 in a swirl of fire" },
  { id: "ember-portrait", title: "Ember at midnight", tag: "FAYAA", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_025758_338bb356-4c20-44c0-8c64-9ed33e86a310.mp4"), prompt: "Moody midnight portrait, flame-lit" },
  { id: "ember-crowd", title: "Ember live", tag: "FAYAA", aspect: "landscape", poster: "", videoUrl: clip("hf_20261128_025758_bd1e96b5-025d-4726-8ba2-f7e9669be6f0.mp4"), prompt: "On stage in front of a huge crowd" },
  { id: "ember-skate", title: "Ember skate line", tag: "FAYAA", aspect: "portrait", poster: "", videoUrl: clip("hf_20261128_025758_b5b4034d-1193-4fd5-8589-0979130f0b16.mp4"), prompt: "Skatepark line with flames on every trick" },
  { id: "ember-premiere", title: "Ember premiere night", tag: "FAYAA", aspect: "landscape", poster: "", videoUrl: clip("hf_20261128_025758_e04dc971-e81d-4122-87fb-a18ccc012d65.mp4"), prompt: "Festival premiere in a dark cinema" },
];

export function getMediaClip(id: string): MediaClip | undefined {
  return MEDIA_CLIPS.find((clip) => clip.id === id);
}

/** Resolves R2 keys on a clip into playable URLs (server map, then public base). */
export function resolveMediaClip(
  clip: MediaClip,
  resolvedStorageUrls?: Record<string, string>,
  publicBaseUrl?: string
): MediaClip {
  const videoUrl = clip.videoStorageKey
    ? resolveStorageUrl(clip.videoStorageKey, clip.videoUrl ?? "", resolvedStorageUrls, publicBaseUrl)
    : clip.videoUrl;
  return {
    ...clip,
    poster: resolveStorageUrl(clip.posterStorageKey, clip.poster, resolvedStorageUrls, publicBaseUrl),
    ...(videoUrl ? { videoUrl } : {}),
  };
}

export interface HeroShowcaseCardConfig {
  id: string;
  title: string;
  subtitle: string;
  highlightTitle?: boolean;
  kind: "genjutsu" | "playable" | "factory";
  videoUrl: string;
  videoStorageKey?: string;
  inputImage: string;
  inputStorageKey?: string;
  outputImage: string;
  outputStorageKey?: string;
  loggedInInputImage: string;
  loggedInOutputImage: string;
  badgeText?: string;
  comingSoon?: boolean;
}

export const HERO_SHOWCASE_CARDS: HeroShowcaseCardConfig[] = [
  {
    id: "fayaa-genjutsu",
    title: "FAYAA GENJUTSU",
    subtitle:
      "Motion transfer, object swap & video editing — also supports videos up to 2+ minutes ›",
    highlightTitle: true,
    kind: "genjutsu",
    badgeText: "LIVE NOW",
    comingSoon: false,
    videoUrl:
      "https://d3u0tzju9qaucj.cloudfront.net/4f337d0a-8b91-49a0-a8a1-b1231e0187fe/01a193ff-30aa-7895-a568-97ee1d417087/1a93cb6a-1214-48db-b8ec-e903f2efccc3.mp4",
    inputImage: "",
    outputImage: "",
    loggedInInputImage: "",
    loggedInOutputImage: "",
  },
  {
    id: "fayaa-playable",
    title: "FAYAA PLAYABLE",
    subtitle: "Interactive motion worlds from a single prompt — coming soon.",
    kind: "playable",
    badgeText: "COMING SOON",
    comingSoon: true,
    videoUrl:
      clip("hf_20261128_025758_459b7849-323f-4918-a21b-e6ea5272239b.mp4"),
    inputImage: "",
    outputImage: "",
    loggedInInputImage: "",
    loggedInOutputImage: "",
  },
  {
    id: "content-factory",
    title: "CONTENT FACTORY",
    subtitle: "Automated multi-episode social series pipelines — coming soon.",
    kind: "factory",
    badgeText: "COMING SOON",
    comingSoon: true,
    videoUrl:
      "https://d3u0tzju9qaucj.cloudfront.net/4f337d0a-8b91-49a0-a8a1-b1231e0187fe/01a193ff-30aa-7895-a568-97ee1d417087/1a93cb6a-1214-48db-b8ec-e903f2efccc3.mp4",
    inputImage: "",
    outputImage: "",
    loggedInInputImage: "",
    loggedInOutputImage: "",
  },
];

export interface CommunityShotConfig {
  id: string;
  title: string;
  creator: string;
  aspect: "portrait" | "landscape";
  src: string;
  posterStorageKey?: string;
  videoUrl?: string;
  videoStorageKey?: string;
  sourceVideoUrl: string;
  referenceImageUrl: string;
  prompt: string;
  category: ShowcaseCategory;
  isFromStorage?: boolean;
}

/**
 * Curated community fallback, built only from FAYAA's own clips (no stock
 * photos, no invented creator handles). Real community posts from storage are
 * merged in front of these at runtime.
 */
const COMMUNITY_FALLBACK_CLIPS: Array<{ clipId: string; category: ShowcaseCategory }> = [
  { clipId: "ember-sprint", category: "action" },
  { clipId: "trend-dance", category: "dance" },
  { clipId: "snap-transition", category: "fashion" },
  { clipId: "ember-crowd", category: "action" },
  { clipId: "grwm-anime", category: "fashion" },
  { clipId: "ember-dance", category: "dance" },
  { clipId: "sneaker-unbox", category: "ugc" },
  { clipId: "gym-spin", category: "action" },
  { clipId: "perfume-spin", category: "ugc" },
];

export const COMMUNITY_GENJUTSU_SHOTS: CommunityShotConfig[] = COMMUNITY_FALLBACK_CLIPS.flatMap(
  ({ clipId, category }, index) => {
    const media = MEDIA_CLIPS.find((c) => c.id === clipId);
    if (!media) return [];
    return [
      {
        id: `comm-${index + 1}`,
        title: media.title,
        creator: "Made with FAYAA",
        aspect: media.aspect === "landscape" ? "landscape" : "portrait",
        src: media.poster,
        videoUrl: media.videoUrl,
        sourceVideoUrl: media.videoUrl ?? "",
        referenceImageUrl: "",
        prompt: media.prompt ?? "",
        category,
      },
    ];
  }
);

export type BentoToolIconKey =
  | "wand-sparkles"
  | "bar-chart"
  | "cpu"
  | "clapperboard"
  | "wand2"
  | "sparkles";

export interface BentoToolConfig {
  id: string;
  title: string;
  badge: string;
  available: boolean;
  description: string;
  iconKey: BentoToolIconKey;
  gradient: "teal" | "blue" | "purple" | "orange" | "pink" | "green";
  href: string;
}

export const BENTO_TOOLS: BentoToolConfig[] = [
  {
    id: "genjutsu",
    title: "FAYAA Genjutsu",
    badge: "LIVE",
    available: true,
    description:
      "Motion transfer, object swap & video restyle — edit videos from 4s up to 2+ minutes ›",
    iconKey: "wand-sparkles",
    gradient: "teal",
    href: "/studio",
  },
  {
    id: "seedance",
    title: "Seedance 2.5",
    badge: "COMING SOON",
    available: false,
    description: "Next-gen text & image-to-video synthesis model",
    iconKey: "bar-chart",
    gradient: "blue",
    href: "#tools-bento",
  },
  {
    id: "supercomputer",
    title: "Supercomputer",
    badge: "COMING SOON",
    available: false,
    description: "Autonomous multi-shot agent powered by Genjutsu Director",
    iconKey: "cpu",
    gradient: "purple",
    href: "#tools-bento",
  },
  {
    id: "cinema-studio",
    title: "Cinema Studio 4.0",
    badge: "COMING SOON",
    available: false,
    description: "Direct multi-angle cinematic scenes and camera moves",
    iconKey: "clapperboard",
    gradient: "orange",
    href: "#tools-bento",
  },
  {
    id: "mcp",
    title: "FAYAA MCP for Creators",
    badge: "COMING SOON",
    available: false,
    description: "Generate motion transfers directly from Claude & Cursor",
    iconKey: "wand2",
    gradient: "pink",
    href: "#tools-bento",
  },
  {
    id: "influencer",
    title: "AI Influencer",
    badge: "COMING SOON",
    available: false,
    description: "Persistent virtual persona & wardrobe studio",
    iconKey: "sparkles",
    gradient: "green",
    href: "#tools-bento",
  },
];

/**
 * Returns only enabled homepage sections in their configured display order.
 */
export function getActiveHomepageSections(
  layout: HomepageSectionConfig[] = HOMEPAGE_LAYOUT
): HomepageSectionConfig[] {
  return layout.filter((section) => section.enabled);
}

/**
 * Collects any curated R2 storage keys declared in homepageConfig so the server
 * can batch-resolve public/presigned URLs for them on demand.
 */
export function getCuratedHomepageStorageKeys(): string[] {
  const keys = new Set<string>();
  for (const card of HERO_SHOWCASE_CARDS) {
    if (card.videoStorageKey) keys.add(card.videoStorageKey);
    if (card.inputStorageKey) keys.add(card.inputStorageKey);
    if (card.outputStorageKey) keys.add(card.outputStorageKey);
  }
  for (const shot of COMMUNITY_GENJUTSU_SHOTS) {
    if (shot.videoStorageKey) keys.add(shot.videoStorageKey);
    if (shot.posterStorageKey) keys.add(shot.posterStorageKey);
  }
  for (const clip of MEDIA_CLIPS) {
    if (clip.videoStorageKey) keys.add(clip.videoStorageKey);
    if (clip.posterStorageKey) keys.add(clip.posterStorageKey);
  }
  return Array.from(keys);
}

/**
 * Resolves a media asset from an optional R2 storage key map first, then falls back
 * to the configured HTTP URL or optional VITE_R2_PUBLIC_URL prefix.
 */
export function resolveStorageUrl(
  storageKey: string | undefined,
  fallbackUrl: string,
  resolvedStorageUrls?: Record<string, string>,
  publicBaseUrl?: string
): string {
  if (storageKey) {
    const resolved = resolvedStorageUrls?.[storageKey];
    if (resolved && resolved.trim()) {
      return resolved.trim();
    }
    if (publicBaseUrl && publicBaseUrl.trim()) {
      return `${publicBaseUrl.replace(/\/$/, "")}/${storageKey.replace(/^\//, "")}`;
    }
  }
  return fallbackUrl;
}

/**
 * Merges live public user R2/VideoTask items ahead of curated static fallback shots,
 * keeping existing editorial shots visible when storage has fewer public videos.
 */
export function mergeCommunityShowcaseShots(
  publicVideos: PublicShowcaseItem[] = [],
  staticFallback: CommunityShotConfig[] = COMMUNITY_GENJUTSU_SHOTS,
  resolvedStorageUrls?: Record<string, string>,
  publicBaseUrl?: string
): CommunityShotConfig[] {
  const dynamicShots: CommunityShotConfig[] = publicVideos.map((item) => ({
    id: item.id,
    title: item.title,
    creator: item.creator,
    aspect: item.aspect,
    src: item.posterUrl || item.videoUrl,
    videoUrl: item.videoUrl,
    sourceVideoUrl: item.sourceVideoUrl,
    referenceImageUrl: item.referenceImageUrl || item.posterUrl || item.videoUrl,
    prompt: item.prompt,
    category: item.category,
    isFromStorage: true,
  }));

  const curatedShots = staticFallback.map((shot) => ({
    ...shot,
    src: resolveStorageUrl(
      shot.posterStorageKey,
      shot.src,
      resolvedStorageUrls,
      publicBaseUrl
    ),
    videoUrl: shot.videoUrl
      ? resolveStorageUrl(
          shot.videoStorageKey,
          shot.videoUrl,
          resolvedStorageUrls,
          publicBaseUrl
        )
      : shot.videoStorageKey
        ? resolveStorageUrl(
            shot.videoStorageKey,
            "",
            resolvedStorageUrls,
            publicBaseUrl
          ) || undefined
        : undefined,
  }));

  return [...dynamicShots, ...curatedShots];
}

/**
 * Resolves hero card media URLs (including any curated R2 keys or admin-featured live videos).
 */
export function resolveHeroShowcaseCards(
  heroCards: HeroShowcaseCardConfig[] = HERO_SHOWCASE_CARDS,
  heroFeatured: PublicShowcaseItem[] = [],
  resolvedStorageUrls?: Record<string, string>,
  publicBaseUrl?: string
): HeroShowcaseCardConfig[] {
  const resolvedCards = heroCards.map((card) => ({
    ...card,
    videoUrl: resolveStorageUrl(
      card.videoStorageKey,
      card.videoUrl,
      resolvedStorageUrls,
      publicBaseUrl
    ),
    inputImage: resolveStorageUrl(
      card.inputStorageKey,
      card.inputImage,
      resolvedStorageUrls,
      publicBaseUrl
    ),
    outputImage: resolveStorageUrl(
      card.outputStorageKey,
      card.outputImage,
      resolvedStorageUrls,
      publicBaseUrl
    ),
  }));

  const primaryFeatured = heroFeatured[0];
  if (!primaryFeatured) {
    return resolvedCards;
  }

  return resolvedCards.map((card) =>
    card.id === "fayaa-genjutsu"
      ? {
          ...card,
          videoUrl: primaryFeatured.videoUrl,
          ...(primaryFeatured.posterUrl
            ? { outputImage: primaryFeatured.posterUrl }
            : {}),
        }
      : card
  );
}
