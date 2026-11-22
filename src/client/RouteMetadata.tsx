import { Fragment } from "react";

export type RobotsPolicy =
  | "index,follow"
  | "noindex,follow"
  | "noindex,nofollow";

export interface RouteMetadataEntry {
  path: string;
  title: string;
  description: string;
  robots: RobotsPolicy;
  socialImage?: string;
  canonical?: boolean;
}

export const ROUTE_METADATA: Record<string, RouteMetadataEntry> = {
  "/": {
    path: "/",
    title: "AI Video Creation Studio | FAYAA",
    description:
      "Create AI videos with motion transfer, character and object swaps, and video restyle powered by Higgsfield Genjutsu.",
    robots: "index,follow",
  },
  "/pricing": {
    path: "/pricing",
    title: "FAYAA Pricing: Plans and Credits",
    description:
      "Compare FAYAA creator subscriptions and one-time credit packs for AI video generation.",
    robots: "index,follow",
  },
  "/terms": {
    path: "/terms",
    title: "Terms of Service | FAYAA",
    description: "Read the terms that apply when using FAYAA.",
    robots: "index,follow",
  },
  "/privacy": {
    path: "/privacy",
    title: "Privacy Policy | FAYAA",
    description: "Learn how FAYAA handles account and service data.",
    robots: "index,follow",
  },
  "/refunds": {
    path: "/refunds",
    title: "Refund Policy | FAYAA",
    description:
      "Review FAYAA's refund policy for subscriptions and credit purchases.",
    robots: "index,follow",
  },
  "/studio": {
    path: "/studio",
    title: "FAYAA Studio",
    description: "Create AI videos in FAYAA Studio.",
    robots: "noindex,follow",
  },
  "/login": {
    path: "/login",
    title: "Log in | FAYAA",
    description: "Log in to your FAYAA account.",
    robots: "noindex,follow",
  },
  "/signup": {
    path: "/signup",
    title: "Create an account | FAYAA",
    description: "Create your FAYAA account.",
    robots: "noindex,follow",
  },
  "/request-password-reset": {
    path: "/request-password-reset",
    title: "Reset your password | FAYAA",
    description: "Request a password reset for your FAYAA account.",
    robots: "noindex,follow",
  },
  "/password-reset": {
    path: "/password-reset",
    title: "Choose a new password | FAYAA",
    description: "Set a new password for your FAYAA account.",
    robots: "noindex,follow",
  },
  "/email-verification": {
    path: "/email-verification",
    title: "Verify your email | FAYAA",
    description: "Verify the email address for your FAYAA account.",
    robots: "noindex,follow",
  },
  "/account": {
    path: "/account",
    title: "Your account | FAYAA",
    description: "Manage your FAYAA account.",
    robots: "noindex,nofollow",
    canonical: false,
  },
  "/checkout": {
    path: "/checkout",
    title: "Checkout | FAYAA",
    description: "View your FAYAA checkout status.",
    robots: "noindex,nofollow",
    canonical: false,
  },
  "/admin": {
    path: "/admin",
    title: "Administration | FAYAA",
    description: "FAYAA administration.",
    robots: "noindex,nofollow",
    canonical: false,
  },
};

export function resolveRouteMetadata(
  pathname: string,
): RouteMetadataEntry | undefined {
  const pathOnly = pathname.split(/[?#]/, 1)[0] || "/";
  const path = pathOnly === "/" ? "/" : pathOnly.replace(/\/+$/, "");
  const exact = ROUTE_METADATA[path];
  if (exact) return exact;
  if (path.startsWith("/admin/")) return ROUTE_METADATA["/admin"];
  return undefined;
}

export function RouteMetadata({ path }: { path: string }) {
  const metadata = resolveRouteMetadata(path);
  if (!metadata) return null;
  const canonical = `https://fayaa.tech${metadata.path}`;
  const image = `https://fayaa.tech${
    metadata.socialImage ?? "/public-banner.webp"
  }`;
  return (
    <Fragment>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="robots" content={metadata.robots} />
      {metadata.canonical !== false && (
        <link rel="canonical" href={canonical} />
      )}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={metadata.title} />
      <meta property="og:description" content={metadata.description} />
      {metadata.canonical !== false && (
        <meta property="og:url" content={canonical} />
      )}
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metadata.title} />
      <meta name="twitter:description" content={metadata.description} />
      <meta name="twitter:image" content={image} />
    </Fragment>
  );
}
