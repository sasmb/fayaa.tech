import { Award } from "lucide-react";

import { HOMEPAGE_FESTIVAL_CONFIG } from "../../homepageConfig";
import { FayaaWaveGlyph } from "../FayaaWaveGlyph";

interface FilmFestivalSectionProps {
  ariaLabel?: string;
}

/**
 * Row 3 promotional film festival banner rendered declaratively from HOMEPAGE_FESTIVAL_CONFIG.
 */
export function FilmFestivalSection({
  ariaLabel = "FAYAA Global Film Festival",
}: FilmFestivalSectionProps) {
  return (
    <section
      aria-label={ariaLabel}
      className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-r from-[#1A140B] via-[#3A2D15] to-[#1D160B] p-8 sm:p-12"
    >
      {/* Architectural Gold Monolith Visuals on the right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] items-end justify-center gap-6 pr-10 lg:flex"
      >
        <div className="flex h-[68%] w-40 -rotate-6 items-center justify-center rounded-t-2xl border border-white/25 bg-gradient-to-b from-zinc-300/35 via-zinc-500/25 to-black/80 shadow-2xl backdrop-blur-xs">
          <FayaaWaveGlyph className="size-20 text-black/75" />
        </div>
        <div className="z-10 flex h-[88%] w-52 rotate-2 items-center justify-center rounded-t-2xl border border-amber-300/50 bg-gradient-to-b from-amber-200/55 via-amber-500/35 to-black/85 shadow-[0_0_60px_rgba(245,158,11,0.3)] backdrop-blur-xs">
          <FayaaWaveGlyph className="size-28 text-black/85" />
        </div>
        <div className="flex h-[64%] w-40 rotate-6 items-center justify-center rounded-t-2xl border border-amber-700/40 bg-gradient-to-b from-amber-600/35 via-amber-900/30 to-black/85 shadow-2xl backdrop-blur-xs">
          <FayaaWaveGlyph className="size-20 text-black/75" />
        </div>
      </div>

      <div className="relative z-10 flex max-w-lg flex-col items-center text-center lg:items-start lg:text-left">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-400/10 px-3.5 py-1 text-xs font-bold tracking-widest text-amber-200 uppercase">
          <Award className="size-4 text-amber-300" />
          <span>{HOMEPAGE_FESTIVAL_CONFIG.badgeLabel}</span>
        </div>

        <h2 className="text-3xl font-black tracking-tight text-white uppercase sm:text-4xl">
          {HOMEPAGE_FESTIVAL_CONFIG.heading}
        </h2>

        <p className="mt-2.5 text-sm leading-relaxed text-amber-100/80 sm:text-base">
          {HOMEPAGE_FESTIVAL_CONFIG.description}
        </p>

        <a
          href={HOMEPAGE_FESTIVAL_CONFIG.ctaHref}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl border border-amber-200/40 bg-amber-300/25 px-7 text-sm font-bold text-amber-50 backdrop-blur-xs transition-colors hover:bg-amber-300/35"
        >
          {HOMEPAGE_FESTIVAL_CONFIG.ctaLabel}
        </a>
      </div>
    </section>
  );
}
