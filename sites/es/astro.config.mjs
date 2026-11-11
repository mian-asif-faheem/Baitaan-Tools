import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://es.baitaandessigns.com",
  integrations: [preact(), sitemap({ filter: (page) => !/\/404\/?$/.test(page) })],
  vite: { plugins: [tailwindcss()] },
});
