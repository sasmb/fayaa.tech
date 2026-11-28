import type { CSSProperties, ReactNode } from "react";

import { cn } from "../utils";

interface MarqueeProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  /** Seconds for one full loop. Bigger is slower. */
  durationSeconds?: number;
  reverse?: boolean;
  className?: string;
  gapClassName?: string;
}

/**
 * An endless, GPU-only horizontal strip. Items are rendered twice and the
 * track slides by half its width, so the loop has no visible seam. Hovering
 * pauses it; reduced-motion viewers get a static, scrollable row instead.
 */
export function Marquee<T>({
  items,
  renderItem,
  durationSeconds = 60,
  reverse = false,
  className,
  gapClassName = "gap-4 pr-4",
}: MarqueeProps<T>) {
  if (items.length === 0) return null;
  const style = { "--fy-marquee-duration": `${durationSeconds}s` } as CSSProperties;
  return (
    <div className={cn("fy-mask-x overflow-hidden motion-reduce:overflow-x-auto", className)}>
      <div
        style={style}
        className={cn(
          "fy-marquee-track flex w-max",
          gapClassName,
          reverse ? "animate-fy-marquee-reverse" : "animate-fy-marquee"
        )}
      >
        {items.map((item, index) => (
          <div key={`a-${index}`} className="shrink-0">
            {renderItem(item, index)}
          </div>
        ))}
        {items.map((item, index) => (
          <div key={`b-${index}`} className="shrink-0 motion-reduce:hidden" aria-hidden="true">
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
