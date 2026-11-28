import { Marquee, Reveal } from "../../../client/design";
import type { LandingContent } from "../../../marketing/landingContent";
import type { MediaClip } from "../../homepageConfig";
import { ClipTile } from "./ClipTile";

/** Two endless rows of clips drifting in opposite directions. */
export function ReelMarqueeSection({
  content,
  rows,
  ariaLabel,
}: {
  content: LandingContent["reel"];
  rows: MediaClip[][];
  ariaLabel: string;
}) {
  return (
    <section id="after-hero" aria-label={ariaLabel} className="relative flex flex-col gap-10 py-20 sm:py-28">
      <Reveal className="mx-auto flex w-full max-w-[1440px] items-end justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <span className="fy-eyebrow">{content.eyebrow}</span>
          <h2 className="fy-display text-4xl text-fy-text sm:text-6xl">{content.title}</h2>
        </div>
      </Reveal>
      <div className="flex flex-col gap-4">
        {rows.map((row, index) => (
          <Marquee
            key={index}
            items={row}
            reverse={index % 2 === 1}
            durationSeconds={70 + index * 15}
            renderItem={(clip) => (
              <ClipTile
                clip={clip}
                className="h-56 sm:h-72"
                aspectClassName={clip.aspect === "portrait" ? "aspect-[9/14]" : "aspect-[16/10]"}
              />
            )}
          />
        ))}
      </div>
    </section>
  );
}
