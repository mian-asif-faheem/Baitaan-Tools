import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://ar.baitaandessigns.com",
  integrations: [preact(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
