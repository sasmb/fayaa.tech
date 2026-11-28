import { action, query, type Spec } from "@wasp.sh/spec";

import {
  deleteSiteMedia,
  getAllSiteMedia,
  getPublicSiteMedia,
  moveSiteMedia,
  upsertSiteMedia,
} from "./operations" with { type: "ref" };

export const marketingSpec: Spec = [
  query(getPublicSiteMedia, { entities: ["SiteMedia"], auth: false }),
  query(getAllSiteMedia, { entities: ["SiteMedia"] }),
  action(upsertSiteMedia, { entities: ["SiteMedia"] }),
  action(deleteSiteMedia, { entities: ["SiteMedia"] }),
  action(moveSiteMedia, { entities: ["SiteMedia"] }),
];
