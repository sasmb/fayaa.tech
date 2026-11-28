import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronDown, Sparkles } from "lucide-react";

import { AutoplayVideo, FY_EASE_OUT, FyLinkButton, useReducedMotion } from "../../../client/design";
import { cn } from "../../../client/utils";
import type { LandingContent } from "../../../marketing/landingContent";
import { trackMarketingEvent } from "../../../marketing/analytics";
import type { MediaClip } from "../../homepageConfig";
import { ClipTile } from "./ClipTile";

interface HeroSectionProps {
  content: LandingContent["hero"];
  background: MediaClip;
  floating: MediaClip[];
  isLoggedIn: boolean;
  onSubmitPrompt: (prompt: string) => void;
  ariaLabel: string;
}

/** Cycles through example prompts with a typewriter effect. */
function useTypewriter(examples: string[], enabled: boolean) {
  const [text, setText] = useState(examples[0] ?? "");
  useEffect(() => {
    if (!enabled || examples.length === 0) return;
    let exampleIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = examples[exampleIndex] ?? "";
      if (!deleting) {
        charIndex += 1;
        setText(current.slice(0, charIndex));
        if (charIndex >= current.length) {
          deleting = true;
          timer = setTimeout(tick, 2200);
          return;
        }
        timer = setTimeout(tick, 38);
      } else {
        charIndex -= 2;
        setText(current.slice(0, Math.max(charIndex, 0)));
        if (charIndex <= 0) {
          deleting = false;
          exampleIndex = (exampleIndex + 1) % examples.length;
          timer = setTimeout(tick, 300);
          return;
        }
        timer = setTimeout(tick, 18);
      }
    };
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, [examples, enabled]);
  return text;
}

/**
 * Full-bleed video hero. The background clip plays edge to edge under a dark
 * veil; the headline staggers in line by line; floating clips drift with
 * scroll on large screens; a prompt bar drops visitors straight into the studio.
 */
export function HeroSection({
  content,
  background,
  floating,
  isLoggedIn,
  onSubmitPrompt,
  ariaLabel,
}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const placeholder = useTypewriter(content.promptExamples, !reduced && !focused && prompt === "");

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const floatUp = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const floatDown = useTransform(scrollYProgress, [0, 1], [0, 90]);

  const primaryCta = isLoggedIn
    ? { label: "Open the studio", href: "/studio", event: "Studio Open" }
    : content.primaryCta;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = prompt.trim() || placeholder.trim();
    trackMarketingEvent("Hero Prompt Submit", { has_custom_prompt: prompt.trim() ? "yes" : "no" });
    onSubmitPrompt(value);
  };

  return (
    <section
      ref={sectionRef}
      aria-label={ariaLabel}
      className="fy-grain relative -mt-16 flex min-h-[100svh] w-full items-end overflow-hidden bg-fy-ink pt-16"
    >
      {/* Background video */}
      <motion.div style={reduced ? undefined : { scale: videoScale }} className="absolute inset-0">
        <AutoplayVideo
          src={background.videoUrl}
          poster={background.poster}
          mode="always"
          priority
          className="absolute inset-0 size-full bg-fy-ink"
        />
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_10%,transparent_0%,rgb(7_7_10/0.55)_55%,#07070a_100%)]" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-fy-ink via-fy-ink/70 to-transparent" />
      <div aria-hidden="true" className="absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-fy-accent/20 blur-[140px]" />

      {/* Floating clips (desktop) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden xl:block">
        {floating[0] ? (
          <motion.div style={reduced ? undefined : { y: floatUp }} className="absolute top-[18%] right-[6%] w-[220px] rotate-[4deg]">
            <ClipTile clip={floating[0]} mode="always" className="shadow-2xl shadow-black/60" />
          </motion.div>
        ) : null}
        {floating[1] ? (
          <motion.div style={reduced ? undefined : { y: floatDown }} className="absolute top-[46%] right-[19%] w-[170px] -rotate-[5deg]">
            <ClipTile clip={floating[1]} mode="always" showLabel={false} className="shadow-2xl shadow-black/60" />
          </motion.div>
        ) : null}
        {floating[2] ? (
          <motion.div style={reduced ? undefined : { y: floatUp }} className="absolute top-[64%] right-[3%] w-[260px] rotate-[2deg]">
            <ClipTile clip={floating[2]} mode="always" aspectClassName="aspect-[16/10]" className="shadow-2xl shadow-black/60" />
          </motion.div>
        ) : null}
      </div>

      {/* Copy */}
      <motion.div
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8"
      >
        <motion.span
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: FY_EASE_OUT }}
          className="fy-glass inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-fy-text"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-fy-accent opacity-70" />
            <span className="relative inline-flex size-2 rounded-full bg-fy-accent" />
          </span>
          {content.eyebrow}
        </motion.span>

        <h1 className="fy-display max-w-[14ch] text-[clamp(3.4rem,11vw,10.5rem)] text-fy-text">
          {content.headline.map((line, index) => (
            <span key={`${line}-${index}`} className="block overflow-hidden pb-[0.06em]">
              <motion.span
                initial={reduced ? false : { y: "105%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.1, ease: FY_EASE_OUT, delay: 0.15 + index * 0.12 }}
                className={cn("block", index === content.accentLine && "fy-text-heat")}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: FY_EASE_OUT, delay: 0.5 }}
          className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex max-w-xl flex-col gap-6">
            <p className="text-base text-fy-muted sm:text-lg">{content.subhead}</p>

            <form
              onSubmit={submit}
              className={cn(
                "fy-glass flex items-center gap-2 rounded-fy-lg p-1.5 pl-4 transition-[border-color,box-shadow] duration-300",
                focused && "border-fy-accent/50 shadow-[0_0_0_4px_rgb(255_91_31/0.12)]"
              )}
            >
              <Sparkles className="size-4 shrink-0 text-fy-accent-300" />
              <label htmlFor="hero-prompt" className="sr-only">
                Describe your video
              </label>
              <input
                id="hero-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder || "Describe your video"}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-fy-text placeholder:text-fy-subtle focus:ring-0 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-fy-md bg-fy-accent px-4 text-sm font-semibold text-fy-on-accent transition-colors hover:bg-fy-accent-hover"
              >
                Generate
                <ArrowRight className="size-4" />
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3">
              <FyLinkButton
                to={primaryCta.href}
                variant="light"
                size="lg"
                className="rounded-full"
                onClick={() => trackMarketingEvent(primaryCta.event ?? "Hero CTA Click", { placement: "hero" })}
              >
                {primaryCta.label}
                <ArrowUpRight className="size-4 transition-transform group-hover/fy-btn:translate-x-0.5 group-hover/fy-btn:-translate-y-0.5" />
              </FyLinkButton>
              {!isLoggedIn ? (
                <FyLinkButton
                  to={content.secondaryCta.href}
                  variant="glass"
                  size="lg"
                  className="rounded-full"
                  onClick={() => trackMarketingEvent(content.secondaryCta.event ?? "Hero Secondary Click", { placement: "hero" })}
                >
                  {content.secondaryCta.label}
                </FyLinkButton>
              ) : null}
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-6 border-t border-fy-line pt-5 lg:max-w-md lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            {content.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="order-2 text-xs text-fy-subtle">{stat.label}</dt>
                <dd className="order-1 font-display text-2xl font-bold tracking-tight text-fy-text sm:text-3xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </motion.div>

      <a
        href="#after-hero"
        aria-label="Scroll to explore"
        className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 text-fy-subtle transition-colors hover:text-fy-text sm:block"
      >
        <ChevronDown className="size-5 animate-bounce" />
      </a>
    </section>
  );
}
