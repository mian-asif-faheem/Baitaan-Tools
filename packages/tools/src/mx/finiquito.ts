/**
 * Mexico — finiquito and liquidación (Ley Federal del Trabajo), gross amounts.
 *
 * Finiquito (always owed when the job ends): unpaid salary, proportional aguinaldo (art. 87),
 * proportional vacation for the current service year plus untaken days (arts. 76, 79),
 * prima vacacional on those days (art. 80).
 *
 * Liquidación (only for dismissal without justified cause, or rescission by the worker
 * for the employer's fault, art. 51/52): 3 months of integrated salary (art. 50-III, 48),
 * 20 days per year (art. 50-II) when the employer refuses reinstatement (art. 49) or the
 * worker rescinds (art. 52), and prima de antigüedad.
 *
 * Prima de antigüedad (art. 162): 12 days per year of service, salary capped at twice the
 * minimum wage (arts. 485, 486). Owed on any dismissal (justified or not) and on voluntary
 * resignation only with 15 or more years of service.
 *
 * ISR is not withheld here; results are gross. Exemptions (LISR art. 93) are applied by payroll.
 */
import { MX_2026, type MxRates } from "./rates-2026";
import { vacationDays } from "./vacaciones";
import { factorIntegracion } from "./sueldo-neto";

const DAY = 86_400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

export type Motivo = "renuncia" | "despidoJustificado" | "despidoInjustificado";

export interface FiniquitoInput {
  dailySalary: number;
  /** ISO dates, yyyy-mm-dd. */
  startDate: string;
  endDate: string;
  motivo: Motivo;
  /** Days already worked in the last pay period but not yet paid. */
  unpaidDays?: number;
  /** Vacation days from earlier service years not yet taken. */
  pendingVacationDays?: number;
  aguinaldoDays?: number;
  primaVacacionalPercent?: number;
  /** For despidoInjustificado: include 20 days per year (art. 50-II). */
  include20DiasPorAnio?: boolean;
  frontera?: boolean;
}

export interface Line {
  key: string;
  days: number;
  amount: number;
}

export interface FiniquitoResult {
  yearsOfService: number;
  daysOfService: number;
  sdi: number;
  finiquito: Line[];
  liquidacion: Line[];
  totalFiniquito: number;
  totalLiquidacion: number;
  total: number;
}

const parse = (iso: string) => {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) throw new RangeError(`Invalid date: ${iso}`);
  return t;
};

/** Days from a to b counting both ends. */
const daysInclusive = (a: number, b: number) => Math.round((b - a) / DAY) + 1;

/** Most recent anniversary of `start` on or before `end` (UTC timestamps). */
function lastAnniversary(start: number, end: number) {
  const s = new Date(start);
  const e = new Date(end);
  let y = e.getUTCFullYear();
  const ann = (yy: number) => Date.UTC(yy, s.getUTCMonth(), s.getUTCDate());
  if (ann(y) > end) y -= 1;
  return { at: Math.max(ann(y), start), completedYears: y - s.getUTCFullYear() };
}

export function finiquito(input: FiniquitoInput, rates: MxRates = MX_2026): FiniquitoResult {
  const {
    dailySalary,
    motivo,
    unpaidDays = 0,
    pendingVacationDays = 0,
    aguinaldoDays = 15,
    primaVacacionalPercent = 25,
    include20DiasPorAnio = false,
    frontera = false,
  } = input;
  if (!(dailySalary > 0)) throw new RangeError("dailySalary must be positive");
  const start = parse(input.startDate);
  const end = parse(input.endDate);
  if (end < start) throw new RangeError("endDate is before startDate");

  const daysOfService = daysInclusive(start, end);
  const yearsOfService = daysOfService / 365;
  const { at: anniv, completedYears } = lastAnniversary(start, end);

  // Aguinaldo: days worked in the calendar year of the end date.
  const yearStart = Date.UTC(new Date(end).getUTCFullYear(), 0, 1);
  const aguinaldoWorked = daysInclusive(Math.max(start, yearStart), end);
  const agDays = Math.max(15, aguinaldoDays);
  // A full leap year (366 days) is still one year's aguinaldo, not a little more.
  const aguinaldoProp = Math.min(agDays, (agDays * aguinaldoWorked) / 365);

  // Vacation: proportional share of the current service year's entitlement, plus untaken days.
  const currentYearDays = vacationDays(completedYears + 1);
  const daysIntoServiceYear = daysInclusive(anniv, end);
  const vacProp = Math.min(currentYearDays, (currentYearDays * daysIntoServiceYear) / 365) + pendingVacationDays;
  const prima = Math.max(25, primaVacacionalPercent) / 100;

  const fin: Line[] = [
    { key: "salarioPendiente", days: unpaidDays, amount: round2(unpaidDays * dailySalary) },
    { key: "aguinaldo", days: round2(aguinaldoProp), amount: round2(aguinaldoProp * dailySalary) },
    { key: "vacaciones", days: round2(vacProp), amount: round2(vacProp * dailySalary) },
    { key: "primaVacacional", days: round2(vacProp * prima), amount: round2(vacProp * dailySalary * prima) },
  ];

  // Integrated daily salary (SDI) for indemnizaciones (art. 84, 89), with the current year's benefits.
  const sdi = dailySalary * factorIntegracion(agDays, currentYearDays, prima * 100);

  const liq: Line[] = [];
  if (motivo === "despidoInjustificado") {
    liq.push({ key: "tresMeses", days: 90, amount: round2(90 * sdi) });
    if (include20DiasPorAnio) {
      const d = 20 * yearsOfService;
      liq.push({ key: "veinteDias", days: round2(d), amount: round2(d * sdi) });
    }
  }
  const primaAntiguedadApplies =
    motivo === "despidoInjustificado" || motivo === "despidoJustificado" || yearsOfService >= 15;
  if (primaAntiguedadApplies) {
    const cap = 2 * (frontera ? rates.minimumWage.frontera : rates.minimumWage.general);
    const base = Math.min(dailySalary, cap);
    const d = 12 * yearsOfService;
    liq.push({ key: "primaAntiguedad", days: round2(d), amount: round2(d * base) });
  }

  const sum = (ls: Line[]) => round2(ls.reduce((s, l) => s + l.amount, 0));
  const totalFiniquito = sum(fin);
  const totalLiquidacion = sum(liq);
  return {
    yearsOfService: round2(yearsOfService),
    daysOfService,
    sdi: round2(sdi),
    finiquito: fin,
    liquidacion: liq,
    totalFiniquito,
    totalLiquidacion,
    total: round2(totalFiniquito + totalLiquidacion),
  };
}
