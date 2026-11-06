/**
 * 13º salário (Lei 4.090/1962, Lei 4.749/1965): 1/12 of the salary per month worked,
 * a month counting when 15 or more days were worked in it.
 * 1st installment (by 30 Nov): half the gross, no deductions.
 * 2nd installment (by 20 Dec): the rest, minus INSS on the whole 13º and IRRF
 * taxed exclusively at source (no simplified discount), with the 2026 reduction.
 */
import { BR_2026 } from "./rates-2026";
import { inss, irrf, round2, type BrRates } from "./core";

export function decimoTerceiroGross(monthlySalary: number, monthsWorked: number) {
  if (!(monthlySalary > 0)) throw new RangeError("monthlySalary must be positive");
  if (!(monthsWorked >= 1 && monthsWorked <= 12)) throw new RangeError("monthsWorked must be 1–12");
  const gross = round2((monthlySalary / 12) * Math.floor(monthsWorked));
  return { gross, firstInstallment: round2(gross / 2) };
}

export interface DecimoInput {
  monthlySalary: number;
  monthsWorked: number;
  /** Monthly average of overtime, commissions, night premium… (enters the 13º). */
  averageExtras?: number;
  dependents?: number;
}

export function decimoTerceiro(
  { monthlySalary, monthsWorked, averageExtras = 0, dependents = 0 }: DecimoInput,
  rates: BrRates = BR_2026,
) {
  const { gross, firstInstallment } = decimoTerceiroGross(monthlySalary + Math.max(0, averageExtras), monthsWorked);
  const contrib = inss(gross, rates);
  const ir = irrf({ taxable: gross, inss: contrib, dependents, allowSimplified: false }, rates);
  const secondInstallment = round2(gross - firstInstallment - contrib - ir.irrf);
  return {
    gross,
    firstInstallment,
    inss: contrib,
    irBase: ir.base,
    irTable: ir.table,
    irReduction: ir.reduction,
    irrf: ir.irrf,
    secondInstallment,
    net: round2(firstInstallment + secondInstallment),
  };
}
