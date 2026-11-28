import type { ReactNode } from "react";

import { AutoplayVideo, type AutoplayMode } from "../../../client/design";
import { cn } from "../../../client/utils";
import type { MediaClip } from "../../homepageConfig";

const ASPECT: Record<MediaClip["aspect"], string> = {
  portrait: "aspect-[9/14]",
  landscape: "aspect-[16/10]",
  square: "aspect-square",
};

/** A rounded, autoplaying clip card with a gradient label footer. */
export function ClipTile({
  clip,
  mode = "visible",
  className,
  showLabel = true,
  aspectClassName,
  children,
}: {
  clip: MediaClip;
  mode?: AutoplayMode;
  className?: string;
  showLabel?: boolean;
  aspectClassName?: string;
  children?: ReactNode;
}) {
  return (
    <AutoplayVideo
      src={clip.videoUrl}
      poster={clip.poster}
      alt={clip.title}
      mode={mode}
      className={cn(
        "group/clip rounded-fy-lg ring-1 ring-fy-line transition-[transform,box-shadow] duration-500 ease-fy-out hover:ring-fy-line-strong",
        aspectClassName ?? ASPECT[clip.aspect],
        className
      )}
      videoClassName="transition-transform duration-[1.2s] ease-fy-out group-hover/clip:scale-[1.04]"
    >
      {showLabel ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 pt-10">
          <span className="truncate text-xs font-semibold text-white/90">{clip.title}</span>
          <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-md">
            {clip.tag}
          </span>
        </div>
      ) : null}
      {children}
    </AutoplayVideo>
  );
}
