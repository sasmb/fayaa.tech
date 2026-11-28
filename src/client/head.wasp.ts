import { type App } from "@wasp.sh/spec";

export const head: App["head"] = [
  "<link rel='icon' href='/favicon.ico' sizes='any' />",
  "<link rel='icon' href='/favicon.svg' type='image/svg+xml' />",
  "<link rel='apple-touch-icon' href='/app-icon.png' />",
  "<link rel='preconnect' href='https://fonts.googleapis.com' />",
  "<link rel='preconnect' href='https://fonts.gstatic.com' />",
  "<link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;600&display=swap' />",

  "<meta name='description' content='FAYAA — The All-in-One Content Creation Studio. Pick trending templates, copy TikTok dances, build consistent virtual creators, and generate viral videos at 10x speed.' />",
  "<meta name='author' content='FAYAA' />",
  "<meta name='keywords' content='FAYAA, FAYAA Templates, FAYAA Motion Control, FAYAA Influencer, FAYAA Video, FAYAA Swap, FAYAA Lip-Sync, FAYAA Product Ads, FAYAA Camera, FAYAA Clipper, FAYAA Audio' />",

  "<meta property='og:type' content='website' />",
  "<meta property='og:title' content='FAYAA — The All-in-One Content Creation Studio' />",
  "<meta property='og:site_name' content='FAYAA' />",
  "<meta property='og:url' content='https://fayaa.tech' />",
  "<meta property='og:description' content='Stop juggling 10 different editing tools. Pick a trending template, drop in a single photo, copy any TikTok dance, or launch a consistent virtual creator.' />",
  "<meta property='og:image' content='https://fayaa.tech/public-banner.webp' />",
  "<meta name='twitter:image' content='https://fayaa.tech/public-banner.webp' />",
  "<meta name='twitter:image:width' content='1200' />",
  "<meta name='twitter:image:height' content='630' />",
  "<meta name='twitter:card' content='summary_large_image' />",
  // TODO: You can put your Plausible analytics scripts below (https://docs.opensaas.sh/guides/analytics/):
  // NOTE: Plausible does not use Cookies, so you can simply add the scripts here.
  // Google, on the other hand, does, so you must instead add the script dynamically
  // via the Cookie Consent component after the user clicks the "Accept" cookies button.
  "<script async data-domain='<your-site-id>' src='https://plausible.io/js/script.js'></script>", // for production
  "<script async data-domain='<your-site-id>' src='https://plausible.io/js/script.local.js'></script>", // for development
];
