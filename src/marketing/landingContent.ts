/**
 * Every word and clip on the homepage, in one place.
 *
 * How to change the site without touching components:
 * - Edit BASE_CONTENT for a permanent change.
 * - Add a CAMPAIGNS entry with a date window for a launch or sale; it
 *   switches itself on and off.
 * - Add a CONTENT_VARIANTS entry to A/B test copy, clips or section order
 *   against an experiment in experiments.ts.
 *
 * Patches are deep-merged over the base. Arrays are replaced, not merged.
 */
import { HOMEPAGE_LAYOUT, type HomepageSectionId } from "../landing-page/homepageConfig";
import { CONTROL, type ExperimentAssignments } from "./experiments";

export interface Cta {
  label: string;
  href: string;
  /** Analytics event name fired on click. */
  event?: string;
}

export interface LandingContent {
  announcement: {
    enabled: boolean;
    badge: string;
    message: string;
    cta: Cta;
  };
  hero: {
    eyebrow: string;
    /** Each string is one line of the display headline. */
    headline: string[];
    /** Index of the headline line painted with the heat gradient. */
    accentLine: number;
    subhead: string;
    primaryCta: Cta;
    secondaryCta: Cta;
    /** Rotating placeholder text in the hero prompt bar. */
    promptExamples: string[];
    backgroundClipId: string;
    /** Small floating clips that orbit the headline on large screens. */
    floatingClipIds: string[];
    stats: { value: string; label: string }[];
  };
  reel: {
    eyebrow: string;
    title: string;
    rows: string[][];
  };
  capabilities: {
    eyebrow: string;
    title: string;
    description: string;
    steps: {
      id: string;
      tag: string;
      title: string;
      body: string;
      clipId: string;
    }[];
    cta: Cta;
  };
  community: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: Cta;
  };
  tools: {
    eyebrow: string;
    title: string;
    description: string;
  };
  templates: {
    eyebrow: string;
    title: string;
    description: string;
    tryLabel: string;
  };
  festival: {
    eyebrow: string;
    title: string;
    description: string;
    cta: Cta;
    clipId: string;
  };
  finalCta: {
    title: string[];
    subhead: string;
    primaryCta: Cta;
    secondaryCta: Cta;
    clipId: string;
  };
  /** Section order. Sections disabled in HOMEPAGE_LAYOUT stay hidden. */
  layout: HomepageSectionId[];
}

type DeepPartial<T> = T extends (infer _U)[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type ContentPatch = DeepPartial<LandingContent>;

export const BASE_CONTENT: LandingContent = {
  announcement: {
    enabled: true,
    badge: "2+ min videos",
    message: "Genjutsu Light & Pro now edit videos over two minutes long, in up to 1080p.",
    cta: { label: "See plans", href: "/pricing", event: "Announcement Click" },
  },
  hero: {
    eyebrow: "FAYAA Genjutsu · AI video studio",
    headline: ["Direct any", "motion."],
    accentLine: 1,
    subhead:
      "Upload a clip, drop in a face, product or world, and FAYAA recasts every frame. Motion transfer, object swap and full restyles, from 4 seconds to over 2 minutes.",
    primaryCta: { label: "Start creating free", href: "/signup", event: "Signup CTA Click" },
    secondaryCta: { label: "Open the studio", href: "/studio", event: "Studio Open" },
    promptExamples: [
      "Recast the dancer as @Image1 on a neon rooftop at night",
      "Swap the sneakers for @Image1, keep every step",
      "Restyle the whole clip as a 90s anime opening",
      "Turn this street run into a rain-soaked chase scene",
    ],
    backgroundClipId: "hero-genjutsu",
    floatingClipIds: ["locker-swap", "midnight-portrait", "studio-dance"],
    stats: [
      { value: "2+ min", label: "longest single edit" },
      { value: "1080p", label: "max output" },
      { value: "8 cr", label: "per 5s clip, from" },
    ],
  },
  reel: {
    eyebrow: "Made with FAYAA",
    title: "Every frame, recast.",
    rows: [
      ["locker-swap", "studio-dance", "cash-flex", "object-swap", "midnight-portrait", "crowd"],
      ["streetwear", "stadium-sprint", "hero-genjutsu", "freestyle", "locker-swap", "studio-dance"],
    ],
  },
  capabilities: {
    eyebrow: "How it works",
    title: "One clip in. Any story out.",
    description:
      "Genjutsu reads the motion, camera and timing of your video, then rebuilds it around whatever you hand it.",
    steps: [
      {
        id: "motion",
        tag: "01 · Motion transfer",
        title: "Keep the moves, change the star.",
        body: "Upload a performance and one photo. Every step, gesture and expression lands on your character, frame-accurate.",
        clipId: "studio-dance",
      },
      {
        id: "swap",
        tag: "02 · Object swap",
        title: "Replace one thing, touch nothing else.",
        body: "Swap a product, prop or outfit while hands, lighting and background stay exactly as shot.",
        clipId: "object-swap",
      },
      {
        id: "restyle",
        tag: "03 · Restyle",
        title: "New world, same timing.",
        body: "Re-light, re-grade or re-imagine the whole scene in any look, without losing the original edit's rhythm.",
        clipId: "midnight-portrait",
      },
      {
        id: "long",
        tag: "04 · Long video",
        title: "Not just shorts.",
        body: "Clips over 30 seconds are split into seamless passes and stitched back into one final MP4, up to 2+ minutes.",
        clipId: "hero-genjutsu",
      },
    ],
    cta: { label: "Try it in the studio", href: "/studio", event: "Studio Open" },
  },
  community: {
    eyebrow: "Community",
    title: "Made by creators like you.",
    description:
      "Real Genjutsu renders from the FAYAA community. Remix any of them with your own characters in one click.",
    primaryCta: { label: "Start generating", href: "/studio", event: "Studio Open" },
  },
  tools: {
    eyebrow: "The studio",
    title: "Your whole pipeline, one tab.",
    description: "Genjutsu is live today. More models and tools land in the same workspace as they ship.",
  },
  templates: {
    eyebrow: "Templates",
    title: "Start from a hit.",
    description:
      "Each preset loads a motion source, identity anchors and a camera-locked prompt straight into the studio.",
    tryLabel: "Launch in studio",
  },
  festival: {
    eyebrow: "FAYAA Global Film Festival · Coming soon",
    title: "Your short film, on the big screen.",
    description:
      "Make motion-transfer, object-swap and restyled shorts with Genjutsu to enter our first community festival.",
    cta: { label: "Explore community work", href: "#community-showcase", event: "Festival Click" },
    clipId: "crowd",
  },
  finalCta: {
    title: ["Your next video", "starts here."],
    subhead: "Free to start. No editing skills needed. Upgrade when you want longer, sharper renders.",
    primaryCta: { label: "Start creating free", href: "/signup", event: "Signup CTA Click" },
    secondaryCta: { label: "See pricing", href: "/pricing", event: "Pricing Click" },
    clipId: "hero-genjutsu",
  },
  layout: HOMEPAGE_LAYOUT.map((section) => section.id),
};

/**
 * Time-boxed campaigns. The first one whose window contains "now" is applied
 * on top of BASE_CONTENT. Dates are ISO strings in UTC.
 */
export interface Campaign {
  id: string;
  startsAt: string;
  endsAt: string;
  patch: ContentPatch;
}

export const CAMPAIGNS: Campaign[] = [
  // Example: uncomment and adjust for the next sale.
  // {
  //   id: "black-friday-2026",
  //   startsAt: "2026-11-27T00:00:00Z",
  //   endsAt: "2026-12-02T08:00:00Z",
  //   patch: {
  //     announcement: {
  //       badge: "Black Friday",
  //       message: "40% off annual plans until Monday night.",
  //       cta: { label: "Claim the deal", href: "/pricing", event: "Announcement Click" },
  //     },
  //   },
  // },
];

/**
 * A/B content: CONTENT_VARIANTS[experimentId][variantId] is applied when the
 * visitor is in that variant. Control needs no entry.
 */
export const CONTENT_VARIANTS: Record<string, Record<string, ContentPatch>> = {
  "hero-copy": {
    creator: {
      hero: {
        headline: ["Your moves.", "Any star."],
        accentLine: 1,
        subhead:
          "Film it once on your phone. FAYAA recasts it with any character, product or world, and keeps every beat of the original.",
      },
    },
  },
  "landing-layout": {
    "proof-first": {
      layout: [
        "hero-showcase",
        "community-showcase",
        "reel-marquee",
        "capabilities-story",
        "tools-bento",
        "workflow-templates",
        "film-festival",
        "final-cta",
      ],
    },
  },
  "primary-cta": {
    "first-video": {
      hero: { primaryCta: { label: "Make your first video", href: "/signup", event: "Signup CTA Click" } },
      finalCta: { primaryCta: { label: "Make your first video", href: "/signup", event: "Signup CTA Click" } },
    },
  },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeContent<T>(base: T, patch: DeepPartial<T> | undefined): T {
  if (!patch) return base;
  if (!isPlainObject(base) || !isPlainObject(patch)) return (patch as T) ?? base;
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const current = (base as Record<string, unknown>)[key];
    result[key] =
      isPlainObject(current) && isPlainObject(value) ? mergeContent(current, value) : value;
  }
  return result as T;
}

export function getActiveCampaign(now: Date, campaigns: Campaign[] = CAMPAIGNS): Campaign | undefined {
  const time = now.getTime();
  return campaigns.find(
    (c) => new Date(c.startsAt).getTime() <= time && time < new Date(c.endsAt).getTime()
  );
}

/** Base content, then the live campaign, then each experiment variant. */
export function resolveLandingContent(
  assignments: ExperimentAssignments,
  now: Date = new Date(),
  options: {
    base?: LandingContent;
    campaigns?: Campaign[];
    variants?: Record<string, Record<string, ContentPatch>>;
  } = {}
): LandingContent {
  const base = options.base ?? BASE_CONTENT;
  const variants = options.variants ?? CONTENT_VARIANTS;
  let content: LandingContent = mergeContent<LandingContent>(base, getActiveCampaign(now, options.campaigns)?.patch);
  for (const [experimentId, variantId] of Object.entries(assignments)) {
    if (variantId === CONTROL) continue;
    content = mergeContent<LandingContent>(content, variants[experimentId]?.[variantId]);
  }
  return content;
}
