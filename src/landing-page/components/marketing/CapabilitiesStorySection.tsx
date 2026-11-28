import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { AutoplayVideo, FY_EASE_OUT, FyLinkButton, Reveal } from "../../../client/design";
import { cn } from "../../../client/utils";
import type { LandingContent } from "../../../marketing/landingContent";
import { trackMarketingEvent } from "../../../marketing/analytics";
import type { MediaClip } from "../../homepageConfig";

/**
 * Scroll-told product story. On desktop a video stage stays pinned while the
 * steps scroll past; the stage cross-fades to the clip for the active step.
 * On mobile each step carries its own clip.
 */
export function CapabilitiesStorySection({
  content,
  clipsById,
  ariaLabel,
}: {
  content: LandingContent["capabilities"];
  clipsById: Record<string, MediaClip>;
  ariaLabel: string;
}) {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(index)) setActive(index);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [content.steps.length]);

  const activeStep = content.steps[active] ?? content.steps[0];
  const activeClip = activeStep ? clipsById[activeStep.clipId] : undefined;

  return (
    <section aria-label={ariaLabel} className="relative mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Reveal className="mb-14 flex max-w-3xl flex-col gap-3">
        <span className="fy-eyebrow">{content.eyebrow}</span>
        <h2 className="fy-display text-4xl text-fy-text sm:text-6xl">{content.title}</h2>
        <p className="max-w-xl text-base text-fy-muted sm:text-lg">{content.description}</p>
      </Reveal>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        {/* Pinned stage (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <div className="relative aspect-[4/3] overflow-hidden rounded-fy-xl ring-1 ring-fy-line">
              <AnimatePresence mode="sync">
                {activeClip ? (
                  <motion.div
                    key={activeClip.id + active}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: FY_EASE_OUT }}
                    className="absolute inset-0"
                  >
                    <AutoplayVideo
                      src={activeClip.videoUrl}
                      poster={activeClip.poster}
                      alt={activeClip.title}
                      className="size-full"
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                <span className="fy-eyebrow text-white/80">{activeStep?.tag}</span>
                <div className="flex gap-1.5">
                  {content.steps.map((step, index) => (
                    <span
                      key={step.id}
                      className={cn(
                        "h-1 rounded-full transition-all duration-500 ease-fy-out",
                        index === active ? "w-8 bg-fy-accent" : "w-3 bg-white/30"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col">
          {content.steps.map((step, index) => {
            const clip = clipsById[step.clipId];
            return (
              <div
                key={step.id}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                data-index={index}
                className="flex min-h-[auto] flex-col justify-center gap-5 border-t border-fy-line py-10 first:border-t-0 lg:min-h-[70vh] lg:py-0"
              >
                {clip ? (
                  <AutoplayVideo
                    src={clip.videoUrl}
                    poster={clip.poster}
                    alt={clip.title}
                    className="aspect-[16/10] rounded-fy-lg ring-1 ring-fy-line lg:hidden"
                  />
                ) : null}
                <span className={cn("fy-eyebrow transition-colors duration-500", index === active && "text-fy-accent-300")}>
                  {step.tag}
                </span>
                <h3
                  className={cn(
                    "font-display text-3xl font-bold tracking-tight transition-colors duration-500 sm:text-4xl",
                    index === active ? "text-fy-text" : "text-fy-text lg:text-fy-subtle"
                  )}
                >
                  {step.title}
                </h3>
                <p className="max-w-md text-base text-fy-muted">{step.body}</p>
              </div>
            );
          })}
          <div className="pt-6">
            <FyLinkButton
              to={content.cta.href}
              size="lg"
              className="rounded-full"
              onClick={() => trackMarketingEvent(content.cta.event ?? "Studio Open", { placement: "capabilities" })}
            >
              {content.cta.label}
              <ArrowRight className="size-4" />
            </FyLinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
