import { Link } from "react-router";
import {
  ArrowUpRight,
  BarChart3,
  Clapperboard,
  Cpu,
  Sparkles,
  Wand2,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import { AutoplayVideo, Pill, Reveal, SectionHeading } from "../../../client/design";
import { cn } from "../../../client/utils";
import type { LandingContent } from "../../../marketing/landingContent";
import { trackMarketingEvent } from "../../../marketing/analytics";
import type { BentoToolConfig, BentoToolIconKey, MediaClip } from "../../homepageConfig";

const ICONS: Record<BentoToolIconKey, LucideIcon> = {
  "wand-sparkles": WandSparkles,
  "bar-chart": BarChart3,
  cpu: Cpu,
  clapperboard: Clapperboard,
  wand2: Wand2,
  sparkles: Sparkles,
};

const GLOWS: Record<BentoToolConfig["gradient"], string> = {
  teal: "from-teal-400/25",
  blue: "from-sky-500/25",
  purple: "from-violet-500/25",
  orange: "from-fy-accent/30",
  pink: "from-fy-rose/25",
  green: "from-emerald-400/20",
};

/** Live tool as a large video tile; upcoming tools as compact glass cards. */
export function ToolsBentoSection({
  content,
  tools,
  featureClip,
  ariaLabel,
}: {
  content: LandingContent["tools"];
  tools: BentoToolConfig[];
  featureClip?: MediaClip;
  ariaLabel: string;
}) {
  const [featured, ...rest] = tools;

  return (
    <section
      id="tools-bento"
      aria-label={ariaLabel}
      className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <SectionHeading eyebrow={content.eyebrow} title={content.title} description={content.description} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {featured ? (
          <Reveal className="sm:col-span-2 lg:row-span-2">
            <Link
              to={featured.href}
              onClick={() => trackMarketingEvent("Tool Click", { tool: featured.id })}
              className="group relative flex h-full min-h-[420px] flex-col justify-end overflow-hidden rounded-fy-xl ring-1 ring-fy-line transition-shadow hover:ring-fy-accent/50"
            >
              <AutoplayVideo
                src={featureClip?.videoUrl}
                poster={featureClip?.poster}
                className="absolute inset-0"
                videoClassName="transition-transform duration-[1.4s] ease-fy-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="relative flex flex-col gap-3 p-6 sm:p-8">
                <Pill tone="live" pulse className="w-fit">
                  {featured.badge}
                </Pill>
                <h3 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{featured.title}</h3>
                <p className="max-w-md text-sm text-white/70 sm:text-base">{featured.description.replace(/\s*›\s*$/, "")}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-fy-accent-300">
                  Open in studio
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          </Reveal>
        ) : null}

        {rest.map((tool, index) => {
          const Icon = ICONS[tool.iconKey];
          return (
            <Reveal key={tool.id} delay={0.05 * (index + 1)}>
              <div
                className={cn(
                  "group relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-fy-xl border border-fy-line bg-fy-surface-1 p-6 transition-colors hover:border-fy-line-strong"
                )}
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-gradient-to-br to-transparent blur-2xl transition-opacity duration-700 group-hover:opacity-100 sm:opacity-60",
                    GLOWS[tool.gradient]
                  )}
                />
                <div className="relative flex items-start justify-between">
                  <span className="flex size-11 items-center justify-center rounded-fy-md border border-fy-line bg-white/5 text-fy-text">
                    <Icon className="size-5" />
                  </span>
                  <Pill tone={tool.available ? "live" : "neutral"}>{tool.available ? tool.badge : "Soon"}</Pill>
                </div>
                <div className="relative flex flex-col gap-1.5">
                  <h3 className="font-display text-xl font-bold tracking-tight text-fy-text">{tool.title}</h3>
                  <p className="text-sm text-fy-muted">{tool.description}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
