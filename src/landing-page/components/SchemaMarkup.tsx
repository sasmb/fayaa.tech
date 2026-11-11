// JSON-LD structured data for SEO. Helps search engines and LLMs understand
// your app so it can appear in rich results and AI answers. Customize the
// placeholders below to match your product. See https://schema.org for types.
const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://fayaa.tech/#software",
      name: "FAYAA",
      description:
        "AI motion-transfer, object-swap, and video restyle studio powered by Higgsfield Genjutsu Light & Pro.",
      url: "https://fayaa.tech",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Cross-platform",
      image: "https://fayaa.tech/public-banner.webp",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://fayaa.tech/#website",
      url: "https://fayaa.tech",
      name: "FAYAA — Genjutsu AI Motion Transfer & Video Restyle Studio",
      description:
        "Transfer choreography and camera motion from any reference video into your characters, swap objects, or apply Restyle presets in one click.",
    },
  ],
};

export function SchemaMarkup() {
  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}
