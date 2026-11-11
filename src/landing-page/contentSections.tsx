import daBoiAvatar from "../client/static/da-boi.webp";
import kivo from "../client/static/examples/kivo.webp";
import messync from "../client/static/examples/messync.webp";
import microinfluencerClub from "../client/static/examples/microinfluencers.webp";
import promptpanda from "../client/static/examples/promptpanda.webp";
import reviewradar from "../client/static/examples/reviewradar.webp";
import scribeist from "../client/static/examples/scribeist.webp";
import searchcraft from "../client/static/examples/searchcraft.webp";
import { DocsUrl } from "../shared/common";
import type { GridFeature } from "./components/FeaturesGrid";

export const features: GridFeature[] = [
  {
    name: "FAYAA Genjutsu Motion Transfer (Live)",
    description:
      "Steal any trending dance or action. Upload 1 character photo and any 4s–30s reference video—your character performs the exact moves with realistic physics.",
    emoji: "🕺",
    href: "/studio",
    size: "large",
  },
  {
    name: "FAYAA Object & Character Swap (Live)",
    description:
      "Swap outfits, props, or replace the entire subject inside an existing video using up to 4 reference images while keeping surrounding lighting untouched.",
    emoji: "👗",
    href: "/studio",
    size: "medium",
  },
  {
    name: "FAYAA Video Restyle Presets (Live)",
    description:
      "Redraw your entire video in Cel-Shaded Anime, Claymation, Knitted Yarn, Cinematic 3D, or Hollywood Anamorphic while locking original motion.",
    emoji: "🎨",
    href: "/studio",
    size: "medium",
  },
  {
    name: "FAYAA Templates (Live)",
    description:
      "Never stare at a blank screen. Pick a ready-to-run Genjutsu workflow template with pre-loaded motion and @Image1 prompts in one click.",
    emoji: "🔥",
    href: "/studio",
    size: "small",
  },
  {
    name: "Seedance 2.5 & Cinema Studio (Coming Soon)",
    description:
      "Turn text prompts or still photos into smooth cinematic clips and multi-angle scenes—launching soon on FAYAA.",
    emoji: "🎬",
    href: "/#tools-bento",
    size: "large",
  },
  {
    name: "FAYAA Influencer (Coming Soon)",
    description:
      "Build a persistent virtual persona with locked identity across infinite outfits, locations, and campaigns—coming soon.",
    emoji: "👤",
    href: "/#tools-bento",
    size: "small",
  },
  {
    name: "FAYAA Playable & Content Factory (Coming Soon)",
    description:
      "Interactive motion worlds from a single prompt and automated multi-episode social series pipelines—coming soon.",
    emoji: "🚀",
    href: "/#tools-bento",
    size: "medium",
  },
];

export const testimonials = [
  {
    name: "Elena Rostova",
    role: "Head of Growth @ Velox Apparel",
    avatarSrc: daBoiAvatar,
    socialUrl: "#",
    quote:
      "Using FAYAA Product Ads and FAYAA Templates cut our video ad production cycle from 2 weeks to 15 minutes. Our cost-per-acquisition dropped by 38% on TikTok.",
  },
  {
    name: "Marcus Vance",
    role: "Indie Creator & Filmmaker",
    avatarSrc: daBoiAvatar,
    socialUrl: "#",
    quote:
      "FAYAA Motion Control changed the game for me. I can record a choreography test on my iPhone in my living room and transfer it onto a cyberpunk samurai with Hollywood lighting.",
  },
  {
    name: "Sophia Chen",
    role: "Creative Director @ StudioPulse",
    avatarSrc: daBoiAvatar,
    socialUrl: "#",
    quote:
      "FAYAA Influencer means our virtual brand ambassador looks identical across every video and market. We dubbed our entire launch into 8 languages in one afternoon with FAYAA Lip-Sync.",
  },
];

export const faqs = [
  {
    id: 1,
    question: "How does FAYAA Motion Control work?",
    answer:
      "Upload any source video (a dance, walk, or athletic movement) along with 1 reference photo of your character. FAYAA maps the choreography directly to your character while preserving fluid movement and natural lighting.",
    href: DocsUrl,
  },
  {
    id: 2,
    question: "Do I need expensive cameras or 3D animation skills?",
    answer:
      "Zero technical skills or camera gear required. Pick a viral template, direct scenes in plain English with FAYAA Camera, or turn a single product photo into high-converting video ads.",
    href: DocsUrl,
  },
  {
    id: 3,
    question: "Can I keep my creator consistent across different videos?",
    answer:
      "Yes. FAYAA Influencer locks your creator's face and identity permanently. You can generate infinite scenes, costume changes, and stories while keeping facial features and likeness 100% consistent.",
    href: DocsUrl,
  },
  {
    id: 4,
    question: "How does FAYAA Product Ads work for e-commerce?",
    answer:
      "Simply paste any product page URL or upload a photo. FAYAA extracts product imagery, understands the specifications, and renders ready-to-post 'creator-in-hand' UGC and 360° product spins in minutes.",
    href: DocsUrl,
  },
  {
    id: 5,
    question: "How does FAYAA Lip-Sync work for international markets?",
    answer:
      "Upload your video and voice track or choose a target language. FAYAA translates the audio and recalculates the performer's facial movements so their lips match the new language flawlessly.",
    href: DocsUrl,
  },
];

export const footerNavigation = {
  app: [
    { name: "FAYAA Studio", href: "/studio" },
    { name: "FAYAA Templates", href: "/studio?tab=workflows" },
    { name: "Pricing", href: "/pricing" },
  ],
  company: [
    { name: "FAYAA", href: "/" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Refund Policy", href: "/refunds" },
  ],
};

export const examples = [
  {
    name: "FAYAA Product Ads (360° Spin)",
    description: "Single-image product photo converted to rotating 3D video ad.",
    imageSrc: kivo,
    href: "/studio?tab=marketing",
  },
  {
    name: "FAYAA Motion Control Transfer",
    description: "iPhone dance choreography transferred onto a virtual character.",
    imageSrc: messync,
    href: "/studio?tab=vibe-motion",
  },
  {
    name: "FAYAA Swap (AI Outfit & Style)",
    description: "Instant garment and background changes with zero lighting artifacts.",
    imageSrc: microinfluencerClub,
    href: "/studio?tab=body-swap",
  },
  {
    name: "FAYAA Lip-Sync (Global Dub)",
    description: "Single spokesperson dubbed across 12 international languages.",
    imageSrc: promptpanda,
    href: "/studio?tab=lip-sync",
  },
  {
    name: "FAYAA Product Ads (UGC Campaign)",
    description: "Direct-from-link e-commerce video ads with automated copy.",
    imageSrc: reviewradar,
    href: "/studio?tab=marketing",
  },
  {
    name: "FAYAA Influencer (Consistent Persona)",
    description: "Consistent digital brand ambassador across multiple environments.",
    imageSrc: scribeist,
    href: "/studio?tab=image",
  },
  {
    name: "FAYAA Camera (Dynamic Directing)",
    description: "Hollywood camera motion and cinematic lighting directed in plain English.",
    imageSrc: searchcraft,
    href: "/studio?tab=cinema",
  },
];
