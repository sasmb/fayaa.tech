import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { wasp } from "wasp/client/vite";
import { removeWaspFallbackTitle } from "./src/client/seoHtml.ts";

export default defineConfig({
  plugins: [
    wasp(),
    tailwindcss(),
    {
      name: "fayaa-route-title",
      enforce: "post",
      generateBundle(_options, bundle) {
        for (const output of Object.values(bundle)) {
          if (
            output.type === "asset" &&
            output.fileName.endsWith(".html") &&
            typeof output.source === "string"
          ) {
            output.source = removeWaspFallbackTitle(
              output.source,
              "FAYAA — The All-in-One Content Creation Studio",
            );
          }
        }
      },
    },
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@base-ui/react",
      "@tanstack/react-virtual",
      "zustand",
    ],
  },
  server: {
    open: true,
  },
});
