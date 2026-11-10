/**
 * Date difference and countdowns to Hijri occasions (Umm al-Qura).
 */
import { toGregorian, toHijri, type HijriDate } from "./index";

const DAY = 86_400_000;

const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

/** Difference between two Gregorian dates (UTC days). */
export function dateDiff(a: Date, b: Date, includeEnd = false) {
  let start = utcDay(a);
  let end = utcDay(b);
  const sign = end >= start ? 1 : -1;
  if (sign < 0) [start, end] = [end, start];
  const totalDays = Math.round((end - start) / DAY) + (includeEnd ? 1 : 0);
  const s = new Date(start);
  const e = new Date(end + (includeEnd ? DAY : 0));
  let y = e.getUTCFullYear() - s.getUTCFullYear();
  let m = e.getUTCMonth() - s.getUTCMonth();
  let d = e.getUTCDate() - s.getUTCDate();
  if (d < 0) {
    m -= 1;
    d += new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), 0)).getUTCDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  // Working days, with the Gulf weekend (Friday and Saturday) by default.
  return {
    sign,
    totalDays,
    weeks: Math.floor(totalDays / 7),
    weekDays: totalDays % 7,
    years: y,
    months: m,
    days: d,
  };
}

/** Days from a to b that are not weekend days (weekend = list of getUTCDay() values). */
export function workingDays(a: Date, b: Date, weekend: number[] = [5, 6], includeEnd = true) {
  const start = Math.min(utcDay(a), utcDay(b));
  const end = Math.max(utcDay(a), utcDay(b));
  const last = includeEnd ? end : end - DAY;
  let n = 0;
  for (let t = start; t <= last; t += DAY) if (!weekend.includes(new Date(t).getUTCDay())) n++;
  return n;
}

/**
 * Next Gregorian date (UTC midnight) on which the given Hijri month/day falls,
 * on or after `from`. Returns the Hijri year used.
 */
export function nextHijriOccurrence(month: number, day: number, from: Date = new Date()) {
  const today = utcDay(from);
  const h = toHijri(new Date(today));
  for (const year of [h.year, h.year + 1, h.year + 2]) {
    const target: HijriDate = { year, month, day };
    let g: Date;
    try {
      g = toGregorian(target);
    } catch {
      continue;
    }
    if (g.getTime() >= today) return { hijri: target, gregorian: g, daysLeft: Math.round((g.getTime() - today) / DAY) };
  }
  throw new RangeError("No occurrence found");
}

/** Hijri difference between two dates in years, months and days. */
export function hijriDiff(a: Date, b: Date) {
  const [x, y] = utcDay(a) <= utcDay(b) ? [a, b] : [b, a];
  const p = toHijri(x);
  const q = toHijri(y);
  let years = q.year - p.year;
  let months = q.month - p.month;
  let days = q.day - p.day;
  if (days < 0) {
    months -= 1;
    // Length of the Hijri month before q's month.
    const pm = q.month === 1 ? 12 : q.month - 1;
    const py = q.month === 1 ? q.year - 1 : q.year;
    let len = 29;
    try {
      toGregorian({ year: py, month: pm, day: 30 });
      len = 30;
    } catch {}
    days += len;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}
