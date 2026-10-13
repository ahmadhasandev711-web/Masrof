import { describe, expect, it } from "vitest";
import {
  addMoney,
  formatMoney,
  fromMinorUnits,
  subtractMoney,
  toMinorUnits,
} from "@/lib/money";

describe("toMinorUnits", () => {
  it("converts decimal EGP to piastres", () => {
    expect(toMinorUnits(100.5)).toBe(10050);
    expect(toMinorUnits("250.75")).toBe(25075);
  });

  it("rounds floating point input safely", () => {
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
  });

  it("rejects invalid input", () => {
    expect(() => toMinorUnits("abc")).toThrow();
  });
});

describe("fromMinorUnits", () => {
  it("converts piastres back to decimal", () => {
    expect(fromMinorUnits(10050)).toBe(100.5);
  });
});

describe("money arithmetic", () => {
  it("adds minor units without float drift", () => {
    expect(addMoney(100, 50, 25)).toBe(175);
  });

  it("subtracts minor units", () => {
    expect(subtractMoney(1000, 300, 200)).toBe(500);
  });
});

describe("formatMoney", () => {
  it("formats EGP in Arabic locale with standard Latin numerals", () => {
    const formatted = formatMoney(10050, { currency: "EGP", locale: "ar-EG" });
    expect(formatted).toMatch(/ج\.م/);
    expect(formatted).toContain("100.5");
    expect(formatted).not.toMatch(/[٠-٩]/);
  });

  it("formats EGP in English locale with Latin numerals", () => {
    const formatted = formatMoney(10050, { currency: "EGP", locale: "en" });
    expect(formatted).toContain("100.5");
    expect(formatted).toMatch(/EGP/);
  });
});

describe("balance delta logic", () => {
  function balanceDelta(type: "income" | "expense", amountMinorUnits: number): number {
    return type === "income" ? amountMinorUnits : -amountMinorUnits;
  }

  it("income increases balance", () => {
    expect(balanceDelta("income", 5000)).toBe(5000);
  });

  it("expense decreases balance", () => {
    expect(balanceDelta("expense", 5000)).toBe(-5000);
  });

  it("transfer-neutral: income + expense on different accounts nets to zero workspace change", () => {
    const income = balanceDelta("income", 10000);
    const expense = balanceDelta("expense", 10000);
    expect(income + expense).toBe(0);
  });
});
