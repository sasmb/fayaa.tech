import * as z from "zod";

export const plausibleEnvSchema = z.object({
  PLAUSIBLE_API_KEY: z.string().default("unused"),
  PLAUSIBLE_SITE_ID: z.string().default("unused"),
  PLAUSIBLE_BASE_URL: z.string().default("https://plausible.io"),
});

export const googleAnalyticsEnvSchema = z.object({
  GOOGLE_ANALYTICS_CLIENT_EMAIL: z.string().default("unused@example.com"),
  GOOGLE_ANALYTICS_PRIVATE_KEY: z.string().default("dW51c2Vk"),
  GOOGLE_ANALYTICS_PROPERTY_ID: z.string().default("000000"),
});
