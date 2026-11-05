export const ROOT_DOMAIN = "baitaandessigns.com";

export const SITES = {
  root: { url: `https://${ROOT_DOMAIN}`, lang: "en", dir: "ltr", name: "Baitaan Tools" },
  es: { url: `https://es.${ROOT_DOMAIN}`, lang: "es", dir: "ltr", name: "Baitaan Herramientas" },
  pt: { url: `https://pt.${ROOT_DOMAIN}`, lang: "pt-BR", dir: "ltr", name: "Baitaan Ferramentas" },
  ar: { url: `https://ar.${ROOT_DOMAIN}`, lang: "ar", dir: "rtl", name: "أدوات بيتان" },
} as const;

export type SiteKey = keyof typeof SITES;
