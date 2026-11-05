# Baitaan Tools

Free, ad-supported tool sites in Spanish, Portuguese (Brazil) and Arabic, on subdomains of baitaandessigns.com. A MAAF Studios project.

| Site | Folder | Domain | Dev port |
| --- | --- | --- | --- |
| Hub (replaces the WordPress install) | `sites/root` | baitaandessigns.com | 4320 |
| Spanish | `sites/es` | es.baitaandessigns.com | 4321 |
| Portuguese (Brazil) | `sites/pt` | pt.baitaandessigns.com | 4322 |
| Arabic (right-to-left) | `sites/ar` | ar.baitaandessigns.com | 4323 |

## Stack

Astro 7 (static output) · Preact 11 islands for the tools · Tailwind CSS 4 · TypeScript · pnpm workspaces · Vitest · Cloudflare Pages.

Every tool runs in the visitor's browser. There is no server and no database.

## Layout

```
packages/
  tools/   Pure TypeScript logic shared by all sites, with tests
    src/mx/     Mexico: aguinaldo
    src/br/     Brazil: INSS, salário líquido (Lei 15.270/2025), 13º
                rates-2026.ts holds the yearly tables
    src/hijri/  Umm al-Qura Hijri <-> Gregorian, Hijri age (uses the browser's Intl calendar)
  ui/      BaseLayout (lang, dir, canonical, hreflang, AdSense), ToolPage, AdSlot, sites.ts
sites/
  root/ es/ pt/ ar/   Each: astro.config.mjs, src/i18n/<lang>.json, src/components, src/pages
```

## Commands

```bash
pnpm install
pnpm test          # calculator tests (19 so far)
pnpm dev:es        # or dev:root, dev:pt, dev:ar
pnpm build         # builds all four sites into sites/*/dist
```

## Adding a tool

1. Write the logic in `packages/tools/src/<country>/` and tests in `packages/tools/test/`, using worked examples from official sources.
2. Add UI strings to the site's `src/i18n/<lang>.json`.
3. Add a Preact component in `sites/<lang>/src/components/`.
4. Add a page in `sites/<lang>/src/pages/` using `ToolPage`, with the guide (method, 2–3 examples, FAQ) and official sources.
5. Mark it ready on the site's index page.
6. Send the page for native-speaker review before indexing.

## Deploying to Cloudflare Pages

1. Push this repo to GitHub.
2. Move baitaandessigns.com DNS to Cloudflare (remove the old WordPress records).
3. Create four Pages projects from the repo, one per site:
   - Build command: `pnpm install && pnpm --filter @bt/site-es build` (change the site name)
   - Build output directory: `sites/es/dist`
   - Environment variable: `NODE_VERSION=22`
4. Add the custom domain for each project (`baitaandessigns.com`, `es.`, `pt.`, `ar.`).
5. Verify `baitaandessigns.com` as a Domain property in Search Console and submit each site's `sitemap-index.xml`.

## Turning on ads

Ads render nothing until this is set. After AdSense approves `baitaandessigns.com`, add this environment variable to each Pages project and redeploy:

```
PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
```

Then replace each `<AdSlot slot="0000000000" />` with real ad unit IDs. Turn on Google's consent message (AdSense → Privacy & messaging) for EU and UK visitors.

## Yearly maintenance (every January)

- Brazil: update `packages/tools/src/br/rates-2026.ts` (copy to `rates-2027.ts`) from the new INSS ordinance and Receita Federal table; update the tests with new published examples.
- Mexico: check the minimum aguinaldo rules and the UMA value if ISR is added.
- Update the "last updated" line on every tool page.

## Before applying to AdSense

- [ ] Native review of all Spanish, Portuguese and Arabic copy (search for `TODO (native review)`)
- [ ] Review the privacy pages (`TODO` comments)
- [ ] Set up the `hello@`, `hola@`, `ola@` and `salam@` email addresses, or change them in the i18n files
- [ ] Brand names in `packages/ui/src/sites.ts` are placeholders: change them if you prefer others
- [ ] 25–30 solid pages per site, per the roadmap
