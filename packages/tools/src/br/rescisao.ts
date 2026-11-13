/**
 * Rescisão do contrato de trabalho (CLT), gross amounts plus INSS/IRRF estimates.
 *
 * Sem justa causa: saldo de salário, aviso prévio (30 days + 3 per full year, max 90 —
 *   Lei 12.506/2011), 13º and férias proporcionais (the indemnified notice counts as service,
 *   art. 487 § 1), férias vencidas + 1/3, FGTS fine of 40% (Lei 8.036 art. 18).
 * Acordo (art. 484-A): half the indemnified notice, FGTS fine of 20%, everything else in full;
 *   the worker withdraws 80% of the FGTS and gets no seguro-desemprego.
 * Pedido de demissão: saldo, 13º and férias proporcionais, férias vencidas; if the notice is
 *   not worked, the employer may deduct 30 days' salary (art. 487 § 2).
 * Justa causa: saldo de salário and férias vencidas + 1/3 only (Súmulas 171 and 261 TST).
 *
 * A month counts for 13º and férias proporcionais when 15 or more days fall in it
 * (Lei 4.090 art. 1 § 2; CLT art. 146 parágrafo único).
 * INSS/IRRF: charged on saldo de salário and 13º, each separately. Indemnified notice and
 * indemnified férias are free of INSS and IR.
 */
import { BR_2026 } from "./rates-2026";
import { inss, irrf, round2, type BrRates } from "./core";

export type TipoRescisao = "semJustaCausa" | "pedidoDemissao" | "justaCausa" | "acordo";

const DAY = 86_400_000;
const parse = (iso: string) => {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) throw new RangeError(`Invalid date: ${iso}`);
  return t;
};
const ymd = (t: number) => {
  const d = new Date(t);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
};
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
/** Same day of the month `k` months later, clamped to the month's length (31 Jan + 1 → 28/29 Feb). */
const addMonths = (y: number, m: number, d: number, k: number) => {
  const yy = y + Math.floor((m + k) / 12);
  const mm = (((m + k) % 12) + 12) % 12;
  return Date.UTC(yy, mm, Math.min(d, daysInMonth(yy, mm)));
};

/** Completed years between two dates. */
function completedYears(start: number, end: number) {
  const s = ymd(start);
  const e = ymd(end);
  let years = e.y - s.y;
  if (e.m < s.m || (e.m === s.m && e.d < s.d)) years -= 1;
  return Math.max(0, years);
}

/** Months with 15+ days between a and b (inclusive), counted per calendar month. */
function monthsWith15Days(a: number, b: number) {
  if (b < a) return 0;
  let count = 0;
  let { y, m } = ymd(a);
  for (;;) {
    const mStart = Date.UTC(y, m, 1);
    const mEnd = Date.UTC(y, m, daysInMonth(y, m));
    if (mStart > b) break;
    const from = Math.max(a, mStart);
    const to = Math.min(b, mEnd);
    if (Math.round((to - from) / DAY) + 1 >= 15) count++;
    m++;
    if (m === 12) {
      m = 0;
      y++;
    }
  }
  return count;
}

/** Months (with a final fraction of 15+ days counting as one) from a to b, for férias. */
function avosFerias(a: number, b: number) {
  if (b < a) return 0;
  const s = ymd(a);
  let months = 0;
  let cursor = a;
  for (;;) {
    const next = addMonths(s.y, s.m, s.d, months + 1);
    if (next - DAY > b) break;
    months++;
    cursor = next;
  }
  const rest = Math.round((b - cursor) / DAY) + 1;
  return Math.min(12, months + (rest >= 15 ? 1 : 0));
}

/** Notice days: 30 plus 3 per completed year, up to 90 (Lei 12.506/2011). */
export const avisoPrevioDays = (years: number) => Math.min(90, 30 + 3 * Math.max(0, Math.floor(years)));

export interface RescisaoInput {
  monthlySalary: number;
  startDate: string;
  /** Last day worked. */
  endDate: string;
  tipo: TipoRescisao;
  /** sem justa causa / acordo: notice paid instead of worked. Pedido: notice not worked. */
  avisoIndenizado?: boolean;
  /** Full vacation periods earned and not taken. */
  feriasVencidas?: number;
  /** FGTS balance for the fine; estimated when omitted. */
  fgtsBalance?: number;
  averageExtras?: number;
  dependents?: number;
}

export interface RescisaoLine {
  key: string;
  amount: number;
  detail?: string;
}

export function rescisao(input: RescisaoInput, rates: BrRates = BR_2026) {
  const {
    monthlySalary,
    tipo,
    avisoIndenizado = true,
    feriasVencidas = 0,
    averageExtras = 0,
    dependents = 0,
  } = input;
  if (!(monthlySalary > 0)) throw new RangeError("monthlySalary must be positive");
  const start = parse(input.startDate);
  const end = parse(input.endDate);
  if (end < start) throw new RangeError("endDate is before startDate");

  const pay = monthlySalary + Math.max(0, averageExtras);
  const daily = pay / 30;
  const years = completedYears(start, end);
  const serviceMonths = (end - start) / DAY / 30.4375;

  // Saldo de salário: days worked in the last month (commercial month of 30 days).
  const e = ymd(end);
  const monthStart = Math.max(start, Date.UTC(e.y, e.m, 1));
  // A whole month worked is a whole salary (30 commercial days), February included.
  const wholeMonth = monthStart === Date.UTC(e.y, e.m, 1) && e.d === daysInMonth(e.y, e.m);
  const saldoDays = wholeMonth ? 30 : Math.min(30, Math.round((end - monthStart) / DAY) + 1);
  const saldo = round2((monthlySalary / 30) * saldoDays);

  // Aviso prévio.
  const fullAviso = avisoPrevioDays(years);
  let avisoDays = 0;
  let avisoDesconto = 0;
  if (tipo === "semJustaCausa" && avisoIndenizado) avisoDays = fullAviso;
  if (tipo === "acordo" && avisoIndenizado) avisoDays = Math.floor(fullAviso / 2);
  if (tipo === "pedidoDemissao" && avisoIndenizado) avisoDesconto = round2(monthlySalary);
  const aviso = round2(daily * avisoDays);
  // Indemnified notice days count as service (art. 487 § 1) and project the contract end.
  const projectedEnd = end + avisoDays * DAY;

  const lines: RescisaoLine[] = [{ key: "saldo", amount: saldo, detail: `${saldoDays}` }];
  if (aviso > 0) lines.push({ key: "aviso", amount: aviso, detail: `${avisoDays}` });

  let decimo = 0;
  let feriasProp = 0;
  let avosDecimo = 0;
  let avosFer = 0;
  if (tipo !== "justaCausa") {
    const pe = ymd(projectedEnd);
    avosDecimo = monthsWith15Days(Math.max(start, Date.UTC(pe.y, 0, 1)), projectedEnd);
    decimo = round2((pay / 12) * avosDecimo);
    // Current acquisition period starts at the last anniversary of the start date.
    const s = ymd(start);
    let annY = pe.y;
    if (addMonths(annY, s.m, s.d, 0) > projectedEnd) annY -= 1;
    const periodStart = Math.max(start, addMonths(annY, s.m, s.d, 0));
    avosFer = avosFerias(periodStart, projectedEnd);
    feriasProp = round2((pay / 12) * avosFer);
    lines.push({ key: "decimo", amount: decimo, detail: `${avosDecimo}/12` });
    lines.push({ key: "feriasProp", amount: feriasProp, detail: `${avosFer}/12` });
    lines.push({ key: "tercoProp", amount: round2(feriasProp / 3) });
  }
  const vencidas = round2(pay * Math.max(0, Math.floor(feriasVencidas)));
  if (vencidas > 0) {
    lines.push({ key: "feriasVencidas", amount: vencidas, detail: `${Math.floor(feriasVencidas)}` });
    lines.push({ key: "tercoVencidas", amount: round2(vencidas / 3) });
  }

  const gross = round2(lines.reduce((s, l) => s + l.amount, 0));

  // Deductions: INSS + IRRF on saldo and on 13º, separately.
  const inssSaldo = inss(saldo, rates);
  const irSaldo = irrf({ taxable: saldo, inss: inssSaldo, dependents }, rates).irrf;
  const inssDecimo = decimo > 0 ? inss(decimo, rates) : 0;
  const irDecimo = decimo > 0 ? irrf({ taxable: decimo, inss: inssDecimo, dependents, allowSimplified: false }, rates).irrf : 0;
  const deductions = [
    { key: "inss", amount: round2(inssSaldo + inssDecimo) },
    { key: "irrf", amount: round2(irSaldo + irDecimo) },
    ...(avisoDesconto > 0 ? [{ key: "avisoDesconto", amount: avisoDesconto }] : []),
  ];
  const totalDeductions = round2(deductions.reduce((s, d) => s + d.amount, 0));

  // FGTS.
  const fgtsEstimated = input.fgtsBalance == null || !(input.fgtsBalance >= 0);
  const fgtsBalance = fgtsEstimated
    ? round2(0.08 * monthlySalary * serviceMonths * (13 / 12))
    : round2(input.fgtsBalance!);
  const fgtsMonth = round2(0.08 * (saldo + decimo + aviso));
  const fineRate = tipo === "semJustaCausa" ? 0.4 : tipo === "acordo" ? 0.2 : 0;
  const fgtsFine = round2((fgtsBalance + fgtsMonth) * fineRate);
  const withdrawRate = tipo === "semJustaCausa" ? 1 : tipo === "acordo" ? 0.8 : 0;

  return {
    yearsOfService: years,
    avisoDays,
    avisoFullDays: fullAviso,
    lines,
    gross,
    deductions,
    totalDeductions,
    net: round2(gross - totalDeductions),
    fgts: {
      balance: fgtsBalance,
      estimated: fgtsEstimated,
      monthDeposit: fgtsMonth,
      fineRate,
      fine: fgtsFine,
      withdrawRate,
      withdrawable: round2((fgtsBalance + fgtsMonth) * withdrawRate),
    },
    seguroDesemprego: tipo === "semJustaCausa",
    totalWithFine: round2(gross - totalDeductions + fgtsFine),
  };
}
