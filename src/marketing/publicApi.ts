import type { Request, Response } from "express";

import type { SiteMediaItem } from "./siteMedia";

type SiteMediaDelegate = {
  findMany: (args: unknown) => Promise<SiteMediaItem[]>;
};

/**
 * GET /api/public/site-media
 *
 * Enabled, owner-managed homepage media for the static marketing site
 * (site/), which reads it at build time. Public data only, so any origin
 * may read it; short CDN-friendly caching.
 */
export const getPublicSiteMediaApi = async (
  _request: Request,
  response: Response,
  context: { entities: { SiteMedia: SiteMediaDelegate } }
): Promise<void> => {
  const items = await context.entities.SiteMedia.findMany({
    where: { enabled: true },
    orderBy: [{ slot: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slot: true,
      title: true,
      tag: true,
      videoUrl: true,
      posterUrl: true,
      aspect: true,
      sortOrder: true,
      enabled: true,
      creditName: true,
      sourceUrl: true,
      platform: true,
    },
  });
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Cache-Control", "public, max-age=60, stale-while-revalidate=600");
  response.json({ items });
};
