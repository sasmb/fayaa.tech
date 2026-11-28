/** Site-wide settings. Override any of these with PUBLIC_* env vars at build time. */
const env = import.meta.env;

const trim = (url: string) => url.replace(/\/+$/, "");

export const SITE_URL = trim(env.PUBLIC_SITE_URL || "https://fayaa.tech");
export const APP_URL = trim(env.PUBLIC_APP_URL || "https://app.fayaa.tech");
export const API_URL = trim(env.PUBLIC_API_URL || "https://fayaa-studio-server.fly.dev");
export const PLAUSIBLE_DOMAIN = env.PUBLIC_PLAUSIBLE_DOMAIN || "";

export const BRAND = {
  name: "FAYAA",
  tagline: "Viral videos in seconds",
  description:
    "FAYAA is an AI video studio that turns any clip or idea into scroll-stopping short-form video. Join trends, swap in your product, restyle footage and post to TikTok, Reels and Shorts in seconds.",
  ogImage: "/og-image.png",
  supportEmail: "sam@nepocommerce.com",
  sameAs: [] as string[],
};

/** Links into the app (studio, auth, checkout). Keep every app URL here. */
export const app = {
  home: `${APP_URL}/studio`,
  studio: (prompt?: string) =>
    prompt ? `${APP_URL}/studio?prompt=${encodeURIComponent(prompt)}` : `${APP_URL}/studio`,
  signup: `${APP_URL}/signup`,
  login: `${APP_URL}/login`,
  pricing: `${APP_URL}/pricing`,
  terms: `${APP_URL}/terms`,
  privacy: `${APP_URL}/privacy`,
  refunds: `${APP_URL}/refunds`,
};

/**
 * Turns an href from landingContent.ts (written for the app, e.g. "/signup")
 * into the right absolute link for the marketing site.
 */
export function resolveHref(href: string): string {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  const marketingPaths = ["/", "/pricing", "/blog", "/seedance"];
  if (marketingPaths.includes(href) || href.startsWith("/blog/")) return href;
  return `${APP_URL}${href}`;
}
