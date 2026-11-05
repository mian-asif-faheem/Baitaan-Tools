/**
 * Hijri ↔ Gregorian conversion using the browser's built-in
 * Umm al-Qura calendar (Intl "islamic-umalqura"). No library needed.
 * Supported range follows the ICU Umm al-Qura table (about 1300–1600 AH).
 */

export interface HijriDate {
  year: number;
  month: number; // 1–12
  day: number; // 1–30
}

const DAY = 86_400_000;

const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
  timeZone: "UTC",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/** Gregorian date (UTC, time ignored) → Hijri Umm al-Qura. */
export function toHijri(date: Date): HijriDate {
  const parts = fmt.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value.replace(/\D/g, ""));
  return { year: get("year"), month: get("month"), day: get("day") };
}

const cmp = (a: HijriDate, b: HijriDate) => a.year - b.year || a.month - b.month || a.day - b.day;

/** Hijri Umm al-Qura → Gregorian (UTC midnight). Throws if the day does not exist. */
export function toGregorian(h: HijriDate): Date {
  if (h.month < 1 || h.month > 12 || h.day < 1 || h.day > 30) throw new RangeError("Invalid Hijri date");
  // Mean-year estimate from the epoch (16 July 622), then walk to the exact day.
  const epoch = Date.UTC(622, 6, 16);
  const estDays = (h.year - 1) * 354.36707 + (h.month - 1) * 29.530589 + (h.day - 1);
  let t = epoch + Math.round(estDays) * DAY;
  for (let i = 0; i < 60; i++) {
    const c = cmp(toHijri(new Date(t)), h);
    if (c === 0) return new Date(t);
    t += (c < 0 ? 1 : -1) * DAY;
    // Detect overshoot past a missing day 30.
    const after = cmp(toHijri(new Date(t)), h);
    if (Math.sign(after) !== Math.sign(c) && after !== 0) throw new RangeError("This Hijri month has only 29 days");
  }
  throw new RangeError("Date outside the supported range");
}

/** Days in a Hijri month (29 or 30). */
export function hijriMonthLength(year: number, month: number): 29 | 30 {
  try {
    toGregorian({ year, month, day: 30 });
    return 30;
  } catch {
    return 29;
  }
}

/** Age in completed Hijri years, months and days on `on` (default today). */
export function hijriAge(birth: Date, on: Date = new Date()) {
  const b = toHijri(birth);
  const n = toHijri(on);
  let years = n.year - b.year;
  let months = n.month - b.month;
  let days = n.day - b.day;
  if (days < 0) {
    months -= 1;
    const pm = n.month === 1 ? 12 : n.month - 1;
    const py = n.month === 1 ? n.year - 1 : n.year;
    days += hijriMonthLength(py, pm);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export const HIJRI_MONTHS_AR = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
  "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
] as const;
