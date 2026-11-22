// JSON-LD structured data for SEO. Helps search engines and LLMs understand
// your app so it can appear in rich results and AI answers. Customize the
// placeholders below to match your product. See https://schema.org for types.
export const homepageSchema = {
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
    },
    {
      "@type": "WebSite",
      "@id": "https://fayaa.tech/#website",
      url: "https://fayaa.tech",
      name: "FAYAA AI Video Studio",
      description:
        "Create AI videos with motion transfer, character and object swaps, and video restyle powered by Higgsfield Genjutsu.",
    },
  ],
};

export function SchemaMarkup() {
  return (
    <script type="application/ld+json">{JSON.stringify(homepageSchema)}</script>
  );
}
