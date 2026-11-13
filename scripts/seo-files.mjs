// Writes the crawl files into every site's build output (runs after `astro build`):
// - robots.txt: allow everything except the form endpoint, and name the sitemap.
// - sitemap.xml: the same index as sitemap-index.xml, at the address crawlers try first.
// - ads.txt: only when PUBLIC_ADSENSE_CLIENT (ca-pub-…) is set, Google's one line for this publisher.
import { copyFileSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOSTS = {
  root: "https://baitaandessigns.com",
  es: "https://es.baitaandessigns.com",
  pt: "https://pt.baitaandessigns.com",
  ar: "https://ar.baitaandessigns.com",
};
const client = (process.env.PUBLIC_ADSENSE_CLIENT ?? "").trim();
const pub = /^ca-pub-\d{10,}$/.test(client) ? client.slice(3) : "";
if (client && !pub) console.warn(`PUBLIC_ADSENSE_CLIENT "${client}" is not ca-pub-<digits>: ads.txt not written`);

for (const [site, host] of Object.entries(HOSTS)) {
  const dist = join(root, "sites", site, "dist");
  if (!existsSync(dist)) continue;
  writeFileSync(
    join(dist, "robots.txt"),
    `# ${host}\nUser-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${host}/sitemap-index.xml\n`,
  );
  if (existsSync(join(dist, "sitemap-index.xml"))) copyFileSync(join(dist, "sitemap-index.xml"), join(dist, "sitemap.xml"));
  const ads = join(dist, "ads.txt");
  if (pub) writeFileSync(ads, `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
  else if (existsSync(ads)) rmSync(ads);
  console.log(`crawl files written for ${site}${pub ? " (with ads.txt)" : ""}`);
}
