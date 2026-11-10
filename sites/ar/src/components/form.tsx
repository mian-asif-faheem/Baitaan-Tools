export * from "@bt/ui/form";
import { fieldClass } from "@bt/ui/form";
import { HIJRI_MONTHS_AR, hijriMonthLength } from "@bt/tools/hijri";
import t from "../i18n/ar.json";

/** Western digits are the norm on Gulf websites and avoid ambiguity in forms. */
export const money = (currency: string) =>
  new Intl.NumberFormat("ar-SA-u-nu-latn", { style: "currency", currency, maximumFractionDigits: 2 });
export const num = new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 2 });
export const gregLong = new Intl.DateTimeFormat("ar-u-nu-latn", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "UTC" });

export function HijriDateInput(props: {
  label: string;
  value: { year: string; month: string; day: string };
  onChange: (v: { year: string; month: string; day: string }) => void;
}) {
  const { value: v, onChange } = props;
  const max = Number(v.year) > 0 ? hijriMonthLength(Number(v.year), Number(v.month)) : 30;
  return (
    <fieldset>
      <legend class="text-sm font-semibold">{props.label}</legend>
      <div class="mt-1 grid grid-cols-[1fr_2fr_1.3fr] gap-2">
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
          {HIJRI_MONTHS_AR.map((m, i) => (
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

export function count(n: number, unit: keyof typeof FORMS) {
  const f = FORMS[unit];
  const k = Math.abs(Math.trunc(n));
  if (k === 1) return `${f.one} ${f.fem ? "واحدة" : "واحد"}`;
  if (k === 2) return f.two;
  const r = k % 100;
  const word = r >= 3 && r <= 10 ? f.few : r >= 11 ? f.many : f.one;
  return `${num.format(n)} ${word}`;
}

/** "3 سنوات و8 أشهر و14 يومًا". */
export function durationText(y: number, m: number, d: number) {
  const parts: string[] = [];
  if (y) parts.push(count(y, "years"));
  if (m) parts.push(count(m, "months"));
  if (d || !parts.length) parts.push(d ? count(d, "days") : `0 ${FORMS.days.one}`);
  return parts.join(" و");
}
