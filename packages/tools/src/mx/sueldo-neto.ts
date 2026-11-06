/**
 * Mexico — sueldo neto mensual for employees (sueldos y salarios).
 * ISR by the monthly tarifa (art. 96 LISR) on gross pay, minus subsidio para el empleo
 * (never paid in cash; it only reduces ISR to zero). IMSS worker quotas on the SBC.
 * Minimum-wage earners: no ISR withholding (art. 96 LISR) and the employer pays the
 * worker's IMSS quota (art. 36 LSS).
 */
import { MX_2026, type MxRates } from "./rates-2026";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** ISR from the monthly tarifa on a monthly taxable income. */
export function isrMensual(base: number, rates: MxRates = MX_2026): number {
  if (!(base > 0)) return 0;
  let row = rates.isrMonthly[0];
  for (const r of rates.isrMonthly) if (base >= r.lower) row = r;
  return round2(row.fixed + (base - row.lower) * row.rate);
}

/** Integration factor for the SBC: (365 + aguinaldo days + vacation days × prima) / 365. */
export function factorIntegracion(aguinaldoDays = 15, vacationDays = 12, primaPercent = 25): number {
  return (365 + aguinaldoDays + vacationDays * (primaPercent / 100)) / 365;
}

export interface SueldoNetoInput {
  monthlyGross: number;
  /** Factor to turn daily salary into SBC. Default = legal minimum benefits in year 1 (≈1.0493). */
  factor?: number;
  /** Use the Zona Libre de la Frontera Norte minimum wage for the exemption test. */
  frontera?: boolean;
  otherDeductions?: number;
}

export interface SueldoNetoResult {
  monthlyGross: number;
  dailySalary: number;
  sbcDaily: number;
  isrBeforeSubsidio: number;
  subsidio: number;
  isr: number;
  imss: number;
  imssBreakdown: Record<string, number>;
  otherDeductions: number;
  net: number;
  minimumWageExempt: boolean;
}

export function sueldoNeto(
  { monthlyGross, factor = factorIntegracion(), frontera = false, otherDeductions = 0 }: SueldoNetoInput,
  rates: MxRates = MX_2026,
): SueldoNetoResult {
  if (!(monthlyGross > 0)) throw new RangeError("monthlyGross must be positive");
  const days = rates.daysPerMonth;
  const dailySalary = monthlyGross / days;
  const minWage = frontera ? rates.minimumWage.frontera : rates.minimumWage.general;
  // Small tolerance so a salary entered as exactly the minimum (e.g. 315.04 × 30) still counts.
  const minimumWageExempt = monthlyGross / 30 <= minWage + 0.005 || dailySalary <= minWage + 0.005;

  const sbcDaily = Math.min(dailySalary * factor, rates.uma.daily * rates.imssWorker.sbcCapUma);

  const isrBeforeSubsidio = minimumWageExempt ? 0 : isrMensual(monthlyGross, rates);
  const subsidio =
    !minimumWageExempt && monthlyGross <= rates.subsidio.incomeCeiling
      ? Math.min(rates.subsidio.monthly, isrBeforeSubsidio)
      : 0;
  const isr = round2(isrBeforeSubsidio - subsidio);

  const imssBreakdown: Record<string, number> = {};
  let imssDaily = 0;
  for (const b of rates.imssWorker.flat) {
    imssBreakdown[b.key] = round2(sbcDaily * b.rate * days);
    imssDaily += sbcDaily * b.rate;
  }
  const excess = Math.max(0, sbcDaily - 3 * rates.uma.daily);
  imssBreakdown.excedente3Uma = round2(excess * rates.imssWorker.excedente3Uma * days);
  imssDaily += excess * rates.imssWorker.excedente3Uma;
  const imss = minimumWageExempt ? 0 : round2(imssDaily * days);

  return {
    monthlyGross,
    dailySalary: round2(dailySalary),
    sbcDaily: round2(sbcDaily),
    isrBeforeSubsidio,
    subsidio: round2(subsidio),
    isr,
    imss,
    imssBreakdown,
    otherDeductions,
    net: round2(monthlyGross - isr - imss - otherDeductions),
    minimumWageExempt,
  };
}
