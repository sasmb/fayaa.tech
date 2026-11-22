import { type App } from "@wasp.sh/spec";

// Route-specific titles, descriptions, canonicals, and social cards are rendered
// by RouteMetadata so prerendered pages expose their own values.
export const head: App["head"] = [
  "<link rel='icon' href='/favicon.ico' sizes='any' />",
  "<link rel='icon' href='/favicon.svg' type='image/svg+xml' />",
  "<link rel='apple-touch-icon' href='/app-icon.png' />",
  "<meta name='author' content='FAYAA' />",
  "<meta property='og:site_name' content='FAYAA' />",
];
