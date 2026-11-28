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
import { SEEDANCE_LAUNCH, SEEDANCE_LAUNCH_COPY } from "./seedanceLaunch";

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
  aroundTheWeb: {
    eyebrow: string;
    title: string;
    description: string;
    disclaimer: string;
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
    badge: "New",
    message: "Turn one clip into a week of viral posts. Longer edits, up to 1080p, on Light & Pro.",
    cta: { label: "See plans", href: "/pricing", event: "Announcement Click" },
  },
  hero: {
    eyebrow: "FAYAA · AI video studio",
    headline: ["Viral videos", "in seconds."],
    accentLine: 1,
    subhead:
      "Drop in any clip or idea. FAYAA turns it into scroll-stopping short-form video, with trending formats, hooks and swaps that are ready for TikTok, Reels and Shorts.",
    primaryCta: { label: "Start creating free", href: "/signup", event: "Signup CTA Click" },
    secondaryCta: { label: "Open the studio", href: "/studio", event: "Studio Open" },
    promptExamples: [
      "Put me in this trending dance, same moves, neon rooftop",
      "Swap the sneakers for @Image1 and keep every step",
      "Turn my product into a 3-second hook that stops the scroll",
      "Make this street clip look like a movie trailer",
    ],
    backgroundClipId: "ember-hero",
    floatingClipIds: ["trend-dance", "sneaker-hook", "snap-transition"],
    stats: [
      { value: "Seconds", label: "from idea to post" },
      { value: "9:16", label: "built for short-form" },
      { value: "1080p", label: "max output" },
    ],
  },
  reel: {
    eyebrow: "Made with FAYAA",
    title: "Made to be shared.",
    rows: [
      ["trend-dance", "snap-transition", "sneaker-hook", "street-interview", "grwm-anime", "gym-spin", "burger-drop", "ember-sneakers"],
      ["night-market-pov", "skate-dog", "ember-rooftop", "perfume-spin", "cliff-freeze", "sneaker-unbox", "ember-dance", "ember-skate"],
    ],
  },
  capabilities: {
    eyebrow: "How it works",
    title: "One clip in. A viral post out.",
    description:
      "FAYAA reads the motion, camera and timing of any video, then remakes it around you, your product or the trend of the week.",
    steps: [
      {
        id: "motion",
        tag: "01 · Join the trend",
        title: "Hop on any trend in one tap.",
        body: "Pick a trending dance or format, add one photo, and you are the star. Every step and beat lands on cue.",
        clipId: "trend-dance",
      },
      {
        id: "swap",
        tag: "02 · Product swap",
        title: "Your product in the viral shot.",
        body: "Drop your product, outfit or logo into a clip that already works. Hands, lighting and background stay exactly as shot.",
        clipId: "sneaker-hook",
      },
      {
        id: "restyle",
        tag: "03 · Restyle",
        title: "Same clip, new hook.",
        body: "Turn a plain clip into a movie trailer, an anime opening or a night-city edit, and keep the rhythm that made it work.",
        clipId: "grwm-anime",
      },
      {
        id: "long",
        tag: "04 · Ship it",
        title: "Post-ready in seconds.",
        body: "Vertical, 1080p and ready for TikTok, Reels and Shorts. Need longer? Edits run past two minutes in one MP4.",
        clipId: "street-interview",
      },
    ],
    cta: { label: "Try it in the studio", href: "/studio", event: "Studio Open" },
  },
  community: {
    eyebrow: "Community",
    title: "Made by creators like you.",
    description:
      "Real videos from the FAYAA community. Remix any of them with your own face or product in one click.",
    primaryCta: { label: "Start generating", href: "/studio", event: "Studio Open" },
  },
  tools: {
    eyebrow: "The studio",
    title: "Your whole pipeline, one tab.",
    description: "Everything you need to make a viral video lives here. More tools land in the same workspace as they ship.",
  },
  templates: {
    eyebrow: "Templates",
    title: "Start from a hit.",
    description:
      "Each template is a format that already goes viral. Load it, add yourself, post.",
    tryLabel: "Launch in studio",
  },
  festival: {
    eyebrow: "FAYAA Global Film Festival · Coming soon",
    title: "Your short film, on the big screen.",
    description:
      "Make your best viral short with FAYAA and enter our first community festival.",
    cta: { label: "Explore community work", href: "#community-showcase", event: "Festival Click" },
    clipId: "ember-premiere",
  },
  aroundTheWeb: {
    eyebrow: "Around the web",
    title: "See what people are making with AI.",
    description:
      "AI video is moving fast. Here's work we love from creators everywhere, made with all kinds of tools. Tap any piece to watch it at the source.",
    disclaimer:
      "Each piece belongs to its creator and is shown with credit and a link to the original. Not made with FAYAA unless it says so.",
  },
  finalCta: {
    title: ["Your next viral", "video starts here."],
    subhead: "Free to start. No editing skills needed. Make your first one in seconds.",
    primaryCta: { label: "Start creating free", href: "/signup", event: "Signup CTA Click" },
    secondaryCta: { label: "See pricing", href: "/pricing", event: "Pricing Click" },
    clipId: "ember-crowd",
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
  // Seedance Week: teaser until launch, then the live deal. Dates and copy live in seedanceLaunch.ts.
  ...(SEEDANCE_LAUNCH.enabled
    ? [
        {
          id: "seedance-teaser",
          startsAt: "2026-11-28T00:00:00Z",
          endsAt: SEEDANCE_LAUNCH.startsAt,
          patch: {
            announcement: {
              enabled: true,
              badge: "Coming Dec 1",
              message: SEEDANCE_LAUNCH_COPY.announcement.upcoming,
              cta: { label: "Get ready", href: SEEDANCE_LAUNCH.path, event: "Announcement Click" },
            },
          },
        },
        {
          id: "seedance-week",
          startsAt: SEEDANCE_LAUNCH.startsAt,
          endsAt: SEEDANCE_LAUNCH.endsAt,
          patch: {
            announcement: {
              enabled: true,
              badge: "Seedance 2.5",
              message: SEEDANCE_LAUNCH_COPY.announcement.live,
              cta: { label: "Try it now", href: SEEDANCE_LAUNCH.path, event: "Announcement Click" },
            },
            hero: { eyebrow: "New · Seedance 2.5 text to video" },
          },
        },
      ]
    : []),
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
        headline: ["Go viral", "in seconds."],
        accentLine: 1,
        subhead:
          "Film it once on your phone, or start from a trend. FAYAA turns it into short-form video people actually share.",
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
        "around-the-web",
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
