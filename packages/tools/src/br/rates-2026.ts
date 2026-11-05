/**
 * Brazil 2026 payroll tables. Update every January.
 * INSS: Portaria Interministerial MPS/MF nº 13/2026.
 * IRRF: Receita Federal monthly table + reduction of Lei nº 15.270/2025.
 */
export const BR_2026 = {
  year: 2026,
  minimumWage: 1621.0,
  inss: [
    { upTo: 1621.0, rate: 0.075 },
    { upTo: 2902.84, rate: 0.09 },
    { upTo: 4354.27, rate: 0.12 },
    { upTo: 8475.55, rate: 0.14 },
  ],
  irrf: [
    { upTo: 2428.8, rate: 0, deduct: 0 },
    { upTo: 2826.65, rate: 0.075, deduct: 182.16 },
    { upTo: 3751.05, rate: 0.15, deduct: 394.16 },
    { upTo: 4664.68, rate: 0.225, deduct: 675.49 },
    { upTo: Infinity, rate: 0.275, deduct: 908.73 },
  ],
  dependentDeduction: 189.59,
  simplifiedDiscount: 607.2,
  /** Lei 15.270/2025: tax zeroed up to this monthly income… */
  reductionFullUpTo: 5000.0,
  /** …and reduced linearly up to this income: reduction = a − b × income. */
  reductionPartialUpTo: 7350.0,
  reductionA: 978.62,
  reductionB: 0.133145,
} as const;
