import { AutoplayVideo, type AutoplayMode } from "../../../../client/design/AutoplayVideo"
import { isVideoUrl } from "../../../studioClips"
import { cn } from "../../lib/utils"

export interface MediaThumbProps {
  src: string
  alt?: string
  className?: string
  /** Video playback: "visible" loops while on screen, "hover" plays on hover. */
  mode?: AutoplayMode
}

/**
 * One thumbnail for any studio artwork. Video URLs render as a muted looping
 * clip (lazy, paused off-screen, poster-free first frame for reduced motion);
 * anything else renders as an image.
 */
export function MediaThumb({ src, alt = "", className, mode = "visible" }: MediaThumbProps) {
  if (isVideoUrl(src)) {
    return (
      <AutoplayVideo
        src={src}
        alt={alt}
        mode={mode}
        kenBurns={false}
        className={cn("size-full", className)}
      />
    )
  }
  return <img src={src} alt={alt} loading="lazy" className={cn("size-full object-cover", className)} />
}
