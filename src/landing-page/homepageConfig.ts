import type { PublicShowcaseItem, ShowcaseCategory } from "../video-studio/showcaseService";

export type HomepageSectionId =
  | "hero-showcase"
  | "reel-marquee"
  | "capabilities-story"
  | "community-showcase"
  | "tools-bento"
  | "workflow-templates"
  | "film-festival"
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

const GENJUTSU_DEMO_VIDEO =
  "https://d3u0tzju9qaucj.cloudfront.net/4f337d0a-8b91-49a0-a8a1-b1231e0187fe/01a193ff-30aa-7895-a568-97ee1d417087/1a93cb6a-1214-48db-b8ec-e903f2efccc3.mp4";

const unsplash = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

export const MEDIA_CLIPS: MediaClip[] = [
  {
    id: "hero-genjutsu",
    title: "Genjutsu motion transfer",
    tag: "Motion transfer",
    aspect: "landscape",
    poster: unsplash("photo-1534528741775-53994a69daeb", 1600),
    videoUrl: GENJUTSU_DEMO_VIDEO,
  },
  {
    id: "locker-swap",
    title: "Tactical locker room swap",
    tag: "Recast",
    aspect: "portrait",
    poster: unsplash("photo-1507003211169-0a1dd7228f2d", 700),
    videoUrl: GENJUTSU_DEMO_VIDEO,
  },
  {
    id: "cash-flex",
    title: "Penthouse flex reel",
    tag: "UGC",
    aspect: "portrait",
    poster: unsplash("photo-1534528741775-53994a69daeb", 700),
  },
  {
    id: "stadium-sprint",
    title: "Sideline sprint",
    tag: "Sports",
    aspect: "portrait",
    poster: unsplash("photo-1500648767791-00dcc994a43e", 700),
  },
  {
    id: "studio-dance",
    title: "Contemporary studio dance",
    tag: "Choreography",
    aspect: "landscape",
    poster: unsplash("photo-1517841905240-472988babdf9", 900),
    videoUrl: GENJUTSU_DEMO_VIDEO,
  },
  {
    id: "midnight-portrait",
    title: "Midnight portrait",
    tag: "Restyle",
    aspect: "portrait",
    poster: unsplash("photo-1494790108377-be9c29b29330", 700),
  },
  {
    id: "freestyle",
    title: "Freestyle groove",
    tag: "Choreography",
    aspect: "portrait",
    poster: unsplash("photo-1539571696357-5a69c17a67c6", 700),
  },
  {
    id: "object-swap",
    title: "Scale model swap",
    tag: "Object swap",
    aspect: "landscape",
    poster: unsplash("photo-1518709268805-4e9042af9f23", 900),
  },
  {
    id: "crowd",
    title: "Championship night",
    tag: "Cinematic",
    aspect: "landscape",
    poster: unsplash("photo-1542751371-adc38448a05e", 900),
  },
  {
    id: "streetwear",
    title: "Streetwear ensemble",
    tag: "Fashion",
    aspect: "portrait",
    poster: unsplash("photo-1578632767115-351597cf2477", 700),
  },
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
    inputImage:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
    outputImage:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
    loggedInInputImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    loggedInOutputImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80",
  },
  {
    id: "fayaa-playable",
    title: "FAYAA PLAYABLE",
    subtitle: "Interactive motion worlds from a single prompt — coming soon.",
    kind: "playable",
    badgeText: "COMING SOON",
    comingSoon: true,
    videoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    inputImage:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&q=80",
    outputImage:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&q=80",
    loggedInInputImage:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&q=80",
    loggedInOutputImage:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&q=80",
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
    inputImage:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
    outputImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
    loggedInInputImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
    loggedInOutputImage:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
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

export const COMMUNITY_GENJUTSU_SHOTS: CommunityShotConfig[] = [
  {
    id: "comm-1",
    title: "Tactical Locker Room Swap",
    creator: "@kuro_vfx",
    aspect: "landscape",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80",
    videoUrl:
      "https://d3u0tzju9qaucj.cloudfront.net/4f337d0a-8b91-49a0-a8a1-b1231e0187fe/01a193ff-30aa-7895-a568-97ee1d417087/1a93cb6a-1214-48db-b8ec-e903f2efccc3.mp4",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    prompt:
      "Recast the subject into @Image1 inside a cinematic locker room with crisp prop tracking and dramatic rim light.",
    category: "action",
  },
  {
    id: "comm-2",
    title: "Viral Cash Flex Reel",
    creator: "@neoviral.ai",
    aspect: "portrait",
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&q=80",
    videoUrl:
      "https://d3u0tzju9qaucj.cloudfront.net/4f337d0a-8b91-49a0-a8a1-b1231e0187fe/01a193ff-30aa-7895-a568-97ee1d417087/1a93cb6a-1214-48db-b8ec-e903f2efccc3.mp4",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
    prompt:
      "Transform the performer into @Image1 with locked facial identity, luxury penthouse lighting, ultra-sharp hand motion.",
    category: "ugc",
  },
  {
    id: "comm-3",
    title: "Stadium Pitch Sideline Sprint",
    creator: "@stadium_gen",
    aspect: "portrait",
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&q=80",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
    prompt:
      "Recast the athlete on the pitch into @Image1 preserving full-body stride physics and crowd stadium atmosphere.",
    category: "action",
  },
  {
    id: "comm-4",
    title: "Contemporary Studio Dance",
    creator: "@mira.motion",
    aspect: "landscape",
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&q=80",
    videoUrl:
      "https://d3u0tzju9qaucj.cloudfront.net/4f337d0a-8b91-49a0-a8a1-b1231e0187fe/01a193ff-30aa-7895-a568-97ee1d417087/1a93cb6a-1214-48db-b8ec-e903f2efccc3.mp4",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
    prompt:
      "Recast the dancer into @Image1 executing fluid contemporary choreography against emerald studio backdrop.",
    category: "dance",
  },
  {
    id: "comm-5",
    title: "Midnight Portrait Motion Transfer",
    creator: "@aria.synth",
    aspect: "portrait",
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&q=80",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
    prompt:
      "Recast speaker into @Image1 with expressive hand wave, natural eye contact, and soft studio key light.",
    category: "fashion",
  },
  {
    id: "comm-6",
    title: "Freestyle Groove Transfer",
    creator: "@dex.frames",
    aspect: "landscape",
    src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=700&q=80",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80",
    prompt:
      "Recast dancer into @Image1 with sharp shoulder isolation and natural fabric physics.",
    category: "dance",
  },
  {
    id: "comm-7",
    title: "Scale Model Object Swap",
    creator: "@prop_alchemist",
    aspect: "landscape",
    src: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&q=80",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
    prompt:
      "Swap the handheld object with @Image1 while keeping hand articulation and window daylight untouched.",
    category: "ugc",
  },
  {
    id: "comm-8",
    title: "Championship Crowd Celebration",
    creator: "@cinema.pulse",
    aspect: "landscape",
    src: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&q=80",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    prompt:
      "Recast the central figure into @Image1 celebrating in front of a roaring stadium crowd, anamorphic lens flare.",
    category: "action",
  },
  {
    id: "comm-9",
    title: "Streetwear Ensemble Musical",
    creator: "@tokyo.recast",
    aspect: "landscape",
    src: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=700&q=80",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
    prompt:
      "Recast lead performer into @Image1 leading a synchronized street-dance formation, vibrant daylight grading.",
    category: "fashion",
  },
];

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
