# fayaa.tech marketing site

A static [Astro](https://astro.build) site for **fayaa.tech**: the homepage, pricing, blog and SEO landing pages. The studio, login, checkout and admin stay in the Wasp app, which moves to **app.fayaa.tech** on Fly.

```
fayaa.tech          → this site (Vercel or Cloudflare Pages), fully static HTML
app.fayaa.tech      → Wasp client on Fly (fayaa-studio-client)
fayaa-studio-server.fly.dev → Wasp server on Fly (unchanged)
```

Why we split it: Wasp builds a client-rendered app, so crawlers mostly see an empty shell. Every page here is plain HTML, with titles, meta descriptions, canonical URLs, Open Graph tags, JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage, BreadcrumbList, BlogPosting), a sitemap, RSS, `robots.txt` and `llms.txt`.

## One source of truth

The site doesn't copy the homepage. It imports it from the app:

| What | Where it lives |
| --- | --- |
| Copy, section order, dated campaigns, A/B variants | `src/marketing/landingContent.ts` |
| A/B experiments (weights, status, winner) | `src/marketing/experiments.ts` |
| The 22 FAYAA clips | `MEDIA_CLIPS` in `src/landing-page/homepageConfig.ts` |
| Colors, type, motion | `src/client/design/tokens.css` |
| Owner-managed clips | `/admin/site-media` in the app, read at build time from `GET /api/public/site-media` |

So when you edit homepage copy, a clip or an experiment in the app repo, both the app and the marketing site update.

**Site media.** When the owner changes a clip at `/admin/site-media`, the server calls `MARKETING_DEPLOY_HOOK_URL`, and the site rebuilds in about a minute. If the API can't be reached, the build falls back to the coded clips, so a build never fails because of it.

**A/B tests.** All variants are rendered into the HTML. A tiny inline script in `<head>` assigns the variant before first paint, using the same hash, weights, storage keys and `?fy_exp=` previews as the app, so there's no flicker. CSS shows the assigned copy and section order. Crawlers and visitors without JS see control. Exposure and CTA events go to Plausible or GA with `exp_*` props, just like in the app. `tests/experiments.check.mjs` checks that the inline script assigns exactly what `experiments.ts` assigns.

**Campaigns** are date windows, and a static page only changes when it's rebuilt. `.github/workflows/site.yml` triggers the deploy hook every night, so campaigns switch on and off without anyone deploying. If a campaign needs to start at an exact time, trigger the hook manually.

## Pages

- `/`: the homepage (hero video and prompt bar, reels, how it works, community remix, tools, templates, festival, around the web, final CTA, FAQ)
- `/pricing`: plans and credit packs. Checkout happens at `app.fayaa.tech/pricing`. Prices are in `src/lib/pricing.ts` and mirror the studio pricing panel.
- `/blog` and `/blog/<slug>`: Markdown files in `src/content/blog/`. Add a `.md` file to publish a post.
- Landing pages, one per search intent: `/ai-dance-video-generator`, `/ai-product-video-ads`, `/ai-video-style-transfer`, `/ai-tiktok-video-maker` and `/ai-motion-transfer`. To add one, add an entry to `src/lib/landingPages.ts`.
- Old app URLs on fayaa.tech, such as `/studio`, `/login`, `/signup`, `/account`, `/admin/*`, `/checkout`, the auth email links and the legal pages, redirect permanently to app.fayaa.tech and keep their query strings (`vercel.json`, `public/_redirects`).

## Develop

```bash
cd site
npm install
npm run dev        # http://localhost:4321
npm test           # build + SEO, redirect and A/B checks
npx astro check    # type check
```

Node 22.23.4 or newer is required. Copy `.env.example` to `.env` to override the URLs.

## Hosting

**Recommended: Vercel.** It reads `vercel.json` for clean URLs, redirects and headers, and gives you deploy hooks.

1. Import `sasmb/fayaa.tech` as a new project. Set **Root Directory** to `site` and keep "Include files outside the root directory" on, because the site imports `../src`.
2. Environment variables: `PUBLIC_SITE_URL=https://fayaa.tech`, `PUBLIC_APP_URL=https://app.fayaa.tech`, `PUBLIC_API_URL=https://fayaa-studio-server.fly.dev`, and optionally `PUBLIC_PLAUSIBLE_DOMAIN=fayaa.tech`.
3. Settings → Git → **Deploy Hooks**: create one for `main`. Save the URL as `MARKETING_DEPLOY_HOOK_URL` on the Fly server and as a GitHub Actions secret with the same name.

**Cloudflare Pages also works.** Use root directory `site`, build command `npm run build`, output `dist` and env `NODE_VERSION=24`. `public/_redirects` and `public/_headers` cover the redirects and headers.

## Cutover runbook (fayaa.tech → marketing site, app → app.fayaa.tech)

Steps 1 and 2 are safe to do at any time, because live users don't notice them. Do steps 3 to 6 together in one short window. Users will need to log in again on app.fayaa.tech, because Wasp keeps sessions per domain.

**1. Deploy the marketing site** to Vercel (see above) and check it on its `*.vercel.app` URL.

**2. Give the app its subdomain** (no impact yet):
```bash
fly certs add app.fayaa.tech -a fayaa-studio-client
```
At your DNS provider, add `CNAME app → fayaa-studio-client.fly.dev`. Then wait until `fly certs show app.fayaa.tech -a fayaa-studio-client` says the certificate is issued.

**3. Point the server at the new client URL.** This also updates CORS, auth redirects, verification and reset email links, and Paddle/Stripe return URLs, because they all come from `config.frontendUrl`:
```bash
fly secrets set -a fayaa-studio-server \
  WASP_WEB_CLIENT_URL=https://app.fayaa.tech \
  MARKETING_DEPLOY_HOOK_URL=<vercel deploy hook URL>
```

**4. Redeploy the client** with the marketing URL, so that `app.fayaa.tech/` sends signed-out visitors to fayaa.tech and signed-in users to `/studio`:
```bash
REACT_APP_MARKETING_SITE_URL=https://fayaa.tech wasp deploy fly deploy
```
Keep `REACT_APP_API_URL` and the Paddle client variables as they are today.

**5. Third-party settings:**
- **Paddle:** approve `app.fayaa.tech` under Checkout → Website approval and set it as the default payment link domain. The webhook URL is on the server, so it doesn't change.
- **Google OAuth** (Google Cloud console → Credentials): add `https://app.fayaa.tech` to Authorized JavaScript origins. The redirect URI is on the server, so it doesn't change.
- **Stripe** (only if you switch back to it): return URLs follow `WASP_WEB_CLIENT_URL`. Update the customer-portal default return URL if you set one.

**6. Move the apex domain to the marketing site.** In Vercel → Domains, add `fayaa.tech` and `www.fayaa.tech`, and use the records Vercel shows. Usually that's `A @ 76.76.21.21` and `CNAME www → cname.vercel-dns.com`. Replace the current records that point `fayaa.tech` at Fly. Once the new site loads, remove the old cert with `fly certs remove fayaa.tech -a fayaa-studio-client`.

**7. Search Console:** submit `https://fayaa.tech/sitemap-index.xml`. The old `/sitemap.xml` redirects to it. Use URL inspection on `/`, `/pricing` and one landing page.

**Rollback:** point the `fayaa.tech` DNS back to Fly (`fly certs add fayaa.tech -a fayaa-studio-client`), set `WASP_WEB_CLIENT_URL=https://fayaa.tech`, and redeploy the client without `REACT_APP_MARKETING_SITE_URL`.
