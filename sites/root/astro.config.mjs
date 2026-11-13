import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import { lastmod } from "../../scripts/lastmod.mjs";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://baitaandessigns.com",
  integrations: [preact(), sitemap({
      filter: (page) => !/\/404\/?$/.test(page),
      serialize: (item) => ({ ...item, lastmod: lastmod("root", item.url) }),
    })],
  vite: { plugins: [tailwindcss()] },
});
