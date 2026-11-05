import { BR_2026 } from "./rates-2026";

export { BR_2026 };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Progressive INSS employee contribution (each band taxed at its own rate). */
export function inss(gross: number, rates = BR_2026): number {
  let total = 0;
  let lower = 0;
  for (const band of rates.inss) {
    if (gross <= lower) break;
    total += (Math.min(gross, band.upTo) - lower) * band.rate;
    lower = band.upTo;
  }
  return round2(total);
}

export interface NetSalaryInput {
  gross: number;
  dependents?: number;
  /** Alimony (pensão alimentícia) paid, deductible from the IR base. */
  alimony?: number;
  /** Other non-tax deductions (transport voucher, health plan…). */
  otherDeductions?: number;
}

export interface NetSalaryResult {
  gross: number;
  inss: number;
  irBase: number;
  usedSimplifiedDiscount: boolean;
  irTable: number;
  irReduction: number;
  irrf: number;
  otherDeductions: number;
  net: number;
}

/** Salário líquido for CLT employees, with the 2026 IR reduction. */
export function netSalary(
  { gross, dependents = 0, alimony = 0, otherDeductions = 0 }: NetSalaryInput,
  rates = BR_2026,
): NetSalaryResult {
  if (!(gross > 0)) throw new RangeError("gross must be positive");
  const contrib = inss(gross, rates);
  const legal = contrib + dependents * rates.dependentDeduction + alimony;
  const usedSimplifiedDiscount = rates.simplifiedDiscount > legal;
  const irBase = round2(gross - Math.max(legal, rates.simplifiedDiscount));

  const band = rates.irrf.find((b) => irBase <= b.upTo)!;
  const irTable = round2(Math.max(0, irBase * band.rate - band.deduct));

  let irReduction = 0;
  if (gross <= rates.reductionFullUpTo) irReduction = irTable;
  else if (gross <= rates.reductionPartialUpTo)
    irReduction = Math.min(irTable, round2(rates.reductionA - rates.reductionB * gross));

  const irrf = round2(Math.max(0, irTable - irReduction));
  return {
    gross,
    inss: contrib,
    irBase,
    usedSimplifiedDiscount,
    irTable,
    irReduction: round2(irReduction),
    irrf,
    otherDeductions,
    net: round2(gross - contrib - irrf - alimony - otherDeductions),
  };
}

/**
 * 13º salário (Lei 4.090/1962): 1/12 of salary per month worked;
 * a month counts when 15 or more days were worked in it.
 * First installment = half the gross, paid without deductions.
 */
export function decimoTerceiroGross(monthlySalary: number, monthsWorked: number) {
  if (!(monthlySalary > 0)) throw new RangeError("monthlySalary must be positive");
  if (!(monthsWorked >= 1 && monthsWorked <= 12)) throw new RangeError("monthsWorked must be 1–12");
  const gross = round2((monthlySalary / 12) * Math.floor(monthsWorked));
  return { gross, firstInstallment: round2(gross / 2) };
}
