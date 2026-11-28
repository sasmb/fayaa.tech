// @ts-check
import { fileURLToPath } from "node:url";

import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const SITE_URL = process.env.PUBLIC_SITE_URL ?? "https://fayaa.tech";

// The marketing site reads its copy, clips and A/B tests straight from the
// Wasp app's source (../src/marketing, ../src/landing-page), so there is one
// source of truth. Those files import a few npm packages that live in the
// app's node_modules; point them at this package's copies so the site builds
// on its own (Vercel / Cloudflare Pages with "site" as the root directory).
/** @param {string} pkg */
const fromHere = (pkg) => fileURLToPath(new URL(`./node_modules/${pkg}`, import.meta.url));

export default defineConfig({
  site: SITE_URL,
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/404"),
      changefreq: "weekly",
      lastmod: new Date(),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { zod: fromHere("zod") } },
    server: { fs: { allow: [".."] } },
  },
});
