export const ROOT_DOMAIN = "baitaandessigns.com";

export const SITES = {
  root: { url: `https://${ROOT_DOMAIN}`, lang: "en", dir: "ltr", name: "Baitaan" },
  es: { url: `https://es.${ROOT_DOMAIN}`, lang: "es", dir: "ltr", name: "Baitaan" },
  pt: { url: `https://pt.${ROOT_DOMAIN}`, lang: "pt-BR", dir: "ltr", name: "Baitaan" },
  ar: { url: `https://ar.${ROOT_DOMAIN}`, lang: "ar", dir: "rtl", name: "بيتان" },
} as const;

export type SiteKey = keyof typeof SITES;

/**
 * Pages that do the same job on more than one site, by their native path on each site. They list
 * each other in hreflang (with each subdomain's English twin under /en/), so Google can show a
 * Mexican, a Brazilian or a Gulf visitor the version in their language. Country-specific
 * calculators (finiquito, rescisão, end of service…) follow different laws and are not listed.
 */
export const CLUSTERS: Partial<Record<SiteKey, string>>[] = [
  { root: "/", es: "/", pt: "/", ar: "/" },
  { es: "/comprimir-pdf/", pt: "/comprimir-pdf/", ar: "/dagt-pdf/" },
  { pt: "/juntar-pdf/", ar: "/damj-pdf/" },
];

/** hreflang of each subdomain's English twin: English for people in that country. */
export const EN_REGION: Partial<Record<SiteKey, string>> = { es: "en-MX", pt: "en-BR", ar: "en-SA" };
