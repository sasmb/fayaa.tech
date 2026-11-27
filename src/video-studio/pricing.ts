/**
 * One place for how provider cost turns into user credits. Shared by the client and server.
 *
 * Credits are bought at 30 per $1 (the pack prices). Renders are charged at the
 * provider's cost times PRICE_MARKUP, so every render keeps a margin over what
 * Higgsfield or MuAPI bills.
 */

/** Credits per $1 of provider cost before the markup. Matches the credit pack prices. */
export const CREDITS_PER_USD = 30;
/** Charge users 1.5x the provider cost. */
export const PRICE_MARKUP = 1.5;
/** Smallest charge for any render. */
export const MIN_RENDER_CREDITS = 2;

/** Credits to charge for a render that costs `usd` at the provider. */
export function usdToCredits(usd: number): number {
  const safe = Number.isFinite(usd) && usd > 0 ? usd : 0;
  // Round to cents first so float noise (e.g. 11.250000001) doesn't add a credit.
  const credits = Number((safe * CREDITS_PER_USD * PRICE_MARKUP).toFixed(4));
  return Math.max(MIN_RENDER_CREDITS, Math.ceil(credits));
}

/** Provider cost in cents behind a credit charge (the inverse of usdToCredits, minus rounding). */
export function creditsToProviderCents(credits: number): number {
  return Math.round((credits / (CREDITS_PER_USD * PRICE_MARKUP)) * 100);
}
