import { BRAND, SITE_URL, app } from "../config";
import { getPosts } from "../lib/blog";
import { LANDING_PAGES } from "../lib/landingPages";
import { CREDIT_PACKS, PLANS } from "../lib/pricing";

/** llms.txt (https://llmstxt.org): a plain-text map of the site for AI assistants. */
export async function GET() {
  const posts = await getPosts();
  const plans = PLANS.map((p) => `${p.name} from $${p.annualPerMonth}/mo`).join(", ");
  const lines = [
    `# ${BRAND.name}: ${BRAND.tagline}`,
    "",
    `> ${BRAND.description}`,
    "",
    "## Pages",
    "",
    `- [Home](${SITE_URL}/): What FAYAA does, with example videos`,
    `- [Pricing](${SITE_URL}/pricing): ${plans}; credit packs from $${CREDIT_PACKS[0]?.price ?? 12}`,
    ...LANDING_PAGES.map((p) => `- [${p.nav}](${SITE_URL}/${p.slug}): ${p.description}`),
    "",
    "## Guides",
    "",
    ...posts.map((p) => `- [${p.data.title}](${SITE_URL}/blog/${p.id}): ${p.data.description}`),
    "",
    "## App",
    "",
    `- [Studio](${app.studio()}): Make videos (sign-in required to generate)`,
    `- [Sign up](${app.signup}): Free account with starter credits`,
    `- [Terms](${app.terms}), [Privacy](${app.privacy}), [Refunds](${app.refunds})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
