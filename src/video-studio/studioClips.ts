import { getMediaClip } from "../landing-page/homepageConfig";

/**
 * Studio artwork comes from FAYAA's own renders (MEDIA_CLIPS), never stock
 * photos. Swap a clip here, or add new ones to MEDIA_CLIPS, to change what
 * the studio shows.
 */
export function studioClip(id: string): string {
  return getMediaClip(id)?.videoUrl ?? "";
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

export function isVideoUrl(url: string | undefined | null): boolean {
  return Boolean(url && VIDEO_EXT.test(url));
}
