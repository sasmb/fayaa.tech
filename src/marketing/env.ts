import * as z from "zod";

/**
 * Marketing site split (fayaa.tech = static marketing site, app.fayaa.tech =
 * this Wasp app). Both are optional: with neither set, the app behaves as
 * before and serves its own homepage.
 */
export const marketingEnvSchema = z.object({
  /** Vercel / Cloudflare Pages deploy hook. Called after site media changes so the static site rebuilds. */
  MARKETING_DEPLOY_HOOK_URL: z.string().url().optional(),
});

export const marketingClientEnvSchema = z.object({
  /** e.g. https://fayaa.tech. When set, the app's "/" sends visitors to the marketing site. */
  REACT_APP_MARKETING_SITE_URL: z.string().url().optional(),
});
