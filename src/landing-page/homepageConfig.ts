import type { PublicShowcaseItem, ShowcaseCategory } from "../video-studio/showcaseService";

export type HomepageSectionId =
  | "hero-showcase"
  | "tools-bento"
  | "film-festival"
  | "community-showcase"
  | "workflow-templates";

export interface HomepageSectionConfig {
  id: HomepageSectionId;
  enabled: boolean;
  ariaLabel: string;
}

/**
 * Reorder or disable top-level homepage sections here without touching JSX layout code.
 */
export const HOMEPAGE_LAYOUT: HomepageSectionConfig[] = [
  {
    id: "hero-showcase",
    enabled: true,
    ariaLabel: "Featured Studio Workflows",
  },
  {
    id: "tools-bento",
    enabled: true,
    ariaLabel: "Promotions and AI Models",
  },
  {
    id: "film-festival",
    enabled: true,
    ariaLabel: "FAYAA Global Film Festival",
  },
  {
    id: "community-showcase",
    enabled: true,
    ariaLabel: "FAYAA Genjutsu by Community",
  },
  {
    id: "workflow-templates",
    enabled: true,
    ariaLabel: "1-Click Genjutsu Templates",
  },
];

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
    subtitle: "Motion transfer, object swap & video restyle — live in Studio.",
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
    description: "Motion transfer, object swap & video restyle (Light & Pro)",
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

export const HOMEPAGE_ANNOUNCEMENT = {
  badgeLabel: "Live in Studio",
  message:
    "FAYAA Genjutsu Light & Pro — Motion Transfer, Object Swap & Video Restyle up to 1080p. Save 20% on Annual Plans.",
  ctaLabel: "View Plans & Credits",
  ctaHref: "/pricing",
};

export const HOMEPAGE_PROMO_CONFIG = {
  backdropImage:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=80",
  visitor: {
    headingPrimary: "CREATE WITH FAYAA",
    headingAccent: "GENJUTSU V1.0",
    bullets: [
      "Genjutsu Light & Pro motion transfer, object swap, and video restyle presets up to 1080p",
      "Multi-image character & product reference lock — save 20% on annual plans or top up credits anytime",
    ],
    ctaLabel: "Sign up & start creating",
    ctaHref: "/signup",
  },
  loggedIn: {
    headingPrimary: "GENJUTSU LIGHT & PRO",
    headingSecondary: "SAVE 20% ON ANNUAL PLANS",
    description:
      "Transfer motion from any 4s–30s video, swap characters or objects, and apply Restyle presets starting from 8 credits per 5s clip.",
    primaryCtaLabel: "Open Genjutsu Studio",
    primaryCtaHref: "/studio",
    secondaryCtaLabel: "Plans & Credits",
    secondaryCtaHref: "/pricing",
  },
};

export const HOMEPAGE_FESTIVAL_CONFIG = {
  badgeLabel: "FAYAA Global Film Festival • Coming Soon",
  heading: "SUBMISSIONS OPENING SOON",
  description:
    "Create motion-transfer, object-swap, and restyled short films with FAYAA Genjutsu to participate in our upcoming community showcase.",
  ctaLabel: "Explore community creations",
  ctaHref: "#community-showcase",
};

export const HOMEPAGE_COMMUNITY_CONFIG = {
  heading: "FAYAA GENJUTSU BY COMMUNITY",
  description:
    "Take the motion and recast it with your characters, locations, and products, or swap specific elements while keeping the rest untouched.",
  primaryCtaLabel: "Start generating",
  secondaryCtaLabel: "Learn more",
  workbenchLinkLabel: "Open Genjutsu Workbench",
};

export const HOMEPAGE_TEMPLATES_CONFIG = {
  heroImages: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  ] as readonly [string, string, string],
  heroAlt: "FAYAA Genjutsu presets",
  badgeLabel: "Ready-to-Run Workflows",
  heading: "Launch a Genjutsu Template in One Click",
  descriptionPrefix: "Every preset pre-loads a motion source video,",
  descriptionHighlight: "@Image1",
  descriptionSuffix:
    "identity anchors, and camera-locked prompt directly into the FAYAA Studio Workbench.",
  tryLabel: "Launch in Studio",
};

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
