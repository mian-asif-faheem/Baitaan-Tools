import { BR_2026 } from "./rates-2026";

export { BR_2026 };
export { round2, inss, irrf, type BrRates, type IrrfInput, type IrrfResult } from "./core";
import { inss, irrf, round2, type BrRates } from "./core";

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
  rates: BrRates = BR_2026,
): NetSalaryResult {
  if (!(gross > 0)) throw new RangeError("gross must be positive");
  const contrib = inss(gross, rates);
  const ir = irrf({ taxable: gross, inss: contrib, dependents, alimony }, rates);
  return {
    gross,
    inss: contrib,
    irBase: ir.base,
    usedSimplifiedDiscount: ir.usedSimplifiedDiscount,
    irTable: ir.table,
    irReduction: ir.reduction,
    irrf: ir.irrf,
    otherDeductions,
    net: round2(gross - contrib - ir.irrf - alimony - otherDeductions),
  };
}

export { decimoTerceiroGross, decimoTerceiro } from "./decimo";
export { feriasDays, ferias } from "./ferias";
export { horasExtras, NIGHT_HOUR_FACTOR } from "./horas";
export { rescisao, avisoPrevioDays, type TipoRescisao } from "./rescisao";
export { salarioProporcional } from "./proporcional";
