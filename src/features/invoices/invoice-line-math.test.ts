import { describe, expect, it } from "vitest";
import {
  computeInvoiceTotals,
  lineFromMajorInput,
  normalizeInvoiceLine,
  resolveInvoiceTotals,
} from "@/features/invoices/invoice-line-math";

describe("invoice-line-math", () => {
  it("normalizes legacy lines without quantity/unitPrice", () => {
    expect(normalizeInvoiceLine({ description: "A", amount: 5000 })).toEqual({
      description: "A",
      quantity: 1,
      unitPrice: 5000,
      amount: 5000,
    });
  });

  it("builds amount from quantity * unitPrice (major → minor)", () => {
    const line = lineFromMajorInput({
      description: "Service",
      quantity: 2,
      unitPrice: 10.5,
    });
    expect(line.unitPrice).toBe(1050);
    expect(line.amount).toBe(2100);
  });

  it("keeps tax off by default", () => {
    const totals = computeInvoiceTotals([{ amount: 10000 }], { taxEnabled: false, taxRatePercent: 14 });
    expect(totals.taxAmount).toBe(0);
    expect(totals.total).toBe(10000);
  });

  it("applies tax when enabled", () => {
    const totals = computeInvoiceTotals([{ amount: 10000 }], { taxEnabled: true, taxRatePercent: 14 });
    expect(totals.subtotal).toBe(10000);
    expect(totals.taxAmount).toBe(1400);
    expect(totals.total).toBe(11400);
  });

  it("resolves stored totals for legacy docs from items only", () => {
    const money = resolveInvoiceTotals({
      items: [{ description: "x", amount: 2500 }],
    });
    expect(money.total).toBe(2500);
    expect(money.taxEnabled).toBe(false);
  });
});
