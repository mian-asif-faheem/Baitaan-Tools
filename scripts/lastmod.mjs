// Last-modified dates for the sitemaps, from git: the newest commit that touched the page, the
// components it imports, or the calculation package they use (packages/tools/src/<country>).
// So a yearly table update moves the date on exactly the calculators that use those tables.
// Needs the full git history in CI (actions/checkout with fetch-depth: 0).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const cache = new Map();
const isFile = (f) => existsSync(f) && statSync(f).isFile();

const gitDate = (paths) => {
  const key = paths.join("|");
  if (!cache.has(key)) {
    let out = "";
    try {
      out = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...paths], { cwd: repo, encoding: "utf8" }).trim();
    } catch {}
    cache.set(key, out || undefined);
  }
  return cache.get(key);
};

/** Files a page depends on: itself, its local components, and the calculation code they import. */
function deps(file, seen = new Set()) {
  if (seen.has(file) || !isFile(file)) return seen;
  seen.add(file);
  const src = readFileSync(file, "utf8");
  for (const [, spec] of src.matchAll(/from\s+["']([^"']+)["']/g)) {
    if (spec.startsWith(".")) {
      const base = resolve(dirname(file), spec);
      for (const f of [base, `${base}.ts`, `${base}.tsx`, `${base}.astro`]) if (isFile(f) && !f.endsWith("Layout.astro")) deps(f, seen);
    } else if (spec.startsWith("@bt/tools/")) {
      const dir = spec.slice(10).replace("hijri-dates", "hijri");
      seen.add(join(repo, "packages/tools/src", dir));
    }
  }
  return seen;
}

/** ISO date for a sitemap URL of `site` (root, es, pt, ar), or undefined if unknown. */
export function lastmod(site, url) {
  const path = new URL(url).pathname.replace(/^\/|\/$/g, "");
  const pages = join(repo, "sites", site, "src", "pages");
  const file = [join(pages, `${path || "index"}.astro`), join(pages, path, "index.astro")].find(isFile);
  if (!file) return undefined;
  return gitDate([...deps(file)].map((f) => f.replace(`${repo}/`, "")));
}
