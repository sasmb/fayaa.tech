import { ArrowUpRight } from "lucide-react";

import { AutoplayVideo, FyLinkButton, Reveal } from "../../../client/design";
import type { LandingContent } from "../../../marketing/landingContent";
import { trackMarketingEvent } from "../../../marketing/analytics";
import type { MediaClip } from "../../homepageConfig";

/** Closing call to action over a heat-tinted clip. */
export function FinalCtaSection({
  content,
  clip,
  isLoggedIn,
  ariaLabel,
}: {
  content: LandingContent["finalCta"];
  clip?: MediaClip;
  isLoggedIn: boolean;
  ariaLabel: string;
}) {
  const primary = isLoggedIn
    ? { label: "Open the studio", href: "/studio", event: "Studio Open" }
    : content.primaryCta;
  return (
    <section aria-label={ariaLabel} className="mx-auto w-full max-w-[1440px] px-4 pt-10 pb-24 sm:px-6 lg:px-8">
      <div className="fy-grain relative overflow-hidden rounded-fy-xl ring-1 ring-fy-line">
        <AutoplayVideo src={clip?.videoUrl} poster={clip?.poster} className="absolute inset-0" />
        <div className="absolute inset-0 bg-fy-ink/70" />
        <div className="fy-heat-bg absolute inset-0 opacity-30 mix-blend-color" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_100%,rgb(255_91_31/0.35),transparent)]" />
        <Reveal className="relative flex flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
          <h2 className="fy-display text-[clamp(2.8rem,8vw,7rem)] text-white">
            {content.title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="max-w-xl text-base text-white/75 sm:text-lg">{content.subhead}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <FyLinkButton
              to={primary.href}
              variant="light"
              size="xl"
              className="rounded-full"
              onClick={() => trackMarketingEvent(primary.event ?? "Final CTA Click", { placement: "final" })}
            >
              {primary.label}
              <ArrowUpRight className="size-5" />
            </FyLinkButton>
            <FyLinkButton
              to={content.secondaryCta.href}
              variant="glass"
              size="xl"
              className="rounded-full"
              onClick={() => trackMarketingEvent(content.secondaryCta.event ?? "Pricing Click", { placement: "final" })}
            >
              {content.secondaryCta.label}
            </FyLinkButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
