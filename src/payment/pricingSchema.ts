export interface PricingOffer {
  name: string;
  price: number;
  priceCurrency: string;
  billingDuration?: string;
}

export function buildPricingOfferCatalog(offers: PricingOffer[]) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "FAYAA Plans and Credits",
    description:
      "FAYAA subscriptions and credit packs are available through Stripe checkout.",
    url: "https://fayaa.tech/pricing",
    itemListElement: offers.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      url: "https://fayaa.tech/pricing",
      price: offer.price,
      priceCurrency: offer.priceCurrency,
      availability: "https://schema.org/InStock",
      ...(offer.billingDuration
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: offer.price,
              priceCurrency: offer.priceCurrency,
              billingDuration: offer.billingDuration,
            },
          }
        : {}),
      seller: { "@type": "Organization", name: "FAYAA" },
    })),
  };
}
