export interface MotionModel {
  id: string;
  name: string;
  provider: "HIGGSFIELD" | "MUAPI";
  badge?: string;
  badgeColor?: string;
  resolution: "720p" | "1080p" | "480p" | "768p" | "4K";
  durationRange: string;
  category: "featured" | "motion-control" | "create" | "edit";
  creditsPer5s: number; // 30 credits = $1.00
  usdPerSecByRes?: {
    "480p": number;
    "720p": number;
    "1080p": number;
  };
  description: string;
}

export interface MotionTemplate {
  id: string;
  title: string;
  tag: string;
  duration: string;
  category: "dance" | "walk" | "action" | "vlog" | "custom";
  videoUrl: string;
  posterUrl: string;
  description?: string;
  recommendedPrompt?: string;
}

export type SceneControlMode = "video" | "image";
export type VideoQuality = "480p" | "720p" | "1080p";
export type StudioSubTab = "create" | "edit" | "motion";
export type MotionSubMode = "transfer" | "swap";
export type CenterTab = "history" | "library" | "styles" | "how-it-works";
