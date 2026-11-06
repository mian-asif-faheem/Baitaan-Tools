import { describe, expect, it } from "vitest";
import { factorIntegracion, finiquito, isrMensual, sueldoNeto, vacaciones, vacationDays } from "../src/mx";

describe("vacation days, LFT art. 76 (2023 reform)", () => {
  it("years 1–5 are 12, 14, 16, 18, 20", () => {
    expect([1, 2, 3, 4, 5].map(vacationDays)).toEqual([12, 14, 16, 18, 20]);
  });
  it("then +2 every five years", () => {
    expect([6, 10, 11, 15, 16, 21, 26, 31].map(vacationDays)).toEqual([22, 22, 24, 24, 26, 28, 30, 32]);
  });
  it("prima vacacional is at least 25%", () => {
    const r = vacaciones({ dailySalary: 500, completedYears: 2, primaPercent: 10 });
    expect(r.days).toBe(16);
    expect(r.vacationPay).toBe(8000);
    expect(r.primaVacacional).toBe(2000);
  });
});

describe("ISR monthly tarifa 2026", () => {
  // Published examples: yo-facturo.com, "Sueldo bruto a neto en México 2026".
  it("$15,000 → $1,402.82", () => expect(isrMensual(15000)).toBe(1402.82));
  it("$10,000 → $729.02", () => expect(isrMensual(10000)).toBeCloseTo(729.02, 1));
  it("$30,000 → $4,519.65", () => expect(isrMensual(30000)).toBe(4519.65));
});

describe("sueldo neto 2026", () => {
  it("integration factor for year 1 is 1.0493", () => expect(factorIntegracion()).toBeCloseTo(1.0493, 4));

  it("$15,000 → net $13,203.20 (ISR 1,402.82, IMSS 393.98)", () => {
    const r = sueldoNeto({ monthlyGross: 15000 });
    expect(r.subsidio).toBe(0);
    expect(r.imss).toBe(393.98);
    expect(r.net).toBe(13203.2);
  });

  it("$10,000 gets the $535.65 subsidio → net $9,557.42", () => {
    const r = sueldoNeto({ monthlyGross: 10000 });
    expect(r.subsidio).toBe(535.65);
    expect(r.isr).toBeCloseTo(193.37, 1);
    expect(r.imss).toBe(249.21);
    expect(r.net).toBeCloseTo(9557.42, 1);
  });

  it("subsidio never makes ISR negative", () => {
    const r = sueldoNeto({ monthlyGross: 9600 });
    expect(r.isr).toBeGreaterThanOrEqual(0);
  });

  it("minimum wage: no ISR and no IMSS deduction", () => {
    const r = sueldoNeto({ monthlyGross: 315.04 * 30.4 });
    expect(r.minimumWageExempt).toBe(true);
    expect(r.isr).toBe(0);
    expect(r.imss).toBe(0);
    expect(r.net).toBeCloseTo(315.04 * 30.4, 2);
  });

  it("SBC is capped at 25 UMA", () => {
    const r = sueldoNeto({ monthlyGross: 300000 });
    expect(r.sbcDaily).toBeCloseTo(117.31 * 25, 2);
  });
});

describe("finiquito and liquidación", () => {
  // Published example: pluxee.mx — $15,000/month ($500/day), 1 Jan–30 Jun 2026, resignation.
  it("resignation after 181 days → $7,438.36", () => {
    const r = finiquito({ dailySalary: 500, startDate: "2026-01-01", endDate: "2026-06-30", motivo: "renuncia" });
    const byKey = Object.fromEntries(r.finiquito.map((l) => [l.key, l.amount]));
    expect(byKey.aguinaldo).toBe(3719.18);
    expect(byKey.vacaciones).toBe(2975.34);
    expect(byKey.primaVacacional).toBe(743.84);
    expect(r.liquidacion).toEqual([]);
    expect(r.total).toBe(7438.36);
  });

  it("unpaid salary days are added", () => {
    const r = finiquito({ dailySalary: 500, startDate: "2026-01-01", endDate: "2026-06-30", motivo: "renuncia", unpaidDays: 10 });
    expect(r.total).toBe(12438.36);
  });

  it("unjustified dismissal adds 3 months of SDI and prima de antigüedad (capped at 2× minimum wage)", () => {
    const r = finiquito({
      dailySalary: 1000,
      startDate: "2021-01-01",
      endDate: "2025-12-31",
      motivo: "despidoInjustificado",
    });
    // 5 years exactly: in service year 5 → 20 vacation days; SDI factor (365+15+20×0.25)/365.
    const sdi = 1000 * (385 / 365);
    const tres = r.liquidacion.find((l) => l.key === "tresMeses")!;
    expect(tres.amount).toBeCloseTo(90 * sdi, 1);
    const prima = r.liquidacion.find((l) => l.key === "primaAntiguedad")!;
    expect(prima.amount).toBeCloseTo(12 * (1826 / 365) * 2 * 315.04, 0);
    expect(r.liquidacion.some((l) => l.key === "veinteDias")).toBe(false);
  });

  it("20 days per year only when chosen", () => {
    const r = finiquito({
      dailySalary: 400,
      startDate: "2023-03-01",
      endDate: "2026-02-28",
      motivo: "despidoInjustificado",
      include20DiasPorAnio: true,
    });
    const veinte = r.liquidacion.find((l) => l.key === "veinteDias")!;
    expect(veinte.days).toBeCloseTo(60, 0);
  });

  it("resignation with 15+ years includes prima de antigüedad", () => {
    const r = finiquito({ dailySalary: 300, startDate: "2010-01-01", endDate: "2026-01-31", motivo: "renuncia" });
    expect(r.liquidacion.map((l) => l.key)).toEqual(["primaAntiguedad"]);
  });

  it("justified dismissal: prima de antigüedad but no indemnización", () => {
    const r = finiquito({ dailySalary: 300, startDate: "2024-01-01", endDate: "2026-01-31", motivo: "despidoJustificado" });
    expect(r.liquidacion.map((l) => l.key)).toEqual(["primaAntiguedad"]);
  });

  it("rejects end before start", () => {
    expect(() =>
      finiquito({ dailySalary: 300, startDate: "2026-02-01", endDate: "2026-01-01", motivo: "renuncia" }),
    ).toThrow();
  });
});
