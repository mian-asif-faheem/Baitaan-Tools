/**
 * Gulf calculators: end-of-service (Saudi Arabia, UAE), VAT, zakat.
 */

const DAY = 86_400_000;
export const round2 = (n: number) => Math.round(n * 100) / 100;

const parse = (iso: string) => {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) throw new RangeError(`Invalid date: ${iso}`);
  return t;
};

/** Years, months and days of service from start to end (end exclusive), and years as a decimal. */
export function serviceLength(startIso: string, endIso: string, unpaidDays = 0) {
  const start = parse(startIso);
  const end = parse(endIso) - Math.max(0, Math.floor(unpaidDays)) * DAY;
  if (end < start) throw new RangeError("end is before start");
  const s = new Date(start);
  const e = new Date(end);
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
  return { years: y, months: m, days: d, decimal: y + m / 12 + d / 365 };
}

/* ───────────── Saudi Arabia: Labor Law arts. 84, 85, 87 ───────────── */

export type SaudiReason =
  /** Employer ended the contract, or a fixed-term contract expired. */
  | "employer"
  /** Worker resigned (art. 85 fractions apply). */
  | "resignation"
  /** Resignation with full award (art. 87): force majeure, or a woman leaving within
   *  6 months of marriage or 3 months of giving birth. */
  | "fullResignation"
  /** Dismissed under art. 80 (no award). */
  | "art80";

export interface SaudiEosInput {
  /** Last actual monthly wage: basic plus housing, transport and other due allowances. */
  monthlyWage: number;
  years: number;
  reason: SaudiReason;
}

/** Resignation share under art. 85: < 2 years none; 2–5 one third; over 5 to under 10 two thirds; 10+ full. */
export function saudiResignationShare(years: number): number {
  if (years < 2) return 0;
  if (years <= 5) return 1 / 3;
  if (years < 10) return 2 / 3;
  return 1;
}

export function saudiEos({ monthlyWage, years, reason }: SaudiEosInput) {
  if (!(monthlyWage > 0)) throw new RangeError("monthlyWage must be positive");
  const y = Math.max(0, years);
  const first = Math.min(y, 5);
  const rest = Math.max(0, y - 5);
  const firstPart = (monthlyWage / 2) * first;
  const restPart = monthlyWage * rest;
  const full = firstPart + restPart;
  const share = reason === "resignation" ? saudiResignationShare(y) : reason === "art80" ? 0 : 1;
  return {
    firstYears: round2(first),
    laterYears: round2(rest),
    firstPart: round2(firstPart),
    restPart: round2(restPart),
    fullAward: round2(full),
    share,
    award: round2(full * share),
  };
}

/* ───────────── UAE: Federal Decree-Law 33/2021 art. 51 ───────────── */

export interface UaeGratuityInput {
  /** Last basic monthly wage (allowances excluded). */
  basicWage: number;
  years: number;
  /** "30": basic / 30 (most payroll software). "365": basic × 12 / 365. */
  dailyBasis?: "30" | "365";
}

export function uaeGratuity({ basicWage, years, dailyBasis = "30" }: UaeGratuityInput) {
  if (!(basicWage > 0)) throw new RangeError("basicWage must be positive");
  const y = Math.max(0, years);
  const daily = dailyBasis === "365" ? (basicWage * 12) / 365 : basicWage / 30;
  const eligible = y >= 1;
  const days = eligible ? 21 * Math.min(y, 5) + 30 * Math.max(0, y - 5) : 0;
  const uncapped = days * daily;
  const cap = basicWage * 24;
  return {
    eligible,
    daily: round2(daily),
    days: round2(days),
    uncapped: round2(uncapped),
    cap: round2(cap),
    capped: uncapped > cap,
    gratuity: round2(Math.min(uncapped, cap)),
  };
}

/* ───────────── VAT ───────────── */

export const VAT_RATES = { sa: 15, ae: 5, bh: 10, om: 5 } as const;
export type VatCountry = keyof typeof VAT_RATES;

/** add: amount excludes VAT. remove: amount includes VAT. */
export function vat(amount: number, ratePercent: number, mode: "add" | "remove") {
  const r = ratePercent / 100;
  const net = mode === "add" ? amount : amount / (1 + r);
  const tax = net * r;
  return { net: round2(net), vat: round2(tax), gross: round2(net + tax) };
}

/* ───────────── Zakat ───────────── */

export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;
export const ZAKAT_RATE = 0.025;

export interface ZakatInput {
  cash?: number;
  goldValue?: number;
  silverValue?: number;
  investments?: number;
  tradeGoods?: number;
  receivables?: number;
  /** Debts due now, deducted from the assets. */
  debts?: number;
  /** Price per gram of 24-carat gold, or of pure silver, in the same currency. */
  goldPricePerGram?: number;
  silverPricePerGram?: number;
  nisabBasis?: "gold" | "silver";
}

export function zakat(i: ZakatInput) {
  const pos = (n?: number) => Math.max(0, Number(n) || 0);
  const assets = pos(i.cash) + pos(i.goldValue) + pos(i.silverValue) + pos(i.investments) + pos(i.tradeGoods) + pos(i.receivables);
  const net = Math.max(0, assets - pos(i.debts));
  const basis = i.nisabBasis ?? "gold";
  const nisab =
    basis === "gold" ? NISAB_GOLD_GRAMS * pos(i.goldPricePerGram) : NISAB_SILVER_GRAMS * pos(i.silverPricePerGram);
  const due = nisab > 0 && net >= nisab;
  return {
    assets: round2(assets),
    net: round2(net),
    nisab: round2(nisab),
    nisabKnown: nisab > 0,
    due,
    zakat: due ? round2(net * ZAKAT_RATE) : 0,
  };
}
