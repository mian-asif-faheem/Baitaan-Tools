export * from "@bt/ui/form";
import { fieldClass } from "@bt/ui/form";
import { HIJRI_MONTHS_AR, HIJRI_MONTHS_EN, hijriMonthLength } from "@bt/tools/hijri";
import { getT, locale, type Lang } from "../i18n";

export const money = (currency: string, lang: Lang = "ar") =>
  new Intl.NumberFormat(locale(lang), { style: "currency", currency, maximumFractionDigits: 2 });
export const numFmt = (lang: Lang = "ar") => new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 2 });
/** Arabic formatter, kept for pages that render at build time. */
export const num = numFmt("ar");
export const gregLongFmt = (lang: Lang = "ar") =>
  new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ar-u-nu-latn", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "UTC" });
export const gregLong = gregLongFmt("ar");
export const hijriMonths = (lang: Lang = "ar") => (lang === "en" ? HIJRI_MONTHS_EN : HIJRI_MONTHS_AR);
/** "17 Muharram 1416 AH" / "17 محرم 1416 هـ". */
export const hijriText = (h: { year: number; month: number; day: number }, lang: Lang = "ar") =>
  `${h.day} ${hijriMonths(lang)[h.month - 1]} ${h.year} ${getT(lang).conv.hijriSuffix}`;

export function HijriDateInput(props: {
  label: string;
  value: { year: string; month: string; day: string };
  onChange: (v: { year: string; month: string; day: string }) => void;
  lang?: Lang;
}) {
  const { value: v, onChange, lang = "ar" } = props;
  const t = getT(lang);
  const max = Number(v.year) > 0 ? hijriMonthLength(Number(v.year), Number(v.month)) : 30;
  return (
    <fieldset class="m-0 min-w-0 border-0 p-0">
      <legend class="bt-label mb-1.5 p-0">{props.label}</legend>
      <div class="grid grid-cols-[72px_minmax(0,1fr)_88px] gap-2">
        <input
          aria-label={t.conv.day}
          class={fieldClass}
          type="number"
          inputMode="numeric"
          min="1"
          max={max}
          value={v.day}
          onInput={(e) => onChange({ ...v, day: e.currentTarget.value })}
        />
        <select aria-label={t.conv.month} class={fieldClass} value={v.month} onChange={(e) => onChange({ ...v, month: e.currentTarget.value })}>
          {hijriMonths(lang).map((m, i) => (
            <option value={String(i + 1)}>{m}</option>
          ))}
        </select>
        <input
          aria-label={t.conv.year}
          class={fieldClass}
          type="number"
          inputMode="numeric"
          min="1343"
          max="1500"
          value={v.year}
          onInput={(e) => onChange({ ...v, year: e.currentTarget.value })}
        />
      </div>
    </fieldset>
  );
}

/**
 * Arabic number agreement: 1 → singular + "واحد/ة", 2 → dual alone, 3–10 → plural,
 * 11–99 → accusative singular, and hundreds/thousands ending in 0–2 → singular.
 */
const FORMS = {
  years: { one: "سنة", two: "سنتان", few: "سنوات", many: "سنة", fem: true },
  months: { one: "شهر", two: "شهران", few: "أشهر", many: "شهرًا", fem: false },
  weeks: { one: "أسبوع", two: "أسبوعان", few: "أسابيع", many: "أسبوعًا", fem: false },
  days: { one: "يوم", two: "يومان", few: "أيام", many: "يومًا", fem: false },
} as const;
const EN = { years: ["year", "years"], months: ["month", "months"], weeks: ["week", "weeks"], days: ["day", "days"] } as const;

export function count(n: number, unit: keyof typeof FORMS, lang: Lang = "ar") {
  if (lang === "en") return `${numFmt("en").format(n)} ${EN[unit][Math.abs(n) === 1 ? 0 : 1]}`;
  const f = FORMS[unit];
  const k = Math.abs(Math.trunc(n));
  if (k === 0) return `0 ${f.one}`;
  if (k === 1) return `${f.one} ${f.fem ? "واحدة" : "واحد"}`;
  if (k === 2) return f.two;
  const r = k % 100;
  const word = r >= 3 && r <= 10 ? f.few : r >= 11 ? f.many : f.one;
  return `${num.format(n)} ${word}`;
}

/** Joins parts: "3 سنوات و8 أشهر و14 يومًا" / "3 years, 8 months and 14 days". */
export function joinParts(parts: string[], lang: Lang = "ar") {
  if (lang !== "en") return parts.join(" و");
  return parts.length < 2 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

export function durationText(y: number, m: number, d: number, lang: Lang = "ar") {
  const parts: string[] = [];
  if (y) parts.push(count(y, "years", lang));
  if (m) parts.push(count(m, "months", lang));
  if (d || !parts.length) parts.push(count(d, "days", lang));
  return joinParts(parts, lang);
}
