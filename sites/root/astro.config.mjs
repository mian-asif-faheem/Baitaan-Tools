import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://baitaandessigns.com",
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
