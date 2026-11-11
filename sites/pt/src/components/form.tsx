export * from "@bt/ui/form";
import { locale, type Lang } from "../i18n";

export const money = (lang: Lang = "pt") => new Intl.NumberFormat(locale(lang), { style: "currency", currency: "BRL" });
/** Portuguese formatter, kept for pages that render tables at build time. */
export const brl = money("pt");
