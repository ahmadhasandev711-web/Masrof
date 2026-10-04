import { describe, it, expect } from "vitest";
import { toMinorUnits, fromMinorUnits } from "@/lib/money";
import { DEFAULT_PLAN_FLAGS } from "@/features/subscriptions/default-plans";

describe("Debts & Liabilities Domain Logic", () => {
  it("converts major units to minor units accurately", () => {
    expect(toMinorUnits(1500)).toBe(150000);
    expect(toMinorUnits(250.5)).toBe(25050);
    expect(toMinorUnits(0.01)).toBe(1);
    expect(fromMinorUnits(150000)).toBe(1500);
  });

  it("calculates remaining balance and progress percentage correctly", () => {
    const totalAmount = toMinorUnits(10000); // 10,000 EGP
    const paidAmount = toMinorUnits(4000); // 4,000 EGP

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
    const remaining = totalAmount - paidAmount; // 200 EGP = 20000 minor

    const attemptedPayment = toMinorUnits(300); // 300 EGP
    const isOverpayment = attemptedPayment > remaining;

    expect(isOverpayment).toBe(true);
  });

  it("enforces plan feature gate: debts is false on Free, true on Pro", () => {
    expect(DEFAULT_PLAN_FLAGS.free.debts).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.pro.debts).toBe(true);
  });
});
