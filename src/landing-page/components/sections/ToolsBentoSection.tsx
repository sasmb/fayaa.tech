import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  Clapperboard,
  Cpu,
  Sparkles,
  Wand2,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import type { BentoToolConfig, BentoToolIconKey } from "../../homepageConfig";
import { HOMEPAGE_PROMO_CONFIG } from "../../homepageConfig";
import { Button } from "../../../video-studio/hf/components/ui/button";
import { IconTile } from "../../../video-studio/hf/components/studio/icon-tile";

const BENTO_ICON_MAP: Record<BentoToolIconKey, LucideIcon> = {
  "wand-sparkles": WandSparkles,
  "bar-chart": BarChart3,
  cpu: Cpu,
  clapperboard: Clapperboard,
  wand2: Wand2,
  sparkles: Sparkles,
};

interface ToolsBentoSectionProps {
  tools: BentoToolConfig[];
  isLoggedIn: boolean;
  onNavigate: (path: string) => void;
  ariaLabel?: string;
}

/**
 * Row 2 asymmetric promo banner paired with the 2x3 tool bento grid.
 */
export function ToolsBentoSection({
  tools,
  isLoggedIn,
  onNavigate,
  ariaLabel = "Promotions and AI Models",
}: ToolsBentoSectionProps) {
  return (
    <section
      id="tools-bento"
      aria-label={ariaLabel}
      className="grid grid-cols-1 gap-5 lg:grid-cols-12"
    >
      {/* Left Promo Banner */}
      <div className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1B1D17] via-[#2B2922] to-[#5E5748] p-7 lg:col-span-5">
        <img
          src={HOMEPAGE_PROMO_CONFIG.backdropImage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full object-cover object-right opacity-25 mix-blend-luminosity"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0F100D]/95 via-[#181A14]/80 to-transparent"
        />

        {!isLoggedIn ? (
          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-3xl leading-[1.05] font-black tracking-tight uppercase sm:text-4xl">
                <span className="block text-white">
                  {HOMEPAGE_PROMO_CONFIG.visitor.headingPrimary}
                </span>
                <span className="block text-[#C8FF00]">
                  {HOMEPAGE_PROMO_CONFIG.visitor.headingAccent}
                </span>
              </h2>

              <ul className="flex flex-col gap-2 text-xs text-zinc-300 sm:text-sm">
                {HOMEPAGE_PROMO_CONFIG.visitor.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#C8FF00]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={() => onNavigate(HOMEPAGE_PROMO_CONFIG.visitor.ctaHref)}
                className="h-12 rounded-xl bg-[#C8FF00] px-6 text-sm font-extrabold text-black hover:bg-[#b5e600]"
              >
                {HOMEPAGE_PROMO_CONFIG.visitor.ctaLabel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl leading-[1.05] font-black tracking-tight uppercase sm:text-4xl">
                <span className="block text-[#C8FF00]">
                  {HOMEPAGE_PROMO_CONFIG.loggedIn.headingPrimary}
                </span>
                <span className="block text-zinc-200">
                  {HOMEPAGE_PROMO_CONFIG.loggedIn.headingSecondary}
                </span>
              </h2>
              <p className="text-xs text-zinc-300 sm:text-sm">
                {HOMEPAGE_PROMO_CONFIG.loggedIn.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={() =>
                  onNavigate(HOMEPAGE_PROMO_CONFIG.loggedIn.primaryCtaHref)
                }
                className="h-12 rounded-xl bg-[#C8FF00] px-6 text-sm font-extrabold text-black hover:bg-[#b5e600]"
              >
                {HOMEPAGE_PROMO_CONFIG.loggedIn.primaryCtaLabel}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  onNavigate(HOMEPAGE_PROMO_CONFIG.loggedIn.secondaryCtaHref)
                }
                className="h-12 rounded-xl border-white/20 bg-black/40 px-5 text-sm font-bold text-white hover:bg-black/60"
              >
                {HOMEPAGE_PROMO_CONFIG.loggedIn.secondaryCtaLabel}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right 2x3 Feature Bento Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-span-7">
        {tools.map((tool) => {
          const IconComponent = BENTO_ICON_MAP[tool.iconKey];
          return tool.available ? (
            <Link
              key={tool.id}
              to={tool.href}
              className="group flex flex-col justify-between rounded-2xl border border-[#C8FF00]/35 bg-[#141417] p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#C8FF00] hover:bg-[#19191D]"
            >
              <div className="flex items-center justify-between">
                <IconTile as={IconComponent} gradient={tool.gradient} />
                <ArrowRight className="size-4 text-[#C8FF00] transition-transform group-hover:translate-x-0.5" />
              </div>

              <div className="mt-6 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-bold text-white">
                    {tool.title}
                  </span>
                  <span className="shrink-0 rounded-md bg-[#C8FF00] px-2 py-0.5 text-[10px] font-black text-black uppercase">
                    {tool.badge}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-zinc-300">
                  {tool.description}
                </p>
              </div>
            </Link>
          ) : (
            <div
              key={tool.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#141417]/75 p-5 opacity-85"
            >
              <div className="flex items-center justify-between">
                <IconTile as={IconComponent} gradient={tool.gradient} />
                <span className="rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-300 uppercase">
                  {tool.badge}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-bold text-zinc-200">
                    {tool.title}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-zinc-400">
                  {tool.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
