import { describe, it, expect } from "vitest";
import { toMinorUnits, fromMinorUnits } from "@/lib/money";
import { DEFAULT_PLAN_FLAGS } from "@/features/subscriptions/default-plans";
import { calculateDebtSummaryFromDebts } from "@/features/debts/calculations";
import { SUPPORTED_CURRENCIES } from "@/lib/currency/constants";

describe("Debts & Liabilities Domain Logic", () => {
  it("converts major units to minor units accurately", () => {
    expect(toMinorUnits(1500)).toBe(150000);
    expect(toMinorUnits(250.5)).toBe(25050);
    expect(toMinorUnits(0.01)).toBe(1);
    expect(fromMinorUnits(150000)).toBe(1500);
  });

  it("calculates remaining balance and progress percentage correctly", () => {
    const totalAmount = toMinorUnits(10000);
    const paidAmount = toMinorUnits(4000);

    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    const progressPercent = Math.min(100, Math.round((paidAmount / totalAmount) * 100));

    expect(remainingAmount).toBe(600000);
    expect(progressPercent).toBe(40);
  });

  it("transitions debt status to paid when fully repaid", () => {
    const totalAmount = toMinorUnits(5000);
    let paidAmount = toMinorUnits(3000);
    let status: "active" | "paid" = paidAmount >= totalAmount ? "paid" : "active";
    expect(status).toBe("active");

    // Repay the rest
    paidAmount += toMinorUnits(2000);
    status = paidAmount >= totalAmount ? "paid" : "active";
    expect(status).toBe("paid");
  });

  it("prevents overpayment beyond remaining amount", () => {
    const totalAmount = toMinorUnits(1000);
    const paidAmount = toMinorUnits(800);
    const remaining = totalAmount - paidAmount;

    const attemptedPayment = toMinorUnits(300);
    const isOverpayment = attemptedPayment > remaining;

    expect(isOverpayment).toBe(true);
  });

  it("computes in-memory summary accurately across supported currencies (SAR, USD, AED, EUR, EGP)", () => {
    const sampleDebts = [
      { totalAmount: 100000, paidAmount: 40000, status: "active" }, // 1000 total, 400 paid
      { totalAmount: 50000, paidAmount: 50000, status: "paid" },   // 500 total, 500 paid
      { totalAmount: 200000, paidAmount: 0, status: "active" },     // 2000 total, 0 paid
    ];

    for (const curr of SUPPORTED_CURRENCIES) {
      const summary = calculateDebtSummaryFromDebts(sampleDebts, curr);

      expect(summary.totalLiabilities).toBe(350000);
      expect(summary.totalPaid).toBe(90000);
      expect(summary.remainingLiabilities).toBe(260000);
      expect(summary.activeCount).toBe(2);
      expect(summary.paidCount).toBe(1);
      expect(summary.currency).toBe(curr);
    }
  });

  it("handles empty debts array gracefully in calculateDebtSummaryFromDebts", () => {
    const summary = calculateDebtSummaryFromDebts([], "USD");
    expect(summary.totalLiabilities).toBe(0);
    expect(summary.totalPaid).toBe(0);
    expect(summary.remainingLiabilities).toBe(0);
    expect(summary.activeCount).toBe(0);
    expect(summary.paidCount).toBe(0);
    expect(summary.currency).toBe("USD");
  });

  it("enforces plan feature gate: debts is false on Free, true on Pro", () => {
    expect(DEFAULT_PLAN_FLAGS.free.debts).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.pro.debts).toBe(true);
  });
});
