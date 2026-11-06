/**
 * Férias (CLT arts. 129–145, CF art. 7 XVII).
 * Days by unjustified absences in the acquisition period (art. 130).
 * Pay: (salary + average extras) / 30 × days, plus 1/3.
 * Abono pecuniário (art. 143): the worker may sell up to 1/3 of the days; the abono and
 * its 1/3 are free of INSS (Lei 8.212 art. 28 § 9) and IR (IN RFB 936/2009).
 * INSS and IRRF are computed on férias + 1/3 separately from the month's salary.
 * Whether the Lei 15.270 reduction applies to férias is not stated in the law; like most
 * payroll software we apply it, tested on férias + 1/3.
 */
import { BR_2026 } from "./rates-2026";
import { inss, irrf, round2, type BrRates } from "./core";

/** Vacation days for unjustified absences in the 12-month acquisition period. */
export function feriasDays(absences: number): number {
  const a = Math.max(0, Math.floor(absences));
  if (a <= 5) return 30;
  if (a <= 14) return 24;
  if (a <= 23) return 18;
  if (a <= 32) return 12;
  return 0;
}

export interface FeriasInput {
  monthlySalary: number;
  averageExtras?: number;
  absences?: number;
  /** Days sold as abono pecuniário (up to 1/3 of the entitlement). */
  daysSold?: number;
  dependents?: number;
  /** Set false to skip the 2026 reduction on férias. */
  applyReduction?: boolean;
}

export function ferias(
  { monthlySalary, averageExtras = 0, absences = 0, daysSold = 0, dependents = 0, applyReduction = true }: FeriasInput,
  rates: BrRates = BR_2026,
) {
  if (!(monthlySalary > 0)) throw new RangeError("monthlySalary must be positive");
  const entitlement = feriasDays(absences);
  const sold = Math.min(Math.max(0, Math.floor(daysSold)), Math.floor(entitlement / 3));
  const restDays = entitlement - sold;
  const daily = (monthlySalary + Math.max(0, averageExtras)) / 30;

  const feriasPay = round2(daily * restDays);
  const tercoFerias = round2(feriasPay / 3);
  const abono = round2(daily * sold);
  const tercoAbono = round2(abono / 3);

  const taxable = round2(feriasPay + tercoFerias);
  const contrib = inss(taxable, rates);
  const ir = irrf(
    { taxable, inss: contrib, dependents },
    applyReduction ? rates : { ...rates, reductionFullUpTo: 0, reductionPartialUpTo: 0 },
  );
  const gross = round2(taxable + abono + tercoAbono);

  return {
    entitlement,
    restDays,
    daysSold: sold,
    feriasPay,
    tercoFerias,
    abono,
    tercoAbono,
    gross,
    inss: contrib,
    irTable: ir.table,
    irReduction: ir.reduction,
    irrf: ir.irrf,
    net: round2(gross - contrib - ir.irrf),
  };
}
