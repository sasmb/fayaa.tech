import { useState } from "react";
import { ArrowRight, Play, WandSparkles } from "lucide-react";

import { AutoplayVideo, FyLinkButton, Reveal, SectionHeading, usePointerFine } from "../../../client/design";
import { cn } from "../../../client/utils";
import type { LandingContent } from "../../../marketing/landingContent";
import { trackMarketingEvent } from "../../../marketing/analytics";
import type { ShowcaseCategory } from "../../../video-studio/showcaseService";
import type { CommunityShotConfig } from "../../homepageConfig";

const FILTERS: { id: ShowcaseCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "dance", label: "Choreography" },
  { id: "fashion", label: "Fashion" },
  { id: "action", label: "Action & sports" },
  { id: "ugc", label: "Object swap & UGC" },
];

/**
 * Community masonry. Live public renders come first, curated shots fill in.
 * Tiles play on hover with a mouse and while on screen on touch devices.
 */
export function CommunityShowcaseSection({
  content,
  shots,
  onRemixShot,
  ariaLabel,
}: {
  content: LandingContent["community"];
  shots: CommunityShotConfig[];
  onRemixShot: (shot: CommunityShotConfig) => void;
  ariaLabel: string;
}) {
  const [filter, setFilter] = useState<ShowcaseCategory>("all");
  const pointerFine = usePointerFine();
  const visible = filter === "all" ? shots : shots.filter((s) => s.category === filter);

  return (
    <section
      id="community-showcase"
      aria-label={ariaLabel}
      className="mx-auto flex w-full max-w-[1440px] scroll-mt-20 flex-col gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <SectionHeading
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        actions={
          <FyLinkButton
            to={content.primaryCta.href}
            size="lg"
            className="rounded-full"
            onClick={() => trackMarketingEvent(content.primaryCta.event ?? "Studio Open", { placement: "community" })}
          >
            {content.primaryCta.label}
            <ArrowRight className="size-4" />
          </FyLinkButton>
        }
      />

      <div role="tablist" aria-label="Filter community videos" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
              filter === f.id
                ? "border-transparent bg-fy-text text-fy-ink"
                : "border-fy-line text-fy-muted hover:border-fy-line-strong hover:text-fy-text"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5 [&>*]:mb-3">
        {visible.map((shot, index) => (
          <Reveal key={shot.id} delay={Math.min(index, 8) * 0.04} y={20} className="break-inside-avoid">
            <AutoplayVideo
              src={shot.videoUrl}
              poster={shot.src}
              alt={shot.title}
              mode={pointerFine ? "hover" : "visible"}
              kenBurns={false}
              className={cn(
                "group/shot rounded-fy-lg ring-1 ring-fy-line transition-shadow duration-500 hover:ring-fy-line-strong",
                shot.aspect === "portrait" ? "aspect-[9/14]" : "aspect-[16/11]"
              )}
            >
              <div className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md">
                  <Play className="size-2.5 fill-current" />
                  {shot.isFromStorage ? "Community" : "Genjutsu"}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-12">
                <div className="flex flex-col">
                  <span className="truncate text-sm font-semibold text-white">{shot.title}</span>
                  <span className="truncate text-xs text-white/60">{shot.creator}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    trackMarketingEvent("Community Remix", { shot: shot.id });
                    onRemixShot(shot);
                  }}
                  className="inline-flex h-8 w-fit items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-black transition-[opacity,transform] duration-300 ease-fy-out hover:bg-fy-accent-100 sm:translate-y-2 sm:opacity-0 sm:group-hover/shot:translate-y-0 sm:group-hover/shot:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100"
                >
                  <WandSparkles className="size-3.5" />
                  Remix
                </button>
              </div>
            </AutoplayVideo>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
