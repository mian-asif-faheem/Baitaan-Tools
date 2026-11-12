export const ROOT_DOMAIN = "baitaandessigns.com";

export const SITES = {
  root: { url: `https://${ROOT_DOMAIN}`, lang: "en", dir: "ltr", name: "Baitaan" },
  es: { url: `https://es.${ROOT_DOMAIN}`, lang: "es", dir: "ltr", name: "Baitaan" },
  pt: { url: `https://pt.${ROOT_DOMAIN}`, lang: "pt-BR", dir: "ltr", name: "Baitaan" },
  ar: { url: `https://ar.${ROOT_DOMAIN}`, lang: "ar", dir: "rtl", name: "بيتان" },
} as const;

export type SiteKey = keyof typeof SITES;
