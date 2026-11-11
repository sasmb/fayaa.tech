import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { wasp } from "wasp/client/vite";

export default defineConfig({
  plugins: [wasp(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@base-ui/react", "@tanstack/react-virtual", "zustand"],
  },
  server: {
    open: true,
  },
});
