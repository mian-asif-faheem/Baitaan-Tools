import { describe, expect, it } from "vitest";
import { decimoTerceiroGross, inss, netSalary } from "../src/br";

// Expected values from published 2026 worked examples (Buk, Razonet, VISU, Tributo Devido).
describe("Brazil 2026 INSS", () => {
  it("R$ 5.000 → R$ 501,51", () => expect(inss(5000)).toBe(501.51));
  it("R$ 6.000 → R$ 641,51", () => expect(inss(6000)).toBe(641.51));
  it("caps at the ceiling: R$ 988,09", () => expect(inss(20000)).toBe(988.09));
  it("minimum wage ≈ R$ 121,58", () => expect(inss(1621)).toBeCloseTo(121.58, 1));
});

describe("Brazil 2026 salário líquido", () => {
  it("R$ 5.000 is IR-exempt → R$ 4.498,49", () => {
    const r = netSalary({ gross: 5000 });
    expect(r.irrf).toBe(0);
    expect(r.net).toBe(4498.49);
  });
  it("R$ 6.000 gets the partial reduction → IRRF R$ 385,10, net R$ 4.973,39", () => {
    const r = netSalary({ gross: 6000 });
    expect(r.irTable).toBe(564.85);
    expect(r.irReduction).toBe(179.75);
    expect(r.irrf).toBe(385.1);
    expect(r.net).toBe(4973.39);
  });
  it("R$ 4.000 with 2 dependents → R$ 3.631,40", () => {
    expect(netSalary({ gross: 4000, dependents: 2 }).net).toBe(3631.4);
  });
  it("R$ 12.122,73 above the INSS ceiling → net R$ 8.981,34", () => {
    const r = netSalary({ gross: 12122.73 });
    expect(r.irrf).toBe(2153.3);
    expect(r.net).toBe(8981.34);
  });
});

describe("13º salário", () => {
  it("full year of R$ 3.000", () => expect(decimoTerceiroGross(3000, 12)).toEqual({ gross: 3000, firstInstallment: 1500 }));
  it("7 months of R$ 2.400", () => expect(decimoTerceiroGross(2400, 7).gross).toBe(1400));
});
