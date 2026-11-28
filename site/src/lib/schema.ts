/** JSON-LD builders. Every page gets Organization + WebSite from Base.astro. */
import { BRAND, SITE_URL, app } from "../config";

export type JsonLd = Record<string, unknown>;

export const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

export function organization(): JsonLd {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: BRAND.name,
    url: SITE_URL,
    logo: abs("/app-icon.png"),
    ...(BRAND.sameAs.length ? { sameAs: BRAND.sameAs } : {}),
  };
}

export function website(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: BRAND.name,
    description: BRAND.description,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function softwareApplication(offers?: { name: string; price: number }[]): JsonLd {
  return {
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: BRAND.name,
    applicationCategory: "MultimediaApplication",
    applicationSubCategory: "AI video generator",
    operatingSystem: "Web",
    url: SITE_URL,
    installUrl: app.signup,
    description: BRAND.description,
    image: abs(BRAND.ogImage),
    publisher: { "@id": `${SITE_URL}/#organization` },
    offers: offers?.length
      ? offers.map((o) => ({ "@type": "Offer", name: o.name, price: o.price.toFixed(2), priceCurrency: "USD", url: abs("/pricing") }))
      : { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free to start" },
  };
}

export function faqPage(items: { q: string; a: string }[]): JsonLd {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbs(trail: { name: string; path: string }[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: abs(step.path),
    })),
  };
}

export function blogPosting(post: {
  title: string;
  description: string;
  path: string;
  published: Date;
  updated?: Date;
  author: string;
  image?: string;
}): JsonLd {
  return {
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    mainEntityOfPage: abs(post.path),
    url: abs(post.path),
    datePublished: post.published.toISOString(),
    dateModified: (post.updated ?? post.published).toISOString(),
    author: { "@type": "Organization", name: post.author, url: SITE_URL },
    publisher: { "@id": `${SITE_URL}/#organization` },
    image: abs(post.image ?? BRAND.ogImage),
  };
}

export function graph(nodes: JsonLd[]): string {
  // Escape "<" so a "</script>" inside copy can never close the tag.
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c");
}
