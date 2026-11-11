// Fails if a language site is missing an English page or a translation key.
// Usage: node scripts/check-i18n.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SITES = { es: "es", pt: "pt", ar: "ar" };
const problems = [];

const pages = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "en" ? [] : pages(p).map((x) => join(name, x));
    return name.endsWith(".astro") ? [name] : [];
  });

const keys = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}${Array.isArray(v) ? `[${v.length}]` : ""}`],
  );

for (const [site, native] of Object.entries(SITES)) {
  const root = join("sites", site, "src");
  const pagesDir = join(root, "pages");
  const nativePages = pages(pagesDir);
  const enPages = new Set(pages(join(pagesDir, "en")));
  for (const p of nativePages) if (!enPages.has(p)) problems.push(`${site}: no English page for ${p} (expected pages/en/${p})`);
  for (const p of enPages) if (!nativePages.includes(p)) problems.push(`${site}: English page en/${p} has no ${native} original`);

  const a = new Set(keys(JSON.parse(readFileSync(join(root, "i18n", `${native}.json`), "utf8"))));
  const b = new Set(keys(JSON.parse(readFileSync(join(root, "i18n", "en.json"), "utf8"))));
  for (const k of a) if (!b.has(k)) problems.push(`${site}: en.json is missing ${k}`);
  for (const k of b) if (!a.has(k)) problems.push(`${site}: ${native}.json is missing ${k}`);

  // English pages must render in English and link to English pages.
  for (const p of enPages) {
    const src = readFileSync(join(pagesDir, "en", p), "utf8");
    if (!/<Layout[^>]*\blang="en"/.test(src)) problems.push(`${site}: en/${p} doesn't pass lang="en" to Layout`);
    for (const m of src.matchAll(/client:\w+(?![^>]*lang="en")[^>]*\/>/g))
      if (!/t=\{t\./.test(m[0])) problems.push(`${site}: en/${p} has an island without lang="en": ${m[0].slice(0, 60)}`);
    for (const m of src.matchAll(/href="(\/[^"]*)"/g))
      if (!m[1].startsWith("/en/")) problems.push(`${site}: en/${p} links to native page ${m[1]}`);
    if (/i18n\/(es|pt|ar)\.json/.test(src)) problems.push(`${site}: en/${p} imports native strings`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("i18n check passed: every page has an English version and all keys match.");
