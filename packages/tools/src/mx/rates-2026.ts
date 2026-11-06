/**
 * Mexico 2026 payroll figures. Update every January (UMA changes on 1 February).
 *
 * ISR: monthly tarifa, Anexo 8 RMF 2026 (art. 96 LISR) — unchanged from 2025.
 * UMA: INEGI, comunicado 1/26, in force from 1 Feb 2026.
 * Minimum wage: CONASAMI, from 1 Jan 2026.
 * Subsidio para el empleo: decree DOF 31 Dec 2025 — 15.02% of the monthly UMA
 *   from February (January used 15.59% of the 2025 UMA = $536.21).
 * IMSS worker quotas: Ley del Seguro Social arts. 25, 106, 107, 147, 168.
 */
export const MX_2026 = {
  year: 2026,
  uma: { daily: 117.31, monthly: 3566.22 },
  minimumWage: { general: 315.04, frontera: 440.87 },
  /** Days per month used by SAT/IMSS for periods (30.4). */
  daysPerMonth: 30.4,
  isrMonthly: [
    { lower: 0.01, fixed: 0, rate: 0.0192 },
    { lower: 844.6, fixed: 16.22, rate: 0.064 },
    { lower: 7168.52, fixed: 420.95, rate: 0.1088 },
    { lower: 12598.03, fixed: 1011.68, rate: 0.16 },
    { lower: 14644.65, fixed: 1339.14, rate: 0.1792 },
    { lower: 17533.65, fixed: 1856.84, rate: 0.2136 },
    { lower: 35362.84, fixed: 5665.16, rate: 0.2352 },
    { lower: 55736.69, fixed: 10457.09, rate: 0.3 },
    { lower: 106410.51, fixed: 25659.23, rate: 0.32 },
    { lower: 141880.67, fixed: 37009.69, rate: 0.34 },
    { lower: 425642.0, fixed: 133488.54, rate: 0.35 },
  ],
  subsidio: { monthly: 535.65, incomeCeiling: 11492.66 },
  imssWorker: {
    /** Applied to the whole SBC. */
    flat: [
      { key: "prestacionesDinero", rate: 0.0025 },
      { key: "gastosMedicosPensionados", rate: 0.00375 },
      { key: "invalidezVida", rate: 0.00625 },
      { key: "cesantiaVejez", rate: 0.01125 },
    ],
    /** Applied only to the part of the daily SBC above 3 UMA. */
    excedente3Uma: 0.004,
    /** SBC is capped at 25 UMA per day. */
    sbcCapUma: 25,
  },
} as const;

export type MxRates = typeof MX_2026;
