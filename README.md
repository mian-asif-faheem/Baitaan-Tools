# Baitaan

Free, ad-supported tool sites in Spanish, Portuguese (Brazil) and Arabic, on subdomains of baitaandessigns.com. A MAAF Studios project.

| Site | Folder | Domain | Dev port |
| --- | --- | --- | --- |
| Hub | `sites/root` | baitaandessigns.com | 4320 |
| Spanish | `sites/es` | es.baitaandessigns.com | 4321 |
| Portuguese (Brazil) | `sites/pt` | pt.baitaandessigns.com | 4322 |
| Arabic (right-to-left) | `sites/ar` | ar.baitaandessigns.com | 4323 |

## Stack

Astro 7 (static output) · Preact 11 islands for the tools · Tailwind CSS 4 · TypeScript · pnpm workspaces · Vitest · GitHub Actions → cPanel (FTPS).

Every tool runs in the visitor's browser. There is no server and no database.

## Languages, theme and cookies

- **English on every language site.** Each page of `es.`, `pt.` and `ar.` has an English twin at `/en/<same slug>/` (English pages on `ar.` are left-to-right). The native language is the default; the language button in the header switches between the two versions of the same page and saves the choice in the `bt_lang` cookie, so returning visitors land on their language. Search engines see both versions linked with `hreflang`. 404 pages never redirect.
- **Light and dark theme.** The first visit follows the browser/OS setting; the sun/moon button overrides it and saves `bt_theme`.
- **Cookie consent.** A banner asks once (Accept all / Reject / Customise) and stores `bt_consent` for 6 months. Google Consent Mode v2 starts as denied, so Analytics and AdSense store nothing until the visitor accepts. "Cookie settings" in every footer reopens it.
- `bt_theme` and `bt_consent` are set on `.baitaandessigns.com`, so they carry across the hub and the subdomains. `bt_lang` is per subdomain: English on `es.` doesn't switch `pt.` or `ar.` to English.
- The shell lives in `packages/ui/src/BaseLayout.astro` and `ConsentBanner.astro`; dark colours are in `packages/ui/src/theme.css`.

## Design system

The look comes from the Claude Design boards (design system, home pages, calculators, utility screens).

- **Tokens:** `scripts/palettes.py` writes each site's `src/palette.css`: the design's semantic tokens (`--bg`, `--card`, `--text`, `--muted`, `--border`, `--hair`, `--primary`, `--on-primary`, `--link`, `--result-bg`, `--band`, `--elev`…) for light (`:root`) and dark (`html.dark`), plus a WCAG AA contrast check. Tailwind gets them as `bg-card`, `text-muted`, `border-hair`, `shadow-elev`… (`packages/ui/src/design.css`).
- **Components** (`packages/ui/src/`): `BaseLayout` (floating sticky header bar with the tool menu), `Footer` (card with brand, tool/site/language columns and the dotted wordmark, after the reactbits.dev footer), `ToolPage` (breadcrumb, trust chips, guide, sources card), `form.tsx` (inputs, segmented toggle or radio cards, checkbox, result card with breakdown rows, notes), `Hero` + `ToolGrid` (home hero and bento grid), `NotFound`, `ConsentBanner`, the PDF/photo tools, and `design.css` for all of their styles.
- **Icons:** Phosphor (MIT) as inline SVG paths in `icons.ts`; `Icon.astro` for pages, `fx/Svg.tsx` for islands.
- **Fonts:** IBM Plex Sans (variable, for the 650 weight) with its partner IBM Plex Sans Arabic, so all four sites share one family.
- **FAQ:** write entries in a guide as `<details class="bt-faq"><summary>Question</summary><p>Answer</p></details>` right after an `<h2>`. `ToolPage` turns the heading and its entries into the FAQ block (layout after React Bits Pro "FAQ 5", rebuilt in this project's own styles): centred heading, a "write to us" line linking to the site's contact address, and question cards. Links inside answers show as small pills.
- **Slop checks:** [impeccable](https://github.com/pbakaus/impeccable) is the design reviewer. Its rules this project follows: no floating glow haze or eyebrow labels above headings, no cards nested in cards, elevation declared once (hairline border, shadow only on hover), card radii 12–16px with pills only for small controls, reading width about 75 characters (`60ch`, `50ch` for Arabic), more space above headings than below, fixed type sizes on tool pages, motion only for state changes, and the browser's own surfaces (caret, selection, scrollbars, placeholders) themed from the palette.
- **Motion:** one easing (`cubic-bezier(.2,.7,.2,1)`): home headings sharpen in word by word (the one authored moment), cards lift with a cursor spotlight (ported from [React Bits](https://github.com/DavidHDev/react-bits) SpotlightCard; MIT + Commons Clause, so it can be used on these sites but not resold on its own, so keep the header in `fx/spotlight.ts`), result and countdown digits roll to each new value like an odometer (`fx/Counter.tsx`, ported from React Bits Counter), the menu and toggle highlight stretches to the new choice and squashes into place (`fx/rubber.ts`, ported from React Bits Rubber Segment; in the menu the page changes as it lands). Everything is instant under "reduce motion". Nothing animates near ad slots or inside fields.

## Outside resources

[RESOURCES.md](RESOURCES.md) lists the outside repositories this project uses or takes ideas from, with a short note on each.

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
  ui/      BaseLayout (lang, dir, canonical, hreflang, theme, language switch, consent, AdSense),
           ConsentBanner, design.css (design system), ToolPage, ToolGrid, Hero, NotFound, AdSlot, icons, sites.ts
    src/tools/  Shared browser tools with translatable strings: PhotoTool (document photos + print
                sheets at 300 dpi), PdfCompressTool (pdf.js + pdf-lib, loaded only when used),
                MergePdfTool (PDFs + JPG/PNG, reorderable); form.tsx shared form controls
sites/
  root/ es/ pt/ ar/   Each: astro.config.mjs, src/i18n/<lang>.json + en.json, src/components,
                      src/pages (native) and src/pages/en (English)
scripts/check-i18n.mjs  Fails if a page has no English twin or the two string files differ
```

## Commands

```bash
pnpm install
pnpm test          # calculator tests (95 so far)
pnpm check:i18n    # every page has an English version, all strings translated
pnpm check:design  # impeccable's design-slop detector on all source (also runs on deploy)
                   # rendered pages too: npx impeccable detect http://localhost:4321/
pnpm dev:es        # or dev:root, dev:pt, dev:ar
pnpm build         # builds all four sites into sites/*/dist
```

## Adding a tool

1. Write the logic in `packages/tools/src/<country>/` and tests in `packages/tools/test/`, using worked examples from official sources.
2. Add UI strings to the site's `src/i18n/<lang>.json` and the same keys in English to `src/i18n/en.json`.
3. Add a Preact component in `sites/<lang>/src/components/` that takes a `lang` prop and reads strings with `getT(lang)`.
4. Add a page in `sites/<lang>/src/pages/` using `ToolPage`, with the guide (method, 2–3 examples, FAQ) and official sources, and its English twin with the same file name in `src/pages/en/` (`<Layout lang="en">`, `<Tool lang="en" />`, links to `/en/...`). `pnpm check:i18n` (also run on every deploy) catches anything missed.
5. Mark it ready on the site's index page.
6. Send the page for native-speaker review before indexing.

## Deploying (cPanel, automatic)

Every push to `main` runs `.github/workflows/deploy.yml`: install, test, build all four sites, then upload each one over FTPS. Only changed files are uploaded; a `.ftp-deploy-sync-state.json` file in each folder tracks what is on the server (the `.htaccess` hides it from visitors).

### One-time setup (Hostlico cPanel, shared with maafstudios.com)

`public_html` belongs to maafstudios.com. Baitaan's four sites live in their own folders next to it, and the deploy account can only see those folders:

```
/home/<cpanel-user>/
  public_html/        maafstudios.com (never touched)
  baitaan/
    root/             baitaandessigns.com
    es/               es.baitaandessigns.com
    pt/               pt.baitaandessigns.com
    ar/               ar.baitaandessigns.com
```

1. **Point the domain at Hostlico.** At the registrar of baitaandessigns.com, set the nameservers from your Hostlico welcome email. Or keep your current DNS and point A records for `@`, `www`, `es`, `pt` and `ar` to the server IP shown in cPanel.
2. **cPanel → Domains → Create a New Domain:** `baitaandessigns.com`, untick "Share document root", document root `baitaan/root`.
3. **Create a New Domain** three more times: `es.baitaandessigns.com` → `baitaan/es`, `pt.baitaandessigns.com` → `baitaan/pt`, `ar.baitaandessigns.com` → `baitaan/ar`.
4. **cPanel → FTP Accounts:** create `deploy@baitaandessigns.com` with directory `baitaan`. It can then reach only these four folders.
5. **GitHub → Settings → Secrets and variables → Actions:**
   - Secrets: `FTP_SERVER` (from FTP Accounts → Configure FTP Client), `FTP_USERNAME` (`deploy@baitaandessigns.com`), `FTP_PASSWORD`.
   - Variables: `FTP_DIR_ROOT` = `root/`, `FTP_DIR_ES` = `es/`, `FTP_DIR_PT` = `pt/`, `FTP_DIR_AR` = `ar/`.
6. **GitHub → Actions → Deploy to cPanel → Run workflow.**
7. **cPanel → SSL/TLS Status → Run AutoSSL** once DNS points to the server.
8. **Search Console:** verify `baitaandessigns.com` as a Domain property (DNS TXT record) and submit each site's `sitemap-index.xml`.

The workflow uploads nothing until all four folder variables are set, and it refuses `public_html/` so maafstudios.com cannot be overwritten. If FTPS fails with a certificate error, use the server's own hostname as `FTP_SERVER`, or set the variable `FTP_SECURITY` to `loose`. If the host has no FTPS, set `FTP_PROTOCOL` to `ftp`.

### Server rules

Each site has the same `public/.htaccess` (keep the four copies identical): HTTPS and www redirects, `index.html` before `index.php`, the 404 page, the `.mjs` type for the PDF worker, compression, security headers, one-year caching for hashed assets, and blocked dotfiles. Tested on Apache 2.4.

## Turning on ads

Ads render nothing until this is set. After AdSense approves `baitaandessigns.com`, add a **repository variable** `PUBLIC_ADSENSE_CLIENT` = `ca-pub-XXXXXXXXXXXXXXXX` in GitHub and re-run the workflow.

Then replace each `unit="0000000000"` with real ad unit IDs: `ToolPage.astro` (below every tool), `ToolGrid.astro` (between the groups on home pages) and the `<AdSlot unit=…>` in each page's guide. Turn on Google's consent message (AdSense → Privacy & messaging) for EU and UK visitors.

**Ad places are visible now:** until `PUBLIC_ADSENSE_CLIENT` is set, every ad place shows a grey dashed box of the size the ad will take, so the design can be judged on the live sites. When the AdSense client is set, real units replace them automatically. To hide the boxes earlier, add the repository variable `PUBLIC_AD_PLACEHOLDERS` = `off` and re-run the workflow.

Note: the prop is `unit`, not `slot`. In Astro, `slot="…"` moves an element into a parent's named slot, which silently dropped ads placed inside guides.

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
