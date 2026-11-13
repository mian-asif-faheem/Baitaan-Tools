// IndexNow: tells Bing (and the engines that share its index) which pages changed, on every deploy.
// Google does not use IndexNow; it reads the sitemaps.
//
//   node scripts/indexnow.mjs manifest   after the build: writes dist/indexnow-pages.json per site,
//                                        a hash of each page's content (asset file names ignored)
//   node scripts/indexnow.mjs prepare    before upload: compares with the live manifest and saves
//                                        the changed URLs (all of them if the live one is missing)
//   node scripts/indexnow.mjs send       after upload: submits the changed URLs per host
//
// The key is public by design: the same value is served at /<key>.txt on every site.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const KEY = "fb6f8d0ce2522ae55e6f71176488fa6e";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOSTS = { root: "baitaandessigns.com", es: "es.baitaandessigns.com", pt: "pt.baitaandessigns.com", ar: "ar.baitaandessigns.com" };
const STATE = join(process.env.RUNNER_TEMP ?? root, "indexnow-changed.json");
const UA = "Mozilla/5.0 (compatible; BaitaanDeploy/1.0; +https://baitaandessigns.com/)";

const pages = (dir) => {
  const out = [];
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) { if (f !== "_astro" && f !== "api") walk(p); }
      else if (f === "index.html" && !/\/404\/?$/.test(d)) out.push(p);
    }
  };
  walk(dir);
  return out;
};
const hash = (html) =>
  createHash("sha256").update(html.replace(/\/_astro\/[^"' )]+/g, "")).digest("hex").slice(0, 16);

const mode = process.argv[2];
if (mode === "manifest") {
  for (const [site, host] of Object.entries(HOSTS)) {
    const dist = join(root, "sites", site, "dist");
    if (!existsSync(dist)) continue;
    const m = {};
    for (const f of pages(dist)) {
      const path = "/" + relative(dist, dirname(f)).split("\\").join("/");
      m[`https://${host}${path === "/" ? "/" : path + "/"}`] = hash(readFileSync(f, "utf8"));
    }
    writeFileSync(join(dist, "indexnow-pages.json"), JSON.stringify(m));
    console.log(`indexnow manifest: ${Object.keys(m).length} pages for ${site}`);
  }
} else if (mode === "prepare") {
  const changed = {};
  for (const [site, host] of Object.entries(HOSTS)) {
    const now = JSON.parse(readFileSync(join(root, "sites", site, "dist", "indexnow-pages.json"), "utf8"));
    let live = {};
    try {
      const r = await fetch(`https://${host}/indexnow-pages.json`, { headers: { "user-agent": UA } });
      if (r.ok) live = await r.json();
      else console.log(`${host}: no live manifest (${r.status}), submitting every page`);
    } catch (e) {
      console.log(`${host}: could not read the live manifest, submitting every page`);
    }
    changed[host] = Object.keys(now).filter((u) => live[u] !== now[u]);
    console.log(`${host}: ${changed[host].length} changed of ${Object.keys(now).length}`);
  }
  writeFileSync(STATE, JSON.stringify(changed));
} else if (mode === "send") {
  if (!existsSync(STATE)) process.exit(0);
  const changed = JSON.parse(readFileSync(STATE, "utf8"));
  for (const [host, urlList] of Object.entries(changed)) {
    if (!urlList.length) continue;
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: KEY, keyLocation: `https://${host}/${KEY}.txt`, urlList }),
    });
    // 200/202 = accepted. A failure here never fails the deploy.
    console.log(`IndexNow ${host}: ${urlList.length} URLs → ${r.status}`);
  }
} else {
  console.error("usage: indexnow.mjs manifest|prepare|send");
  process.exit(1);
}
