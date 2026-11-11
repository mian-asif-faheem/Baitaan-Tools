import ar from "./ar.json";
import en from "./en.json";

export const NATIVE = "ar" as const;
export type Lang = typeof NATIVE | "en";

export const dict = { ar, en };
export const getT = (lang: Lang = NATIVE) => dict[lang];

/** Western digits are the norm on Gulf websites and avoid ambiguity in forms. */
export const locale = (lang: Lang) => (lang === "en" ? "en-US" : "ar-SA-u-nu-latn");
export const dirOf = (lang: Lang) => (lang === "en" ? "ltr" : "rtl");

/** Language versions of the current page, for the switcher and hreflang. */
export function versionsFor(pathname: string) {
  const native = pathname === "/en" || pathname === "/en/" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
  return [
    { code: NATIVE, hreflang: "ar", href: native, label: "العربية" },
    { code: "en", hreflang: "en", href: native === "/" ? "/en/" : `/en${native}`, label: "English" },
  ];
}
