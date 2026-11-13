// Draws the 1200×630 share images (og:image) for each site and language with Playwright.
// Run by hand when a tagline or colour changes: node scripts/og-images.mjs (fonts come from node_modules).
// Output: sites/<site>/public/img/og-<lang>.png (root: og-en.png).
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const { chromium } = createRequire(import.meta.url)("playwright");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire(join(root, "sites/es/package.json"));
const font = (pkg, file) => `data:font/woff2;base64,${readFileSync(join(dirname(req.resolve(`${pkg}/package.json`)), "files", file)).toString("base64")}`;
const req2 = createRequire(join(root, "sites/ar/package.json"));
const fontAr = (file) => `data:font/woff2;base64,${readFileSync(join(dirname(req2.resolve("@fontsource/ibm-plex-sans-arabic/package.json")), "files", file)).toString("base64")}`;
const FACES = `
@font-face{font-family:'IBM Plex Sans';font-weight:100 700;src:url(${font("@fontsource-variable/ibm-plex-sans", "ibm-plex-sans-latin-wght-normal.woff2")}) format('woff2')}
@font-face{font-family:'IBM Plex Sans';font-weight:100 700;src:url(${font("@fontsource-variable/ibm-plex-sans", "ibm-plex-sans-latin-ext-wght-normal.woff2")}) format('woff2');unicode-range:U+0100-02AF,U+2212}
@font-face{font-family:'IBM Plex Sans Arabic';font-weight:400;src:url(${fontAr("ibm-plex-sans-arabic-arabic-400-normal.woff2")}) format('woff2')}
@font-face{font-family:'IBM Plex Sans Arabic';font-weight:700;src:url(${fontAr("ibm-plex-sans-arabic-arabic-700-normal.woff2")}) format('woff2')}`;
const WORD =
  "M7 21 V93 M28 51 A21 21 0 1 0 28 93 A21 21 0 1 0 28 51 M96 51 A21 21 0 1 0 96 93 A21 21 0 1 0 96 51 M117 51 V93 M143 51 V93 M183 28 V93 M169 51 H197 M244 51 A21 21 0 1 0 244 93 A21 21 0 1 0 244 51 M265 51 V93 M312 51 A21 21 0 1 0 312 93 A21 21 0 1 0 312 51 M333 51 V93 M359 51 V93 M359 72 A21 21 0 0 1 401 72 V93";
const C = {
  root: { bg: "#ECECEA", card: "#FFFFFF", text: "#17130A", muted: "#68625A", primary: "#7D5F17", tint: "#F8F1DF" },
  es: { bg: "#EDEAF3", card: "#FFFFFF", text: "#0E0B1D", muted: "#615D79", primary: "#5A3B8C", tint: "#F1EEF9" },
  pt: { bg: "#E8EDF5", card: "#FFFFFF", text: "#0B1526", muted: "#5B6579", primary: "#2F5597", tint: "#EDF2FA" },
  ar: { bg: "#EAEDE6", card: "#FFFFFF", text: "#0F1F17", muted: "#5D6656", primary: "#3E5A3F", tint: "#EDF1EA" },
};
const IMAGES = [
  { site: "root", lang: "en", host: "baitaandessigns.com", title: "Free tools that speak your language", sub: "Calculators for Mexico, Brazil and the Gulf, in Spanish, Portuguese and Arabic.",
    card: { label: "Finiquito · renuncia", value: "$7,438.36", rows: [["Aguinaldo", "$3,719.18"], ["Vacaciones", "$2,975.34"], ["Prima vacacional", "$743.84"]] } },
  { site: "es", lang: "es", host: "es.baitaandessigns.com", title: "Herramientas gratis, sin registro", sub: "Calculadoras laborales de México: finiquito, sueldo neto, aguinaldo y vacaciones.",
    card: { label: "Finiquito · renuncia a los 6 meses", value: "$7,438.36", rows: [["Aguinaldo", "$3,719.18"], ["Vacaciones", "$2,975.34"], ["Prima vacacional", "$743.84"]] } },
  { site: "es", lang: "en", host: "es.baitaandessigns.com/en", title: "Free tools for Mexico, no sign-up", sub: "Mexican labor calculators: finiquito, net pay, aguinaldo and vacation.",
    card: { label: "Finiquito · resigning after 6 months", value: "$7,438.36", rows: [["Aguinaldo", "$3,719.18"], ["Vacation", "$2,975.34"], ["Vacation premium", "$743.84"]] } },
  { site: "pt", lang: "pt", host: "pt.baitaandessigns.com", title: "Ferramentas grátis, sem cadastro", sub: "Calculadoras trabalhistas do Brasil: rescisão, salário líquido, férias e 13º.",
    card: { label: "Salário líquido · R$ 5.000", value: "R$ 4.498,49", rows: [["INSS", "−R$ 501,51"], ["IRRF", "R$ 0,00"]] } },
  { site: "pt", lang: "en", host: "pt.baitaandessigns.com/en", title: "Free tools for Brazil, no sign-up", sub: "Brazilian employment calculators: termination, net salary, vacation and 13th salary.",
    card: { label: "Net salary · R$ 5.000", value: "R$ 4.498,49", rows: [["INSS", "−R$ 501,51"], ["Income tax", "R$ 0,00"]] } },
  { site: "ar", lang: "ar", host: "ar.baitaandessigns.com", title: "أدوات مجانية دون تسجيل", sub: "التاريخ الهجري، ومكافأة نهاية الخدمة، والزكاة لدول الخليج.", rtl: true,
    card: { label: "مكافأة نهاية الخدمة · 7 سنوات", value: "36,000 ريال", rows: [["أول 5 سنوات", "20,000 ريال"], ["السنتان التاليتان", "16,000 ريال"]] } },
  { site: "ar", lang: "en", host: "ar.baitaandessigns.com/en", title: "Free tools for the Gulf, no sign-up", sub: "Hijri dates, Ramadan countdown, end-of-service, VAT and zakat.",
    card: { label: "End of service · 7 years", value: "SAR 36,000", rows: [["First 5 years", "SAR 20,000"], ["Next 2 years", "SAR 16,000"]] } },
];

const html = (i) => {
  const c = C[i.site];
  const brand = i.rtl
    ? `<div style="font:700 64px 'IBM Plex Sans Arabic';color:${c.text}">بيتان</div>`
    : `<svg viewBox="-2 8 412 96" style="height:56px;width:auto;align-self:flex-start;color:${c.text}" fill="none"><path d="${WORD}" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><circle cx="143" cy="25" r="8.5" fill="currentColor"/></svg>`;
  const rows = i.card.rows.map(([k, v]) => `<div style="display:flex;justify-content:space-between;gap:20px;padding:14px 0;border-top:1px solid #0001;font-size:22px"><span>${k}</span><bdi>${v}</bdi></div>`).join("");
  return `<!doctype html><html dir="${i.rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8">
<style>${FACES}body{margin:0}*{box-sizing:border-box}</style></head><body>
<div style="width:1200px;height:630px;background:${c.bg};display:grid;grid-template-columns:1.15fr .85fr;gap:48px;padding:64px 72px;font-family:${i.rtl ? "'IBM Plex Sans Arabic'," : ""}'IBM Plex Sans',sans-serif;color:${c.text}">
  <div style="display:flex;flex-direction:column;gap:26px">
    ${brand}
    <div style="font-size:${i.rtl ? 72 : 64}px;font-weight:${i.rtl ? 700 : 650};line-height:1.08;letter-spacing:${i.rtl ? 0 : "-0.03em"}">${i.title}</div>
    <div style="font-size:26px;line-height:1.45;color:${c.muted}">${i.sub}</div>
    <div style="margin-top:auto;display:inline-flex;align-self:flex-start;padding:12px 22px;border-radius:999px;background:${c.primary};color:#fff;font:600 22px 'IBM Plex Sans'">${i.host}</div>
  </div>
  <div style="display:flex;align-items:center">
    <div style="width:100%;background:${c.card};border-radius:28px;padding:30px;box-shadow:0 30px 60px -24px #0004;transform:rotate(${i.rtl ? 2 : -2}deg)">
      <div style="font-size:20px;color:${c.muted}">${i.card.label}</div>
      <div style="font-size:52px;font-weight:650;margin:6px 0 14px;color:${c.primary}"><bdi>${i.card.value}</bdi></div>
      ${rows}
    </div>
  </div>
</div></body></html>`;
};

const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
for (const i of IMAGES) {
  await pg.setContent(html(i), { waitUntil: "load" });
  await pg.evaluate(() => document.fonts.ready);
  const out = join(root, "sites", i.site, "public", "img", `og-${i.lang}.png`);
  await pg.screenshot({ path: out });
  console.log("wrote", out);
}
await b.close();
