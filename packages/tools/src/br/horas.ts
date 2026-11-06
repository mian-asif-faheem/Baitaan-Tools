/**
 * Horas extras e adicional noturno (CLT arts. 59, 73; CF art. 7 XVI).
 * Hourly rate = salary / monthly divisor (220 for 44 h/week, 200 for 40 h, 180 for 36 h).
 * Overtime: at least +50%; work on rest days and holidays is commonly paid at +100%
 * (Lei 605/1949 art. 9, Súmula 146 TST). Collective agreements may set higher rates.
 * Adicional noturno: +20% for urban work between 22:00 and 05:00, and each night hour
 * counts as 52 min 30 s, so 7 clock hours = 8 paid hours (art. 73 § 1).
 * DSR reflex (Súmula 172 TST, Lei 605/1949 art. 7): (overtime + night premium) / working days
 * × Sundays and holidays of the month.
 */
import { round2 } from "./core";

export const NIGHT_HOUR_FACTOR = 60 / 52.5; // 8/7

export interface HorasExtrasInput {
  monthlySalary: number;
  divisor?: number;
  hours50?: number;
  hours100?: number;
  /** Clock hours worked between 22:00 and 05:00. */
  nightClockHours?: number;
  nightPremiumPercent?: number;
  overtimePercent?: number;
  workingDays?: number;
  restDays?: number;
}

export function horasExtras({
  monthlySalary,
  divisor = 220,
  hours50 = 0,
  hours100 = 0,
  nightClockHours = 0,
  nightPremiumPercent = 20,
  overtimePercent = 50,
  workingDays = 25,
  restDays = 5,
}: HorasExtrasInput) {
  if (!(monthlySalary > 0)) throw new RangeError("monthlySalary must be positive");
  if (!(divisor > 0)) throw new RangeError("divisor must be positive");
  const hourly = monthlySalary / divisor;
  const pct = Math.max(50, overtimePercent) / 100;
  const he50 = hourly * (1 + pct) * Math.max(0, hours50);
  const he100 = hourly * 2 * Math.max(0, hours100);
  const nightPaidHours = Math.max(0, nightClockHours) * NIGHT_HOUR_FACTOR;
  const night = hourly * (Math.max(20, nightPremiumPercent) / 100) * nightPaidHours;
  const variable = he50 + he100 + night;
  const dsr = workingDays > 0 ? (variable / workingDays) * Math.max(0, restDays) : 0;
  return {
    hourly: round2(hourly),
    overtimeRate: round2(hourly * (1 + pct)),
    he50: round2(he50),
    he100: round2(he100),
    nightPaidHours: round2(nightPaidHours),
    night: round2(night),
    dsr: round2(dsr),
    total: round2(variable + dsr),
  };
}
