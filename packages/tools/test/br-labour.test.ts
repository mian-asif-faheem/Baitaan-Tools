import { describe, expect, it } from "vitest";
import {
  avisoPrevioDays,
  decimoTerceiro,
  ferias,
  feriasDays,
  horasExtras,
  netSalary,
  rescisao,
  salarioProporcional,
} from "../src/br";

describe("refactor keeps salário líquido results", () => {
  it("R$ 6.000 → R$ 4.973,39", () => expect(netSalary({ gross: 6000 }).net).toBe(4973.39));
});

describe("férias (examples published by VISU, 2026)", () => {
  it("absence table, CLT art. 130", () => {
    expect([0, 5, 6, 14, 15, 23, 24, 32, 33].map(feriasDays)).toEqual([30, 30, 24, 24, 18, 18, 12, 12, 0]);
  });
  it("R$ 3.000, 30 days → net R$ 3.631,40 (IR zeroed by the 2026 reduction)", () => {
    const r = ferias({ monthlySalary: 3000 });
    expect(r.gross).toBe(4000);
    expect(r.inss).toBe(368.6);
    expect(r.irTable).toBe(114.76);
    expect(r.irrf).toBe(0);
    expect(r.net).toBe(3631.4);
  });
  it("R$ 2.500 with 10 absences → 24 days, net R$ 2.450,98", () => {
    const r = ferias({ monthlySalary: 2500, absences: 10 });
    expect(r.restDays).toBe(24);
    expect(r.inss).toBe(215.69);
    expect(r.net).toBe(2450.98);
  });
  it("R$ 6.000 selling 10 days: abono and its 1/3 are untaxed", () => {
    const r = ferias({ monthlySalary: 6000, daysSold: 10 });
    expect(r.feriasPay).toBe(4000);
    expect(r.tercoFerias).toBe(1333.33);
    expect(r.abono).toBe(2000);
    expect(r.tercoAbono).toBe(666.67);
    expect(r.inss).toBe(548.18);
    // IR only on 5.333,33: (5.333,33 − 607,20) × 27,5% − 908,73 = 390,96; reduction 978,62 − 0,133145 × 5.333,33 = 268,51.
    expect(r.irTable).toBe(390.96);
    expect(r.irReduction).toBe(268.51);
    expect(r.irrf).toBe(122.45);
    expect(r.gross).toBe(8000);
    expect(r.net).toBe(7329.37); // VISU shows 7.057,28 because it taxes the 1/3 of the abono
  });
  it("cannot sell more than 1/3 of the days", () => {
    expect(ferias({ monthlySalary: 3000, daysSold: 20 }).daysSold).toBe(10);
  });
  it("reduction can be switched off", () => {
    expect(ferias({ monthlySalary: 3000, applyReduction: false }).irrf).toBe(114.76);
  });
});

describe("13º salário 2026", () => {
  it("R$ 3.000, full year: 1st installment R$ 1.500; IR zero (gross ≤ R$ 5 mil)", () => {
    const r = decimoTerceiro({ monthlySalary: 3000, monthsWorked: 12 });
    expect(r.firstInstallment).toBe(1500);
    expect(r.inss).toBe(248.6);
    expect(r.irrf).toBe(0);
    expect(r.secondInstallment).toBe(1251.4);
    expect(r.net).toBe(2751.4);
  });
  it("R$ 10.000: no simplified discount, no reduction above R$ 7.350", () => {
    const r = decimoTerceiro({ monthlySalary: 10000, monthsWorked: 12 });
    expect(r.inss).toBe(988.09);
    // (10.000 − 988,09) × 27,5% − 908,73
    expect(r.irrf).toBeCloseTo((10000 - 988.09) * 0.275 - 908.73, 1);
  });
  it("R$ 6.000: partial reduction applies to the 13º (Lei 15.270, art. 3-A § 3)", () => {
    const r = decimoTerceiro({ monthlySalary: 6000, monthsWorked: 12 });
    expect(r.irReduction).toBeGreaterThan(0);
    expect(r.irReduction).toBeCloseTo(978.62 - 0.133145 * 6000, 1);
  });
  it("7 months of R$ 2.400 → gross R$ 1.400", () => {
    expect(decimoTerceiro({ monthlySalary: 2400, monthsWorked: 7 }).gross).toBe(1400);
  });
});

describe("horas extras (Patrimo example: R$ 2.200, divisor 220)", () => {
  it("hour R$ 10; 50% = R$ 15; 100% = R$ 20", () => {
    const r = horasExtras({ monthlySalary: 2200, hours50: 10, hours100: 4, workingDays: 25, restDays: 5 });
    expect(r.hourly).toBe(10);
    expect(r.overtimeRate).toBe(15);
    expect(r.he50).toBe(150);
    expect(r.he100).toBe(80);
    expect(r.dsr).toBe(46); // (150 + 80) / 25 × 5
    expect(r.total).toBe(276);
  });
  it("7 clock hours at night = 8 paid hours; premium R$ 2 × 8 = R$ 16", () => {
    const r = horasExtras({ monthlySalary: 2200, nightClockHours: 7, restDays: 0 });
    expect(r.nightPaidHours).toBe(8);
    expect(r.night).toBe(16);
  });
});

describe("aviso prévio, Lei 12.506/2011", () => {
  it("30 + 3 per year, max 90", () => {
    expect([0, 1, 2, 10, 20, 30].map(avisoPrevioDays)).toEqual([30, 33, 36, 60, 90, 90]);
  });
});

describe("rescisão (Razonet example: R$ 3.000, 01/03/2024 → 15/08/2026)", () => {
  const base = { monthlySalary: 3000, startDate: "2024-03-01", endDate: "2026-08-15", feriasVencidas: 1, fgtsBalance: 7200 };
  const amounts = (r: ReturnType<typeof rescisao>) => Object.fromEntries(r.lines.map((l) => [l.key, l.amount]));

  it("sem justa causa: 36 days' notice projects 13º to 9/12 and férias to 7/12", () => {
    const r = rescisao({ ...base, tipo: "semJustaCausa" });
    const a = amounts(r);
    expect(r.avisoDays).toBe(36);
    expect(a.saldo).toBe(1500); // 15 days, commercial month of 30 days
    expect(a.aviso).toBe(3600);
    expect(a.decimo).toBe(2250);
    expect(a.feriasProp).toBe(1750);
    expect(a.tercoProp).toBe(583.33);
    expect(a.feriasVencidas).toBe(3000);
    expect(a.tercoVencidas).toBe(1000);
    // 40% of the balance plus this month's deposits on saldo, 13º and notice.
    expect(r.fgts.fine).toBe(Math.round(0.4 * (7200 + 0.08 * (1500 + 2250 + 3600)) * 100) / 100);
    expect(r.seguroDesemprego).toBe(true);
    expect(r.fgts.withdrawRate).toBe(1);
  });

  it("pedido de demissão without working the notice: no fine, 30 days deducted", () => {
    const r = rescisao({ ...base, tipo: "pedidoDemissao", avisoIndenizado: true });
    const a = amounts(r);
    expect(a.aviso).toBeUndefined();
    expect(a.decimo).toBe(2000); // 8/12, no projection
    expect(a.feriasProp).toBe(1500); // 6/12
    expect(r.deductions.find((d) => d.key === "avisoDesconto")?.amount).toBe(3000);
    expect(r.fgts.fine).toBe(0);
    expect(r.seguroDesemprego).toBe(false);
  });

  it("justa causa: only saldo and férias vencidas", () => {
    const r = rescisao({ ...base, tipo: "justaCausa" });
    expect(r.lines.map((l) => l.key)).toEqual(["saldo", "feriasVencidas", "tercoVencidas"]);
    expect(r.fgts.fine).toBe(0);
  });

  it("acordo: half the notice, 20% fine, 80% withdrawal", () => {
    const r = rescisao({ ...base, tipo: "acordo" });
    expect(r.avisoDays).toBe(18);
    expect(amounts(r).aviso).toBe(1800);
    expect(r.fgts.fineRate).toBe(0.2);
    expect(r.fgts.withdrawRate).toBe(0.8);
  });

  it("estimates the FGTS balance when not given", () => {
    const r = rescisao({ monthlySalary: 3000, startDate: "2024-03-01", endDate: "2026-08-15", tipo: "semJustaCausa" });
    expect(r.fgts.estimated).toBe(true);
    expect(r.fgts.balance).toBeGreaterThan(7000);
    expect(r.fgts.balance).toBeLessThan(8000);
  });

  it("first-year dismissal: proportional months from the start date", () => {
    const r = rescisao({ monthlySalary: 2000, startDate: "2026-02-10", endDate: "2026-06-30", tipo: "semJustaCausa", avisoIndenizado: false });
    const a = amounts(r);
    // Feb 10–28 = 19 days (counts), Mar–Jun → 5/12 for 13º; férias 10/02 → 30/06 = 4 months + 21 days → 5/12.
    expect(r.lines.find((l) => l.key === "decimo")!.detail).toBe("5/12");
    expect(r.lines.find((l) => l.key === "feriasProp")!.detail).toBe("5/12");
    expect(a.aviso).toBeUndefined();
  });
});

describe("salário proporcional", () => {
  it("R$ 3.000 for 12 days → R$ 1.200", () => {
    expect(salarioProporcional({ monthlySalary: 3000, daysWorked: 12 }).total).toBe(1200);
  });
  it("one absence also loses the week's DSR", () => {
    const r = salarioProporcional({ monthlySalary: 3000, daysWorked: 30, absences: 1, weeksWithAbsence: 1 });
    expect(r.total).toBe(2800);
  });
});

describe("rescisão edge cases", () => {
  it("pays a whole February as a whole month of salary", () => {
    const r = rescisao({ monthlySalary: 3000, startDate: "2024-01-10", endDate: "2026-02-28", tipo: "pedidoDemissao", avisoIndenizado: false });
    expect(r.lines.find((l) => l.key === "saldo")!.amount).toBe(3000);
  });
  it("pays part of February by the days worked", () => {
    const r = rescisao({ monthlySalary: 3000, startDate: "2024-01-10", endDate: "2026-02-20", tipo: "pedidoDemissao", avisoIndenizado: false });
    expect(r.lines.find((l) => l.key === "saldo")!.amount).toBe(2000);
  });
  it("counts vacation months from a 31st start date by calendar months", () => {
    // 31 Jan → 30 Jun is 5 whole months (31 Jan–27 Feb, 28 Feb–30 Mar, …) plus a short remainder.
    const r = rescisao({ monthlySalary: 3000, startDate: "2026-01-31", endDate: "2026-06-30", tipo: "pedidoDemissao", avisoIndenizado: false });
    expect(r.lines.find((l) => l.key === "feriasProp")!.detail).toBe("5/12");
  });
});
