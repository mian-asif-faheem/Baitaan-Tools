/**
 * Mexico — vacaciones (LFT art. 76, "vacaciones dignas" reform in force since 2023)
 * and prima vacacional (art. 80, at least 25%).
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Vacation days for a given year of service (1 = first year).
 * Years 1–5: 12, 14, 16, 18, 20. From year 6: +2 days every 5 years (22 for 6–10, 24 for 11–15…).
 */
export function vacationDays(serviceYear: number): number {
  const y = Math.max(1, Math.floor(serviceYear));
  if (y <= 5) return 10 + 2 * y;
  return 20 + 2 * Math.ceil((y - 5) / 5);
}

export interface VacacionesInput {
  dailySalary: number;
  /** Completed years of service at the start of the current service year (0 in the first year). */
  completedYears: number;
  /** Prima vacacional percentage, minimum 25. */
  primaPercent?: number;
}

export function vacaciones({ dailySalary, completedYears, primaPercent = 25 }: VacacionesInput) {
  if (!(dailySalary > 0)) throw new RangeError("dailySalary must be positive");
  const days = vacationDays(completedYears + 1);
  const pct = Math.max(25, primaPercent) / 100;
  const pay = dailySalary * days;
  return {
    serviceYear: Math.floor(completedYears) + 1,
    days,
    vacationPay: round2(pay),
    primaVacacional: round2(pay * pct),
    total: round2(pay * (1 + pct)),
  };
}

/** Days per year for the next ten service years, for a reference table. */
export const vacationTable = (upTo = 35) =>
  Array.from({ length: upTo }, (_, i) => ({ year: i + 1, days: vacationDays(i + 1) }));
