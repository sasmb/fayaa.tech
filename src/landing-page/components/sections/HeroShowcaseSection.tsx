import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { HeroShowcaseCardConfig } from "../../homepageConfig";
import { cn } from "../../../video-studio/hf/lib/utils";

interface HeroShowcaseSectionProps {
  cards: HeroShowcaseCardConfig[];
  isLoggedIn: boolean;
  onNavigateStudio: () => void;
  ariaLabel?: string;
}

/**
 * Row 1 horizontal showcase strip supporting Visitor vs Logged-In card variants
 * and dynamically resolved R2 / featured hero media.
 */
export function HeroShowcaseSection({
  cards,
  isLoggedIn,
  onNavigateStudio,
  ariaLabel = "Featured Studio Workflows",
}: HeroShowcaseSectionProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (dir: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "right" ? 460 : -460,
      behavior: "smooth",
    });
  };

  return (
    <section aria-label={ariaLabel} className="relative">
      <div
        ref={carouselRef}
        className="grid grid-cols-1 gap-5 overflow-x-auto no-scrollbar md:grid-cols-3"
      >
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => {
              if (!card.comingSoon) onNavigateStudio();
            }}
            role={card.comingSoon ? undefined : "button"}
            tabIndex={card.comingSoon ? -1 : 0}
            onKeyDown={(e) => {
              if (card.comingSoon) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onNavigateStudio();
              }
            }}
            className={cn(
              "group flex flex-col gap-3 focus-visible:outline-none",
              card.comingSoon ? "cursor-default" : "cursor-pointer"
            )}
          >
            {/* Card Media Stage */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#141417]">
              {card.badgeText ? (
                <span
                  className={cn(
                    "absolute top-3 left-3 z-30 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider uppercase shadow-md backdrop-blur-md",
                    card.comingSoon
                      ? "border border-white/20 bg-black/75 text-zinc-200"
                      : "bg-[#C8FF00] text-black"
                  )}
                >
                  {card.badgeText}
                </span>
              ) : null}
              {card.kind === "genjutsu" ? (
                !isLoggedIn ? (
                  /* Visitor Split INPUT / OUTPUT Diagonal Card */
                  <div className="relative size-full overflow-hidden">
                    <img
                      src={card.outputImage}
                      alt="Genjutsu Output"
                      className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{
                        clipPath: "polygon(0 0, 54% 0, 38% 100%, 0% 100%)",
                      }}
                    >
                      <img
                        src={card.inputImage}
                        alt="Genjutsu Input"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-indigo-950/20" />
                    </div>
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-[46%] w-1 -skew-x-12 bg-white/80 shadow-[0_0_20px_rgba(255,255,255,0.9)]"
                    />
                    <span className="absolute bottom-3 left-4 rounded-md bg-black/65 px-2.5 py-1 text-sm font-black tracking-wider text-white uppercase backdrop-blur-xs">
                      INPUT
                    </span>
                    <span className="absolute top-3 right-4 rounded-md bg-black/65 px-2.5 py-1 text-sm font-black tracking-wider text-white uppercase backdrop-blur-xs">
                      OUTPUT
                    </span>
                  </div>
                ) : (
                  /* Logged-In MOTION / RECAST Dual Polaroid Card */
                  <div className="relative flex size-full items-center justify-between overflow-hidden bg-[#EDE8E2] p-4 text-black">
                    <div className="relative z-10 flex h-full w-[48%] -rotate-2 flex-col justify-between overflow-hidden rounded-xl border-2 border-black/15 bg-zinc-900 shadow-xl">
                      <img
                        src={card.loggedInInputImage}
                        alt="Input reference"
                        className="size-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 rounded bg-black/75 px-2 py-0.5 text-[11px] font-black text-white uppercase">
                        INPUT
                      </span>
                    </div>
                    <div className="relative z-10 flex h-full w-[48%] rotate-2 flex-col justify-between overflow-hidden rounded-xl border-2 border-black/15 bg-zinc-900 shadow-xl">
                      <img
                        src={card.loggedInOutputImage}
                        alt="Output motion"
                        className="size-full object-cover"
                      />
                      <span className="absolute top-2 right-2 rounded bg-black/75 px-2 py-0.5 text-[11px] font-black text-white uppercase">
                        OUTPUT
                      </span>
                    </div>
                    <span className="pointer-events-none absolute top-2.5 right-4 z-20 font-black tracking-tighter text-black uppercase sm:text-2xl">
                      RECAST
                    </span>
                    <span className="pointer-events-none absolute bottom-2 left-4 z-20 font-black tracking-tighter text-black uppercase sm:text-2xl">
                      MOTION ⚡
                    </span>
                  </div>
                )
              ) : card.kind === "playable" ? (
                /* Middle Card: Playable 3D Motion Stage (Coming Soon) */
                <div className="relative size-full overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-900">
                  <img
                    src={card.outputImage}
                    alt={card.title}
                    className="size-full object-cover opacity-70 mix-blend-luminosity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-indigo-950/35 to-transparent" />
                  <div className="absolute inset-x-6 bottom-4 flex flex-col items-center gap-1.5">
                    <div className="h-2 w-48 overflow-hidden rounded-full bg-black/60 p-0.5">
                      <div className="h-full w-1/3 rounded-full bg-zinc-400" />
                    </div>
                    <span className="font-black tracking-tight text-white italic drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] sm:text-3xl">
                      FAYAA Playable
                    </span>
                  </div>
                </div>
              ) : (
                /* Right Card: Content Factory Vertical Reels Preview (Coming Soon) */
                <div className="relative flex size-full items-center justify-center overflow-hidden bg-zinc-900">
                  <img
                    src={card.inputImage}
                    alt={card.title}
                    className="absolute inset-0 size-full object-cover opacity-40 blur-[2px]"
                  />
                  <div className="relative z-10 flex h-[88%] w-[44%] flex-col justify-between overflow-hidden rounded-2xl border border-white/25 bg-black p-2.5 shadow-2xl">
                    <img
                      src={card.outputImage}
                      alt="Reels frame"
                      className="absolute inset-0 size-full object-cover opacity-75"
                    />
                    <div className="relative z-10 flex items-center justify-between text-[10px] font-bold text-white">
                      <span>Series</span>
                      <span className="rounded-full bg-black/70 px-2 py-0.5">
                        Coming Soon
                      </span>
                    </div>
                    <div className="relative z-10 flex flex-col gap-0.5">
                      <span className="w-fit rounded bg-[#C8FF00] px-1.5 py-0.5 text-[9px] font-black text-black uppercase">
                        @fayaa.studio
                      </span>
                      <span className="truncate text-[10px] font-medium text-white">
                        Multi-Clip Pipeline
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card Caption */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h2
                  className={cn(
                    "text-base font-black tracking-tight uppercase sm:text-lg",
                    card.highlightTitle && !isLoggedIn
                      ? "text-[#C8FF00]"
                      : "text-white"
                  )}
                >
                  {card.title}
                </h2>
                {card.comingSoon ? (
                  <span className="rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-300 uppercase">
                    Coming Soon
                  </span>
                ) : (
                  <span className="rounded-md bg-[#C8FF00]/15 border border-[#C8FF00]/30 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#C8FF00] uppercase">
                    Live
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 sm:text-sm">
                {card.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Carousel Navigation Arrows */}
      <button
        type="button"
        aria-label="Scroll showcase right"
        onClick={() => scrollCarousel("right")}
        className="absolute top-[38%] right-2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-md transition-colors hover:border-[#C8FF00] hover:text-[#C8FF00] md:inline-flex"
      >
        <ChevronRight className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Scroll showcase left"
        onClick={() => scrollCarousel("left")}
        className="absolute top-[38%] left-2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-md transition-colors hover:border-[#C8FF00] hover:text-[#C8FF00] md:inline-flex"
      >
        <ChevronLeft className="size-5" />
      </button>
    </section>
  );
}
