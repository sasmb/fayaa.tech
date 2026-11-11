import { page, route, type Spec } from "@wasp.sh/spec";

import { TermsPage } from "./TermsPage" with { type: "ref" };
import { PrivacyPage } from "./PrivacyPage" with { type: "ref" };
import { RefundsPage } from "./RefundsPage" with { type: "ref" };

export const legalSpec: Spec = [
  route("TermsRoute", "/terms", page(TermsPage), { prerender: true }),
  route("PrivacyRoute", "/privacy", page(PrivacyPage), { prerender: true }),
  route("RefundsRoute", "/refunds", page(RefundsPage), { prerender: true }),
];

