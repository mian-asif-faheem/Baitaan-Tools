import { BR_2026 } from "./rates-2026";

export type BrRates = typeof BR_2026;

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Progressive INSS employee contribution (each band taxed at its own rate). */
export function inss(gross: number, rates: BrRates = BR_2026): number {
  let total = 0;
  let lower = 0;
  for (const band of rates.inss) {
    if (gross <= lower) break;
    total += (Math.min(gross, band.upTo) - lower) * band.rate;
    lower = band.upTo;
  }
  return round2(total);
}

export interface IrrfInput {
  /** Taxable gross for this payment (salary, férias + 1/3, or 13º). */
  taxable: number;
  inss: number;
  dependents?: number;
  alimony?: number;
  /** Monthly payments may use the R$ 607,20 simplified discount; the 13º may not. */
  allowSimplified?: boolean;
}

export interface IrrfResult {
  base: number;
  usedSimplifiedDiscount: boolean;
  table: number;
  reduction: number;
  irrf: number;
}

/**
 * IRRF by the 2026 monthly table, then the Lei 15.270/2025 reduction
 * (art. 3-A of Lei 9.250/1995), which is tested on the taxable gross and
 * also applies to the 13º salário (§ 3).
 */
export function irrf(
  { taxable, inss: contrib, dependents = 0, alimony = 0, allowSimplified = true }: IrrfInput,
  rates: BrRates = BR_2026,
): IrrfResult {
  const legal = contrib + dependents * rates.dependentDeduction + alimony;
  const usedSimplifiedDiscount = allowSimplified && rates.simplifiedDiscount > legal;
  const base = round2(Math.max(0, taxable - (usedSimplifiedDiscount ? rates.simplifiedDiscount : legal)));
  const band = rates.irrf.find((b) => base <= b.upTo)!;
  const table = round2(Math.max(0, base * band.rate - band.deduct));
  let reduction = 0;
  if (taxable <= rates.reductionFullUpTo) reduction = table;
  else if (taxable <= rates.reductionPartialUpTo) reduction = Math.min(table, rates.reductionA - rates.reductionB * taxable);
  reduction = round2(Math.max(0, reduction));
  return { base, usedSimplifiedDiscount, table, reduction, irrf: round2(Math.max(0, table - reduction)) };
}
