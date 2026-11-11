export * from "@bt/ui/form";
import { locale, type Lang } from "../i18n";

export const money = (lang: Lang = "es") => new Intl.NumberFormat(locale(lang), { style: "currency", currency: "MXN" });
/** Spanish formatter, kept for pages that render tables at build time. */
export const mxn = money("es");
