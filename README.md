# Baitaan Tools

Free, ad-supported tool sites in Spanish, Portuguese (Brazil) and Arabic, on subdomains of baitaandessigns.com. A MAAF Studios project.

| Site | Folder | Domain | Dev port |
| --- | --- | --- | --- |
| Hub (replaces the WordPress install) | `sites/root` | baitaandessigns.com | 4320 |
| Spanish | `sites/es` | es.baitaandessigns.com | 4321 |
| Portuguese (Brazil) | `sites/pt` | pt.baitaandessigns.com | 4322 |
| Arabic (right-to-left) | `sites/ar` | ar.baitaandessigns.com | 4323 |

## Stack

Astro 7 (static output) · Preact 11 islands for the tools · Tailwind CSS 4 · TypeScript · pnpm workspaces · Vitest · GitHub Actions → cPanel (FTPS).

Every tool runs in the visitor's browser. There is no server and no database.

## Layout

```
packages/
  tools/   Pure TypeScript logic shared by all sites, with tests
    src/mx/     Mexico: aguinaldo, finiquito/liquidación, sueldo neto (ISR + subsidio + IMSS), vacaciones
                rates-2026.ts holds ISR tarifa, UMA, minimum wage, subsidio, IMSS rates
    src/br/     Brazil: INSS + IRRF with the Lei 15.270/2025 reduction (core.ts), salário líquido,
                rescisão (4 types), férias, 13º, horas extras + adicional noturno, salário proporcional
                rates-2026.ts holds the yearly tables
    src/hijri/  Umm al-Qura Hijri <-> Gregorian, Hijri age (uses the browser's Intl calendar);
                dates.ts: date difference, Gulf working days, next Ramadan/Eid (countdowns)
    src/gulf/   End-of-service: Saudi Arabia (arts. 84-87) and UAE (art. 51); GCC VAT; zakat
    src/text/   Word/character counts that handle Arabic diacritics
  ui/      BaseLayout (lang, dir, canonical, hreflang, AdSense), ToolPage, AdSlot, sites.ts
    src/tools/  Shared browser tools with translatable strings: PhotoTool (document photos + print
                sheets at 300 dpi), PdfCompressTool (pdf.js + pdf-lib, loaded only when used),
                MergePdfTool (PDFs + JPG/PNG, reorderable); form.tsx shared form controls
sites/
  root/ es/ pt/ ar/   Each: astro.config.mjs, src/i18n/<lang>.json, src/components, src/pages
```

## Commands

```bash
pnpm install
pnpm test          # calculator tests (95 so far)
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

## Deploying (cPanel, automatic)

Every push to `main` runs `.github/workflows/deploy.yml`: install, test, build all four sites, then upload each one over FTPS. Only changed files are uploaded; a `.ftp-deploy-sync-state.json` file in each folder tracks what is on the server (the `.htaccess` hides it from visitors).

### One-time setup

1. **cPanel → Domains:** create `es.baitaandessigns.com`, `pt.baitaandessigns.com` and `ar.baitaandessigns.com`. Note each one's document root.
2. **Back up and remove WordPress** from `public_html` (files and database). The `.htaccess` already serves `index.html` before `index.php`, but old files would stay public.
3. **cPanel → FTP Accounts:** create e.g. `deploy@baitaandessigns.com` with its directory set to your home folder (clear the suggested `public_html/deploy` path), so it can reach all four document roots.
4. **GitHub → Settings → Secrets and variables → Actions:**
   - Secrets: `FTP_SERVER` (FTP server name shown in cPanel's FTP Accounts → Configure FTP Client), `FTP_USERNAME`, `FTP_PASSWORD`.
   - Variables, only if your folders differ from the defaults: `FTP_DIR_ROOT` (`public_html/`), `FTP_DIR_ES` (`es.baitaandessigns.com/`), `FTP_DIR_PT`, `FTP_DIR_AR`. Paths are relative to the FTP account's home folder and must end in `/`. If cPanel put a subdomain under `public_html`, use e.g. `public_html/es.baitaandessigns.com/`.
5. **GitHub → Actions → Deploy to cPanel → Run workflow** for the first deploy.
6. **cPanel → SSL/TLS Status → Run AutoSSL** so all four domains get certificates.
7. **Search Console:** verify `baitaandessigns.com` as a Domain property (DNS TXT record) and submit each site's `sitemap-index.xml`.

If FTPS fails with a certificate error, use the server's own hostname as `FTP_SERVER`, or set the variable `FTP_SECURITY` to `loose`. If the host has no FTPS, set `FTP_PROTOCOL` to `ftp`.

### Server rules

Each site has the same `public/.htaccess` (keep the four copies identical): HTTPS and www redirects, `index.html` before `index.php`, the 404 page, the `.mjs` type for the PDF worker, compression, security headers, one-year caching for hashed assets, and blocked dotfiles. Tested on Apache 2.4.

## Turning on ads

Ads render nothing until this is set. After AdSense approves `baitaandessigns.com`, add a **repository variable** `PUBLIC_ADSENSE_CLIENT` = `ca-pub-XXXXXXXXXXXXXXXX` in GitHub and re-run the workflow.

Then replace each `<AdSlot slot="0000000000" />` with real ad unit IDs. Turn on Google's consent message (AdSense → Privacy & messaging) for EU and UK visitors.

## Yearly maintenance (every January)

- Brazil: update `packages/tools/src/br/rates-2026.ts` (copy to `rates-2027.ts`) from the new INSS ordinance and Receita Federal table; update the tests with new published examples.
- Mexico: update `packages/tools/src/mx/rates-2026.ts`: ISR tarifa (Anexo 8 RMF), minimum wage (CONASAMI, 1 January), UMA (INEGI, 1 February), subsidio para el empleo decree. Re-run the tests against new published examples.
- Gulf: check VAT rates and any change to end-of-service rules. Countdown pages roll over to the next Hijri year by themselves, but the page titles are set at build time, so rebuild after each Ramadan and Eid.
- Update the "last updated" line on every tool page.

## Before applying to AdSense

- [ ] Native review of all Spanish, Portuguese and Arabic copy (search for `TODO (native review)`)
- [ ] Review the privacy pages (`TODO` comments)
- [ ] Set up the `hello@`, `hola@`, `ola@` and `salam@` email addresses, or change them in the i18n files
- [ ] Brand names in `packages/ui/src/sites.ts` are placeholders: change them if you prefer others
- [ ] 25–30 solid pages per site, per the roadmap
