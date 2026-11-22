import { describe, expect, it } from "vitest";
import { buildPricingOfferCatalog } from "./pricingSchema";

describe("pricing schema", () => {
  it("produces paid Stripe plan and credit offers with canonical pricing URL", () => {
    const catalog = buildPricingOfferCatalog([
      {
        name: "FAYAA Plus",
        price: 39,
        priceCurrency: "USD",
        billingDuration: "P1M",
      },
      { name: "Starter Credits", price: 12, priceCurrency: "USD" },
    ]);
    expect(catalog.url).toBe("https://fayaa.tech/pricing");
    expect(catalog.itemListElement).toHaveLength(2);
    expect(catalog.itemListElement[0]?.price).toBe(39);
    expect(
      (
        catalog.itemListElement[0] as {
          priceSpecification?: { billingDuration: string };
        }
      ).priceSpecification?.billingDuration,
    ).toBe("P1M");
    expect(catalog.itemListElement[1]?.price).toBe(12);
    expect(catalog.itemListElement.every((offer) => offer.price > 0)).toBe(
      true,
    );
    expect(catalog.description).toContain("Stripe");
  });
});
