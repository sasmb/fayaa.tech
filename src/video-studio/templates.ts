import { usdToCredits } from "./pricing";
import { MotionModel, MotionTemplate, VideoQuality } from "./types";

export const MOTION_MODELS: MotionModel[] = [
  {
    id: "higgsfield/genjutsu-light/motion-transfer/v1.0",
    name: "FAYAA Genjutsu Light",
    provider: "HIGGSFIELD",
    badge: "LIGHT",
    badgeColor: "bg-fy-accent text-black",
    resolution: "1080p",
    durationRange: "4s-15s",
    category: "featured",
    creditsPer5s: 8,
    usdPerSecByRes: {
      "480p": 0.025,
      "720p": 0.05,
      "1080p": 0.1,
    },
    description:
      "Ultra-fast motion transfer with high temporal stability and identity lock. Best for social clips and dancing ($0.05/s at 720p).",
  },
  {
    id: "higgsfield/genjutsu/motion-transfer/v1.0",
    name: "FAYAA Genjutsu Pro",
    provider: "HIGGSFIELD",
    badge: "PRO",
    badgeColor: "bg-amber-400 text-black",
    resolution: "1080p",
    durationRange: "4s-30s",
    category: "featured",
    creditsPer5s: 50,
    usdPerSecByRes: {
      "480p": 0.159,
      "720p": 0.3405,
      "1080p": 0.816,
    },
    description:
      "Studio-grade master motion recast with fine garment dynamics and complex camera moves ($0.34/s at 720p).",
  },
];

export function calculateRealtimeVideoCost(
  model: MotionModel,
  resolution: VideoQuality,
  durationSec: number
): {
  billableSeconds: number;
  usdPerSec: number;
  totalUsd: number;
  credits: number;
} {
  const billableSeconds = Math.max(4, Math.min(30, Math.ceil(durationSec || 5)));
  const fallbackRates = { "480p": 0.03, "720p": 0.06, "1080p": 0.12 };
  const rates = model.usdPerSecByRes ?? fallbackRates;
  const usdPerSec = rates[resolution] ?? rates["720p"];
  const totalUsd = Number((billableSeconds * usdPerSec).toFixed(2));
  // Provider cost x markup, at 30 credits per $1 (see pricing.ts).
  const credits = usdToCredits(totalUsd);
  return {
    billableSeconds,
    usdPerSec,
    totalUsd,
    credits,
  };
}

export const INITIAL_MOTION_TEMPLATES: MotionTemplate[] = [
  {
    id: "tpl-1",
    title: "Trending TikTok Routine",
    tag: "GENJUTSU LIGHT",
    duration: "12s",
    category: "dance",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    posterUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80",
    description: "Upbeat synchronized modern dance routine with fluid arm and torso tracking",
    recommendedPrompt: "fluid pop dance moves, locked face, energetic modern choreography",
  },
  {
    id: "tpl-2",
    title: "High Fashion Runway Walk",
    tag: "GENJUTSU 1080P",
    duration: "8s",
    category: "walk",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    posterUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80",
    description: "Confident catwalk model stride with natural fabric dynamics and steady camera follow",
    recommendedPrompt: "fashion runway strut, luxury lighting, sharp outfit silhouette",
  },
  {
    id: "tpl-3",
    title: "Hype Creator Hand Gestures",
    tag: "TALKING HOOK",
    duration: "6s",
    category: "vlog",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    posterUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&q=80",
    description: "Expressive talking-head hands and head motions designed for YouTube & TikTok hooks",
    recommendedPrompt: "expressive creator hand motions, clear articulation, podcast framing",
  },
  {
    id: "tpl-4",
    title: "Fluid Martial Arts Combo",
    tag: "DYNAMIC ACTION",
    duration: "10s",
    category: "action",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    posterUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80",
    description: "Crisp martial arts kick sequence with cinematic camera follow and impact slowdown",
    recommendedPrompt: "high kick martial arts sequence, action physics, dramatic focus",
  },
  {
    id: "tpl-5",
    title: "Gym Workout & Fit Check",
    tag: "FULL BODY",
    duration: "8s",
    category: "walk",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    posterUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80",
    description: "Athletic pose and turnaround showing full front and side body proportions",
    recommendedPrompt: "athletic turnaround pose, gym lighting, defined clothing fit",
  },
  {
    id: "tpl-6",
    title: "Viral Afrobeat Footwork",
    tag: "CHOREO",
    duration: "14s",
    category: "dance",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    posterUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80",
    description: "Fast-paced footwork with bouncy rhythm and grounded hip-hop groove",
    recommendedPrompt: "rhythmic street footwork, bounce physics, joyful expression",
  },
];
