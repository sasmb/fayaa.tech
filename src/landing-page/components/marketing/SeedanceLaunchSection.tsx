import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router";

import { AutoplayVideo, FyLinkButton, Pill, Reveal } from "../../../client/design";
import { trackMarketingEvent } from "../../../marketing/analytics";
import { SEEDANCE_LAUNCH, SEEDANCE_LAUNCH_COPY } from "../../../marketing/seedanceLaunch";
import { seedanceStudioHref, splitCountdown, useSeedanceLaunch } from "../../../marketing/useSeedanceLaunch";
import type { MediaClip } from "../../homepageConfig";

/**
 * Seedance Week launch band. Shows a teaser with a countdown before launch,
 * the live deal during the week, and nothing once the week is over.
 */
export function SeedanceLaunchSection({
  clip,
  showPageLink = true,
  headingLevel = "h2",
}: {
  clip?: MediaClip;
  /** Link to the full launch page (off on the launch page itself). */
  showPageLink?: boolean;
  headingLevel?: "h1" | "h2";
}) {
  const { phase, remainingMs } = useSeedanceLaunch();
  if (phase === "off" || phase === "ended") return null;
  const live = phase === "live";
  const Heading = headingLevel;

  return (
    <section
      id="seedance-launch"
      aria-label="Seedance 2.5 launch"
      className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8"
    >
      <Reveal>
        <div className="fy-grain relative overflow-hidden rounded-fy-xl ring-1 ring-fy-accent/30">
          <AutoplayVideo src={clip?.videoUrl} poster={clip?.poster} className="absolute inset-0 opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-fy-ink via-fy-ink/85 to-fy-ink/30" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 -left-24 h-[420px] w-[620px] rounded-full bg-fy-accent/25 blur-[140px]"
          />

          <div className="relative grid gap-10 px-6 py-14 sm:px-12 sm:py-16 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={live ? "live" : "accent"} pulse={live}>
                  {live ? SEEDANCE_LAUNCH_COPY.badge.live : SEEDANCE_LAUNCH_COPY.badge.upcoming}
                </Pill>
                <Pill tone="soon">{SEEDANCE_LAUNCH.name}</Pill>
              </div>

              <Heading className="fy-display text-[clamp(2.75rem,7vw,5.5rem)] text-white">
                <span className="block">{SEEDANCE_LAUNCH_COPY.headline[0]}</span>
                <span className="fy-text-heat block">
                  {live ? SEEDANCE_LAUNCH_COPY.headline[1] : "is coming."}
                </span>
              </Heading>
              <p className="max-w-xl text-lg text-white/80">{SEEDANCE_LAUNCH_COPY.tagline}</p>
              <p className="max-w-xl text-sm text-fy-muted">{SEEDANCE_LAUNCH_COPY.description}</p>

              <div className="fy-glass flex w-fit items-center gap-3 rounded-fy-md px-4 py-3 text-sm">
                <Sparkles className="size-4 shrink-0 text-fy-accent-300" />
                <span className="text-fy-text">{SEEDANCE_LAUNCH_COPY.deal}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <FyLinkButton
                  to={live ? SEEDANCE_LAUNCH.studioPath : "/pricing"}
                  variant="heat"
                  size="lg"
                  className="rounded-full"
                  onClick={() => trackMarketingEvent(live ? "Seedance Try Click" : "Seedance Teaser Click")}
                >
                  {live ? "Try Seedance now" : "Stock up on credits"}
                  <ArrowRight className="size-4" />
                </FyLinkButton>
                {showPageLink ? (
                  <FyLinkButton
                    to={SEEDANCE_LAUNCH.path}
                    variant="glass"
                    size="lg"
                    className="rounded-full"
                    onClick={() => trackMarketingEvent("Seedance Page Click")}
                  >
                    See what it can do
                  </FyLinkButton>
                ) : (
                  <FyLinkButton to="/pricing" variant="glass" size="lg" className="rounded-full">
                    See plans
                  </FyLinkButton>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {remainingMs !== null ? (
                <Countdown label={live ? "Deal ends in" : "Launches in"} ms={remainingMs} />
              ) : null}
              <div className="flex flex-col gap-2">
                <p className="fy-eyebrow text-fy-subtle">{live ? "Try a prompt" : "Prompts to try on day one"}</p>
                {SEEDANCE_LAUNCH_COPY.prompts.slice(0, 3).map((prompt) => (
                  <Link
                    key={prompt}
                    to={live ? seedanceStudioHref(prompt) : SEEDANCE_LAUNCH.path}
                    onClick={() => trackMarketingEvent("Seedance Prompt Click")}
                    className="group fy-glass flex items-center justify-between gap-3 rounded-fy-md px-4 py-3 text-left text-sm text-fy-muted transition-colors hover:border-fy-accent/40 hover:text-fy-text"
                  >
                    <span className="line-clamp-2">{prompt}</span>
                    <ArrowRight className="size-4 shrink-0 text-fy-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fy-accent-300" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Countdown({ label, ms }: { label: string; ms: number }) {
  const { d, h, m, s } = splitCountdown(ms);
  const units: [string, number][] = [
    ["days", d],
    ["hrs", h],
    ["min", m],
    ["sec", s],
  ];
  return (
    <div>
      <p className="fy-eyebrow text-fy-subtle">{label}</p>
      <div className="mt-2 grid grid-cols-4 gap-2" role="timer" aria-live="off">
        {units.map(([unit, value]) => (
          <div key={unit} className="fy-glass rounded-fy-md px-2 py-3 text-center">
            <div className="fy-display text-3xl tabular-nums text-white sm:text-4xl">
              {String(value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-fy-subtle uppercase">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
