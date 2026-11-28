import { ArrowRight, Clapperboard, Gift, MonitorPlay, RectangleHorizontal, Timer } from "lucide-react";
import { Link } from "react-router";

import { FyLinkButton, Pill, Reveal, SectionHeading, useDarkSurface } from "../client/design";
import { MarketingFooter } from "../landing-page/components/marketing/MarketingFooter";
import { MarketingHeader } from "../landing-page/components/marketing/MarketingHeader";
import { SeedanceLaunchSection } from "../landing-page/components/marketing/SeedanceLaunchSection";
import { MEDIA_CLIPS, resolveMediaClip } from "../landing-page/homepageConfig";
import { estimateSeedancePlan } from "../video-studio/seedancePlanning";
import { trackMarketingEvent } from "./analytics";
import { SEEDANCE_LAUNCH, SEEDANCE_LAUNCH_COPY, SEEDANCE_LAUNCH_DATES } from "./seedanceLaunch";
import { seedanceStudioHref, useSeedanceLaunch } from "./useSeedanceLaunch";

const FEATURE_ICONS = [Clapperboard, Timer, RectangleHorizontal, MonitorPlay];

const PRICE_EXAMPLES = [
  { label: "10s at 480p", plan: estimateSeedancePlan({ totalDurationSec: 10, resolution: "480p" }) },
  { label: "10s at 720p", plan: estimateSeedancePlan({ totalDurationSec: 10, resolution: "720p" }) },
  { label: "30s at 720p", plan: estimateSeedancePlan({ totalDurationSec: 30, resolution: "720p" }) },
];

/** Packs and plans as sold on /pricing, with what Seedance Week adds. */
const BONUS_EXAMPLES = [
  { name: "Starter Pack", credits: 360 },
  { name: "Creator Pack", credits: 1170 },
  { name: "Studio Pack", credits: 2670 },
  { name: "Ultra, first month", credits: 3900 },
].map((row) => ({ ...row, bonus: Math.floor((row.credits * SEEDANCE_LAUNCH.bonusPercent) / 100) }));

const FAQ = [
  {
    q: "What is Seedance 2.5?",
    a: "Seedance 2.5 is a text-to-video model. You describe a scene and it generates the video from scratch, so you don't need a source clip or a photo. It sits next to Genjutsu in the FAYAA studio.",
  },
  {
    q: "How does the launch bonus work?",
    a: `Buy any credit pack, or start a new Plus or Ultra plan, between ${SEEDANCE_LAUNCH_DATES} and you get ${SEEDANCE_LAUNCH.bonusPercent}% extra credits on top, added automatically to your balance. No code needed.`,
  },
  {
    q: "Can I use the bonus credits on Genjutsu too?",
    a: "Yes. Credits work across every model in the studio, and bonus credits never expire while your account is active.",
  },
  {
    q: "How long can a Seedance video be?",
    a: "From 4 seconds up to 2 minutes. Anything over 30 seconds is made in pieces that continue from each other and are joined into one video.",
  },
  {
    q: "What does a video cost?",
    a: "The exact credit cost shows before you generate, based on length and resolution. If a render fails, the credits come back automatically.",
  },
];

export function SeedanceLaunchPage() {
  useDarkSurface();
  const { phase } = useSeedanceLaunch();
  const live = phase === "live";
  const clip = MEDIA_CLIPS.find((c) => c.id === "ember-premiere") ?? MEDIA_CLIPS[0];
  const resolvedClip = clip ? resolveMediaClip(clip, undefined, import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) : undefined;

  return (
    <div className="min-h-screen bg-fy-ink text-fy-text antialiased selection:bg-fy-accent selection:text-fy-on-accent">
      <MarketingHeader />
      <main className="flex flex-col">
        {phase === "upcoming" || phase === "live" ? (
          <SeedanceLaunchSection clip={resolvedClip} showPageLink={false} headingLevel="h1" />
        ) : (
          <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8">
            <Pill tone="accent">Now in the studio</Pill>
            <h1 className="fy-display mt-5 text-[clamp(2.75rem,7vw,5.5rem)]">
              Seedance 2.5 <span className="fy-text-heat">text to video.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-fy-muted">{SEEDANCE_LAUNCH_COPY.tagline}</p>
            <FyLinkButton to={SEEDANCE_LAUNCH.studioPath} variant="heat" size="lg" className="mt-8 rounded-full">
              Open Seedance
              <ArrowRight className="size-4" />
            </FyLinkButton>
          </section>
        )}

        <section aria-label="What Seedance can do" className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What it does"
            title="One prompt. A whole scene."
            description={SEEDANCE_LAUNCH_COPY.description}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SEEDANCE_LAUNCH_COPY.features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i] ?? Clapperboard;
              return (
                <Reveal key={feature.title}>
                  <div className="fy-card h-full rounded-fy-lg p-6">
                    <Icon className="size-5 text-fy-accent-300" />
                    <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-fy-muted">{feature.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section aria-label="Launch deal" className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <Reveal>
              <div className="fy-card h-full rounded-fy-xl p-8">
                <div className="flex items-center gap-2">
                  <Gift className="size-5 text-fy-accent-300" />
                  <p className="fy-eyebrow text-fy-accent-300">{SEEDANCE_LAUNCH.name} deal</p>
                </div>
                <h2 className="fy-display mt-4 text-4xl">
                  +{SEEDANCE_LAUNCH.bonusPercent}% <span className="fy-text-heat">bonus credits</span>
                </h2>
                <p className="mt-3 text-sm text-fy-muted">
                  On every credit pack and the first payment of any new plan, {SEEDANCE_LAUNCH_DATES}. Added
                  automatically, no code needed.
                </p>
                <table className="mt-6 w-full text-sm">
                  <thead>
                    <tr className="text-left text-fy-subtle">
                      <th className="pb-2 font-medium">You buy</th>
                      <th className="pb-2 font-medium">Credits</th>
                      <th className="pb-2 text-right font-medium">Launch bonus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BONUS_EXAMPLES.map((row) => (
                      <tr key={row.name} className="border-t border-fy-line">
                        <td className="py-2.5">{row.name}</td>
                        <td className="py-2.5 tabular-nums text-fy-muted">{row.credits.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-semibold tabular-nums text-fy-accent-300">
                          +{row.bonus.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <FyLinkButton
                  to="/pricing"
                  variant="heat"
                  size="lg"
                  className="mt-8 rounded-full"
                  onClick={() => trackMarketingEvent("Seedance Deal Click")}
                >
                  {live ? "Claim the bonus" : "See plans"}
                  <ArrowRight className="size-4" />
                </FyLinkButton>
              </div>
            </Reveal>
            <Reveal>
              <div className="fy-card h-full rounded-fy-xl p-8">
                <p className="fy-eyebrow text-fy-subtle">What a video costs</p>
                <h2 className="fy-display mt-4 text-4xl">Pay per second.</h2>
                <p className="mt-3 text-sm text-fy-muted">
                  The exact price shows before you hit generate. Failed renders are refunded automatically.
                </p>
                <ul className="mt-6 flex flex-col gap-2 text-sm">
                  {PRICE_EXAMPLES.map(({ label, plan }) => (
                    <li key={label} className="flex justify-between border-t border-fy-line pt-2.5">
                      <span>{label}</span>
                      <span className="font-semibold tabular-nums">{plan.credits.toLocaleString()} credits</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-8 fy-eyebrow text-fy-subtle">Prompts to start with</p>
                <div className="mt-3 flex flex-col gap-2">
                  {SEEDANCE_LAUNCH_COPY.prompts.map((prompt) => (
                    <Link
                      key={prompt}
                      to={seedanceStudioHref(prompt)}
                      onClick={() => trackMarketingEvent("Seedance Prompt Click")}
                      className="group flex items-center justify-between gap-3 rounded-fy-md border border-fy-line px-4 py-3 text-sm text-fy-muted transition-colors hover:border-fy-accent/40 hover:text-fy-text"
                    >
                      <span className="line-clamp-2">{prompt}</span>
                      <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section aria-label="Questions" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow="FAQ" title="Seedance questions" />
          <div className="mt-8 flex flex-col divide-y divide-fy-line border-y border-fy-line">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">{item.q}</summary>
                <p className="mt-2 text-sm text-fy-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
