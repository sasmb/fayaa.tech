import * as z from "zod";

/**
 * Marketing site split: fayaa.tech is the static marketing site (site/, on
 * Fly) and app.fayaa.tech is this Wasp app. Optional: without it, the app
 * keeps serving its own homepage.
 */
export const marketingClientEnvSchema = z.object({
  /** e.g. https://fayaa.tech. When set, the app's "/" sends visitors to the marketing site. */
  REACT_APP_MARKETING_SITE_URL: z.string().url().optional(),
});
