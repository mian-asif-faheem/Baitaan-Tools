import pt from "./pt.json";
import en from "./en.json";

export const NATIVE = "pt" as const;
export type Lang = typeof NATIVE | "en";

export const dict = { pt, en };
export const getT = (lang: Lang = NATIVE) => dict[lang];

/** Locale for numbers, dates and currency. */
export const locale = (lang: Lang) => (lang === "en" ? "en-US" : "pt-BR");

/** Language versions of the current page, for the switcher and hreflang. */
export function versionsFor(pathname: string) {
  const native = pathname === "/en" || pathname === "/en/" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
  return [
    { code: NATIVE, hreflang: "pt-BR", href: native, label: "Português" },
    { code: "en", hreflang: "en", href: native === "/" ? "/en/" : `/en${native}`, label: "English" },
  ];
}
