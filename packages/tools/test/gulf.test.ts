import { describe, expect, it } from "vitest";
import { saudiEos, saudiResignationShare, serviceLength, uaeGratuity, vat, zakat } from "../src/gulf";
import { dateDiff, hijriDiff, nextHijriOccurrence, workingDays } from "../src/hijri/dates";
import { stripDiacritics, textStats } from "../src/text";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);

describe("Saudi end-of-service (Noqta 2026 examples)", () => {
  it("employer ended after 7 years, actual wage 8,000 → 36,000", () => {
    expect(saudiEos({ monthlyWage: 8000, years: 7, reason: "employer" }).award).toBe(36000);
  });
  it("resigned after 4 years, 6,000 → one third of 12,000 = 4,000", () => {
    const r = saudiEos({ monthlyWage: 6000, years: 4, reason: "resignation" });
    expect(r.fullAward).toBe(12000);
    expect(r.award).toBe(4000);
  });
  it("resigned after 8 years, 10,000 → two thirds of 55,000", () => {
    expect(saudiEos({ monthlyWage: 10000, years: 8, reason: "resignation" }).award).toBe(36666.67);
  });
  it("terminated after 6.5 years, 9,000 → 36,000", () => {
    expect(saudiEos({ monthlyWage: 9000, years: 6.5, reason: "employer" }).award).toBe(36000);
  });
  it("art. 85 shares, with exactly 5 years in the one-third band", () => {
    expect([1.9, 2, 5, 5.01, 9.99, 10].map(saudiResignationShare)).toEqual([0, 1 / 3, 1 / 3, 2 / 3, 2 / 3, 1]);
  });
  it("art. 87 resignation gets the full award; art. 80 gets nothing", () => {
    expect(saudiEos({ monthlyWage: 6000, years: 3, reason: "fullResignation" }).award).toBe(9000);
    expect(saudiEos({ monthlyWage: 6000, years: 3, reason: "art80" }).award).toBe(0);
  });
});

describe("UAE gratuity (Zoho 2026 examples, basic ÷ 30)", () => {
  it("3 years 8 months, AED 5,000 → 12,833.33", () => {
    expect(uaeGratuity({ basicWage: 5000, years: 3 + 8 / 12 }).gratuity).toBeCloseTo(12833.33, 1);
  });
  it("6 years 4 months, AED 5,000 → 24,166.67", () => {
    expect(uaeGratuity({ basicWage: 5000, years: 6 + 4 / 12 }).gratuity).toBeCloseTo(24166.67, 1);
  });
  it("2 years, AED 8,000 → 11,200", () => expect(uaeGratuity({ basicWage: 8000, years: 2 }).gratuity).toBe(11200));
  it("6 years 3 months, AED 15,000 → 71,250", () => expect(uaeGratuity({ basicWage: 15000, years: 6.25 }).gratuity).toBe(71250));
  it("12 years, AED 25,000 → 262,500", () => expect(uaeGratuity({ basicWage: 25000, years: 12 }).gratuity).toBe(262500));
  it("25 years, AED 5,000 → 117,500 (below the cap)", () => expect(uaeGratuity({ basicWage: 5000, years: 25 }).gratuity).toBe(117500));
  it("capped at 24 months of basic wage", () => {
    const r = uaeGratuity({ basicWage: 5000, years: 30 });
    expect(r.capped).toBe(true);
    expect(r.gratuity).toBe(120000);
  });
  it("nothing under one year", () => expect(uaeGratuity({ basicWage: 5000, years: 0.9 }).gratuity).toBe(0));
  it("×12/365 option gives a slightly lower daily rate", () => {
    expect(uaeGratuity({ basicWage: 5000, years: 2, dailyBasis: "365" }).daily).toBe(164.38);
  });
});

describe("service length", () => {
  it("1 Mar 2023 → 1 Nov 2026 = 3 years 8 months", () => {
    const s = serviceLength("2023-03-01", "2026-11-01");
    expect([s.years, s.months, s.days]).toEqual([3, 8, 0]);
    expect(s.decimal).toBeCloseTo(3 + 8 / 12, 6);
  });
  it("unpaid days are taken off", () => {
    expect(serviceLength("2025-01-01", "2026-01-01", 31).years).toBe(0);
  });
});

describe("VAT", () => {
  it("Saudi 15%: 100 → 115, and back", () => {
    expect(vat(100, 15, "add")).toEqual({ net: 100, vat: 15, gross: 115 });
    expect(vat(115, 15, "remove")).toEqual({ net: 100, vat: 15, gross: 115 });
  });
  it("UAE 5%: 210 incl. VAT → 200 + 10", () => expect(vat(210, 5, "remove")).toEqual({ net: 200, vat: 10, gross: 210 }));
});

describe("zakat", () => {
  it("50,000 cash with gold at 400/g: nisab 34,000, zakat 1,250", () => {
    const r = zakat({ cash: 50000, goldPricePerGram: 400 });
    expect(r.nisab).toBe(34000);
    expect(r.due).toBe(true);
    expect(r.zakat).toBe(1250);
  });
  it("below nisab after debts → nothing due", () => {
    expect(zakat({ cash: 40000, debts: 10000, goldPricePerGram: 400 }).due).toBe(false);
  });
  it("silver nisab is 595 g", () => expect(zakat({ cash: 5000, silverPricePerGram: 5, nisabBasis: "silver" }).nisab).toBe(2975));
});

describe("Hijri occasions from 10 Nov 2026", () => {
  const from = d("2026-11-10");
  it("1 Ramadan 1448 = 8 Feb 2027, 90 days away", () => {
    const r = nextHijriOccurrence(9, 1, from);
    expect(r.hijri.year).toBe(1448);
    expect(iso(r.gregorian)).toBe("2027-02-08");
    expect(r.daysLeft).toBe(90);
  });
  it("Eid al-Fitr 9 Mar 2027, Eid al-Adha 16 May 2027", () => {
    expect(iso(nextHijriOccurrence(10, 1, from).gregorian)).toBe("2027-03-09");
    expect(iso(nextHijriOccurrence(12, 10, from).gregorian)).toBe("2027-05-16");
  });
  it("on the day itself, 0 days left", () => expect(nextHijriOccurrence(9, 1, d("2027-02-08")).daysLeft).toBe(0));
  it("after it passes, rolls to the next Hijri year", () => {
    expect(nextHijriOccurrence(9, 1, d("2027-02-09")).hijri.year).toBe(1449);
  });
});

describe("date difference", () => {
  it("1 Jan → 31 Dec 2026 = 364 days, 11 months 30 days", () => {
    const r = dateDiff(d("2026-01-01"), d("2026-12-31"));
    expect(r.totalDays).toBe(364);
    expect([r.years, r.months, r.days]).toEqual([0, 11, 30]);
  });
  it("including the end day adds one", () => expect(dateDiff(d("2026-01-01"), d("2026-12-31"), true).totalDays).toBe(365));
  it("order does not matter, sign tells direction", () => {
    expect(dateDiff(d("2026-03-10"), d("2026-03-01")).sign).toBe(-1);
    expect(dateDiff(d("2026-03-10"), d("2026-03-01")).totalDays).toBe(9);
  });
  it("Gulf working days: Sun 8 Nov → Sat 14 Nov 2026 = 5", () => {
    expect(workingDays(d("2026-11-08"), d("2026-11-14"))).toBe(5);
  });
  it("Hijri difference of one Hijri year", () => {
    expect(hijriDiff(d("2025-06-26"), d("2026-06-16"))).toEqual({ years: 1, months: 0, days: 0 });
  });
});

describe("Arabic text stats", () => {
  it("counts words and diacritics", () => {
    const s = textStats("مَرْحَبًا بِكُمْ");
    expect(s.words).toBe(2);
    expect(s.diacritics).toBe(7);
    expect(stripDiacritics("مَرْحَبًا بِكُمْ")).toBe("مرحبا بكم");
  });
  it("counts sentences with the Arabic question mark and paragraphs", () => {
    const s = textStats("كيف حالك؟ أنا بخير.\n\nشكرا لك");
    expect(s.sentences).toBe(3);
    expect(s.paragraphs).toBe(2);
    expect(s.words).toBe(6);
  });
  it("ignores lone punctuation as words", () => expect(textStats("مرحبا - عالم").words).toBe(2));
  it("empty text", () => expect(textStats("   ").words).toBe(0));
});
