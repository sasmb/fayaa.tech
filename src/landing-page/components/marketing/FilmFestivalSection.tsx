import { ArrowRight } from "lucide-react";

import { AutoplayVideo, FyLinkButton, Pill, Reveal } from "../../../client/design";
import type { LandingContent } from "../../../marketing/landingContent";
import { trackMarketingEvent } from "../../../marketing/analytics";
import type { MediaClip } from "../../homepageConfig";

/** Cinematic campaign band: full-width clip with a letterboxed headline. */
export function FilmFestivalSection({
  content,
  clip,
  ariaLabel,
}: {
  content: LandingContent["festival"];
  clip?: MediaClip;
  ariaLabel: string;
}) {
  return (
    <section aria-label={ariaLabel} className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <Reveal>
        <div className="fy-grain relative flex min-h-[460px] items-center overflow-hidden rounded-fy-xl ring-1 ring-fy-line">
          <AutoplayVideo src={clip?.videoUrl} poster={clip?.poster} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-10 bg-black sm:h-14" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-10 bg-black sm:h-14" />
          <div className="relative flex max-w-2xl flex-col gap-5 px-6 py-20 sm:px-12">
            <Pill tone="soon" className="w-fit">
              {content.eyebrow}
            </Pill>
            <h2 className="fy-display text-4xl text-white sm:text-6xl">{content.title}</h2>
            <p className="max-w-lg text-base text-white/70">{content.description}</p>
            <FyLinkButton
              to={content.cta.href}
              variant="glass"
              size="lg"
              className="w-fit rounded-full"
              onClick={() => trackMarketingEvent(content.cta.event ?? "Festival Click")}
            >
              {content.cta.label}
              <ArrowRight className="size-4" />
            </FyLinkButton>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
