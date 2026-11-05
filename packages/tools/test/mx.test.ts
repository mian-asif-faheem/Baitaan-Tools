import { describe, expect, it } from "vitest";
import { aguinaldo, monthlyToDaily } from "../src/mx";

describe("Mexico aguinaldo", () => {
  it("full year, legal minimum of 15 days", () => {
    expect(aguinaldo({ dailySalary: 500, daysWorked: 365 })).toEqual({
      aguinaldoDays: 15,
      fullYearAmount: 7500,
      proportionalAmount: 7500,
    });
  });
  it("proportional for half a year", () => {
    expect(aguinaldo({ dailySalary: 400, daysWorked: 182 }).proportionalAmount).toBe(2991.78);
  });
  it("never below 15 days even if the employer enters less", () => {
    expect(aguinaldo({ dailySalary: 300, daysWorked: 365, aguinaldoDays: 10 }).aguinaldoDays).toBe(15);
  });
  it("honours more generous employer policies", () => {
    expect(aguinaldo({ dailySalary: 300, daysWorked: 365, aguinaldoDays: 30 }).fullYearAmount).toBe(9000);
  });
  it("monthly to daily uses 30 days", () => expect(monthlyToDaily(15000)).toBe(500));
});
