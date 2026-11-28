import { action, api, query, type Spec } from "@wasp.sh/spec";

import {
  deleteSiteMedia,
  getAllSiteMedia,
  getPublicSiteMedia,
  moveSiteMedia,
  upsertSiteMedia,
} from "./operations" with { type: "ref" };
import { getPublicSiteMediaApi } from "./publicApi" with { type: "ref" };

export const marketingSpec: Spec = [
  query(getPublicSiteMedia, { entities: ["SiteMedia"], auth: false }),
  // Read at build time by the static marketing site in site/.
  api("GET", "/api/public/site-media", getPublicSiteMediaApi, { entities: ["SiteMedia"], auth: false }),
  query(getAllSiteMedia, { entities: ["SiteMedia"] }),
  action(upsertSiteMedia, { entities: ["SiteMedia"] }),
  action(deleteSiteMedia, { entities: ["SiteMedia"] }),
  action(moveSiteMedia, { entities: ["SiteMedia"] }),
];
