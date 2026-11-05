/**
 * Mexico — aguinaldo (year-end bonus), Ley Federal del Trabajo art. 87.
 * Minimum 15 days of salary per full year; proportional for part of the year.
 * Gross amount only. ISR exemption (30 UMA, LISR art. 93) is not applied here:
 * add it once the year's UMA value is confirmed from INEGI.
 */

export interface AguinaldoInput {
  /** Daily salary in MXN (salario diario). */
  dailySalary: number;
  /** Days worked in the calendar year (1–365). */
  daysWorked: number;
  /** Aguinaldo days granted by the employer; legal minimum is 15. */
  aguinaldoDays?: number;
}

export interface AguinaldoResult {
  aguinaldoDays: number;
  fullYearAmount: number;
  proportionalAmount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function aguinaldo({ dailySalary, daysWorked, aguinaldoDays = 15 }: AguinaldoInput): AguinaldoResult {
  if (!(dailySalary > 0)) throw new RangeError("dailySalary must be positive");
  if (!(daysWorked > 0 && daysWorked <= 365)) throw new RangeError("daysWorked must be 1–365");
  const days = Math.max(15, aguinaldoDays);
  const full = dailySalary * days;
  return {
    aguinaldoDays: days,
    fullYearAmount: round2(full),
    proportionalAmount: round2((full * daysWorked) / 365),
  };
}

/** Monthly salary to daily salary, using the 30-day month common in payroll. */
export const monthlyToDaily = (monthly: number) => round2(monthly / 30);
