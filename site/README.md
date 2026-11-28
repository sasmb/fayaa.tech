# fayaa.tech marketing site

A static [Astro](https://astro.build) site for **fayaa.tech**: the homepage, pricing, blog and SEO landing pages. The studio, login, checkout and admin stay in the Wasp app, which moves to **app.fayaa.tech** on Fly.

Everything stays on Fly:

```
fayaa.tech                  → this site, Fly app "fayaa-marketing" (nginx serving static HTML)
app.fayaa.tech              → Wasp client, Fly app "fayaa-studio-client"
fayaa-studio-server.fly.dev → Wasp server, Fly app "fayaa-studio-server" (unchanged)
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

**Site media.** Each deploy reads the clips set at `/admin/site-media`. The site redeploys every night, and you can redeploy right away from GitHub → Actions → Marketing site → Run workflow. If the API can't be reached, the build falls back to the coded clips, so a build never fails because of it.

**A/B tests.** All variants are rendered into the HTML. A tiny inline script in `<head>` assigns the variant before first paint, using the same hash, weights, storage keys and `?fy_exp=` previews as the app, so there's no flicker. CSS shows the assigned copy and section order. Crawlers and visitors without JS see control. Exposure and CTA events go to Plausible or GA with `exp_*` props, just like in the app. `tests/experiments.check.mjs` checks that the inline script assigns exactly what `experiments.ts` assigns.

**Campaigns** are date windows, and a static page only changes when it's rebuilt. The nightly deploy in `.github/workflows/site.yml` switches them on and off. If a campaign needs to start at an exact time, run the workflow by hand.

## Pages

- `/`: the homepage (hero video and prompt bar, reels, how it works, community remix, tools, templates, festival, around the web, final CTA, FAQ)
- `/pricing`: plans and credit packs. Checkout happens at `app.fayaa.tech/pricing`. Prices are in `src/lib/pricing.ts` and mirror the studio pricing panel.
- `/blog` and `/blog/<slug>`: Markdown files in `src/content/blog/`. Add a `.md` file to publish a post.
- Landing pages, one per search intent: `/ai-dance-video-generator`, `/ai-product-video-ads`, `/ai-video-style-transfer`, `/ai-tiktok-video-maker` and `/ai-motion-transfer`. To add one, add an entry to `src/lib/landingPages.ts`.
- Old app URLs on fayaa.tech, such as `/studio`, `/login`, `/signup`, `/account`, `/admin/*`, `/checkout`, the auth email links and the legal pages, redirect permanently to app.fayaa.tech and keep their query strings (`nginx.conf`).

## Develop

```bash
cd site
npm install
npm run dev        # http://localhost:4321
npm test           # build + SEO, redirect and A/B checks
npx astro check    # type check
```

Node 22.23.4 or newer is required. Copy `.env.example` to `.env` to override the URLs.


## Hosting (Fly)

The site is a Docker image: Astro builds the HTML, and nginx serves it with clean URLs, redirects and caching (`Dockerfile`, `nginx.conf`, `fly.toml`). Deploy it from the **repo root**, because it imports `../src`:

```bash
fly apps create fayaa-marketing        # once
fly deploy --config site/fly.toml --remote-only
```

After that, `.github/workflows/site.yml` deploys on every push to `main` that touches the site, and again every night. Add a `FLY_API_TOKEN` secret to GitHub (`fly tokens create deploy -a fayaa-marketing`).

## Cutover runbook (fayaa.tech → marketing site, app → app.fayaa.tech)

Steps 1 and 2 are safe to do at any time, because live users don't notice them. Do steps 3 to 6 together in one short window. Users will need to log in again on app.fayaa.tech, because Wasp keeps sessions per domain.

**1. Deploy the marketing site** (see above) and check it at `https://fayaa-marketing.fly.dev`.

**2. Give the app its subdomain** (no impact yet):
```bash
fly certs add app.fayaa.tech -a fayaa-studio-client
```
At your DNS provider, add `CNAME app → fayaa-studio-client.fly.dev`. Then wait until `fly certs show app.fayaa.tech -a fayaa-studio-client` says the certificate is issued.

**3. Point the server at the new client URL.** This also updates CORS, auth redirects, verification and reset email links, and Stripe checkout and portal return URLs, because they all come from `config.frontendUrl`. Your existing Stripe keys stay as they are.
```bash
fly secrets set -a fayaa-studio-server WASP_WEB_CLIENT_URL=https://app.fayaa.tech
```

**4. Redeploy the client** with the marketing URL, so that `app.fayaa.tech/` sends signed-out visitors to fayaa.tech and signed-in users to `/studio`:
```bash
REACT_APP_MARKETING_SITE_URL=https://fayaa.tech wasp deploy fly deploy
```
Keep the other `REACT_APP_*` variables as they are today.

**5. Google sign-in** (Google Cloud console → Credentials): add `https://app.fayaa.tech` to Authorized JavaScript origins. The redirect URI is on the server, so it doesn't change. The Stripe webhook is also on the server, so it doesn't change.

**6. Move fayaa.tech to the marketing app:**
```bash
fly certs remove fayaa.tech -a fayaa-studio-client
fly certs add fayaa.tech -a fayaa-marketing
fly certs add www.fayaa.tech -a fayaa-marketing
```
Point the DNS for `fayaa.tech` and `www` at the records `fly certs show fayaa.tech -a fayaa-marketing` prints. That's usually an A and an AAAA record from `fly ips list -a fayaa-marketing` for the apex, and `CNAME www → fayaa-marketing.fly.dev`. Then replace the records that point at the client.

**7. Search Console:** submit `https://fayaa.tech/sitemap-index.xml`. The old `/sitemap.xml` redirects to it. Use URL inspection on `/`, `/pricing` and one landing page.

**Rollback:** move the `fayaa.tech` cert and DNS back to `fayaa-studio-client`, set `WASP_WEB_CLIENT_URL=https://fayaa.tech`, and redeploy the client without `REACT_APP_MARKETING_SITE_URL`.
