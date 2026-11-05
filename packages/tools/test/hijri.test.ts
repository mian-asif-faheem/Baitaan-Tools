import { describe, expect, it } from "vitest";
import { hijriAge, hijriMonthLength, toGregorian, toHijri } from "../src/hijri";

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe("Hijri Umm al-Qura", () => {
  it("1 Muharram 1447 = 26 June 2025", () => {
    expect(toHijri(new Date(Date.UTC(2025, 5, 26)))).toEqual({ year: 1447, month: 1, day: 1 });
    expect(iso(toGregorian({ year: 1447, month: 1, day: 1 }))).toBe("2025-06-26");
  });

  it("round-trips every day of 2020–2030", () => {
    for (let t = Date.UTC(2020, 0, 1); t < Date.UTC(2031, 0, 1); t += 86_400_000) {
      const d = new Date(t);
      expect(iso(toGregorian(toHijri(d)))).toBe(iso(d));
    }
  });

  it("months are 29 or 30 days and a missing day 30 throws", () => {
    for (let m = 1; m <= 12; m++) {
      const len = hijriMonthLength(1447, m);
      expect([29, 30]).toContain(len);
      if (len === 29) expect(() => toGregorian({ year: 1447, month: m, day: 30 })).toThrow();
    }
  });

  it("age on the same Hijri day one year later is exactly 1 year", () => {
    const birth = toGregorian({ year: 1446, month: 3, day: 10 });
    const on = toGregorian({ year: 1447, month: 3, day: 10 });
    expect(hijriAge(birth, on)).toEqual({ years: 1, months: 0, days: 0 });
  });
});
