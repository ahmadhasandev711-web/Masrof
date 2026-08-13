import { describe, expect, it } from "vitest";
import { computeAccountBalanceMinor } from "@/features/accounts/balance-math";

describe("computeAccountBalanceMinor", () => {
  it("starts from opening balance with no activity", () => {
    expect(
      computeAccountBalanceMinor({
        openingBalance: 10_000,
        incomeTotal: 0,
        expenseTotal: 0,
        transferInTotal: 0,
        transferOutTotal: 0,
      }),
    ).toBe(10_000);
  });

  it("applies income and expense", () => {
    expect(
      computeAccountBalanceMinor({
        openingBalance: 10_000,
        incomeTotal: 5_000,
        expenseTotal: 2_000,
        transferInTotal: 0,
        transferOutTotal: 0,
      }),
    ).toBe(13_000);
  });

  it("includes transfers so recalculate cannot wipe them", () => {
    // Cash opened at 500, spent 100, transferred 200 out, received 50 in
    expect(
      computeAccountBalanceMinor({
        openingBalance: 50_000,
        incomeTotal: 0,
        expenseTotal: 10_000,
        transferInTotal: 5_000,
        transferOutTotal: 20_000,
      }),
    ).toBe(25_000);
  });

  it("can go negative when expenses/transfers exceed opening", () => {
    expect(
      computeAccountBalanceMinor({
        openingBalance: 1_000,
        incomeTotal: 0,
        expenseTotal: 2_000,
        transferInTotal: 0,
        transferOutTotal: 500,
      }),
    ).toBe(-1_500);
  });
});
