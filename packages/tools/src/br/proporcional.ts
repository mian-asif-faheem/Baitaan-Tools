/**
 * Salário proporcional: pay for part of a month, using the 30-day commercial month
 * (CLT art. 64 parágrafo único). Optional deduction for unjustified absences,
 * which also lose the weekly paid rest (DSR) of that week (Lei 605/1949 art. 6).
 */
import { round2 } from "./core";

export interface ProporcionalInput {
  monthlySalary: number;
  daysWorked: number;
  /** Unjustified absences within those days. */
  absences?: number;
  /** Weeks with an unjustified absence (each loses one DSR day). */
  weeksWithAbsence?: number;
}

export function salarioProporcional({ monthlySalary, daysWorked, absences = 0, weeksWithAbsence = 0 }: ProporcionalInput) {
  if (!(monthlySalary > 0)) throw new RangeError("monthlySalary must be positive");
  if (!(daysWorked >= 0 && daysWorked <= 30)) throw new RangeError("daysWorked must be 0–30");
  const daily = monthlySalary / 30;
  const base = daily * daysWorked;
  const absenceDeduction = daily * Math.max(0, absences);
  const dsrDeduction = daily * Math.max(0, weeksWithAbsence);
  return {
    daily: round2(daily),
    base: round2(base),
    absenceDeduction: round2(absenceDeduction),
    dsrDeduction: round2(dsrDeduction),
    total: round2(Math.max(0, base - absenceDeduction - dsrDeduction)),
  };
}
