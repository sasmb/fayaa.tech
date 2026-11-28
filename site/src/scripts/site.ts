/**
 * Client behavior for every page: lazy, viewport-aware video playback and
 * analytics for CTAs and experiment exposure. Kept tiny on purpose.
 */
import { setAnalyticsExperimentContext, trackExposure, trackMarketingEvent } from "../../../src/marketing/analytics";
import { EXPERIMENTS } from "../../../src/marketing/experiments";

declare global {
  interface Window {
    __fyExp?: Record<string, string>;
  }
}

// ---- Video: play only what is on screen; respect reduced motion and data saver.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
const videos = Array.from(document.querySelectorAll<HTMLVideoElement>("video[data-clip]"));

function markReady(video: HTMLVideoElement) {
  if (video.readyState >= 2) video.classList.add("is-ready");
  else video.addEventListener("loadeddata", () => video.classList.add("is-ready"), { once: true });
}

function load(video: HTMLVideoElement) {
  const src = video.dataset.src;
  if (src && !video.src) {
    video.src = src;
    video.preload = "auto";
  }
}

if (reduceMotion || saveData) {
  // Show a still frame instead of motion.
  for (const video of videos) {
    video.autoplay = false;
    video.pause();
    if (video.dataset.src && !video.src) {
      video.preload = "metadata";
      video.src = `${video.dataset.src}#t=0.1`;
    }
    markReady(video);
  }
} else if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          load(video);
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      }
    },
    { rootMargin: "200px 0px" }
  );
  for (const video of videos) {
    markReady(video);
    observer.observe(video);
  }
} else {
  for (const video of videos) {
    load(video);
    markReady(video);
  }
}

// ---- Analytics: experiment context, exposure and CTA clicks.
const assignments = window.__fyExp ?? {};
setAnalyticsExperimentContext(assignments);
if (document.querySelector("[data-exp]") || document.body.dataset.experiments === "on") {
  for (const experiment of EXPERIMENTS) {
    if (experiment.status !== "running") continue;
    trackExposure(experiment.id, assignments[experiment.id] ?? "control");
  }
}

document.addEventListener("click", (event) => {
  const target = (event.target as Element | null)?.closest<HTMLElement>("[data-event]");
  const name = target?.dataset.event;
  if (name) trackMarketingEvent(name, { page: location.pathname });
});

// ---- Hero prompt bar: open the studio with the prompt filled in.
for (const form of document.querySelectorAll<HTMLFormElement>("form[data-prompt-form]")) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = form.querySelector<HTMLInputElement>("input[name=prompt]");
    const value = (input?.value.trim() || input?.placeholder || "").trim();
    trackMarketingEvent("Hero Prompt Submit", { has_custom_prompt: input?.value.trim() ? "yes" : "no" });
    const url = new URL(form.action);
    if (value) url.searchParams.set("prompt", value);
    window.location.href = url.toString();
  });
}
