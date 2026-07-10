import { describe, expect, it } from "vitest";
import { parseReceiptText } from "@/features/receipts/parse-receipt-text";

describe("parseReceiptText", () => {
  it("extracts total amount and date from English receipt text", () => {
    const result = parseReceiptText(`
      Carrefour Market
      Date: 2026-03-15
      Subtotal 120.00
      TOTAL: EGP 156.50
    `);

    expect(result.amount).toBe(156.5);
    expect(result.transactionDate).toBe("2026-03-15");
    expect(result.merchant).toBeTruthy();
  });

  it("extracts Arabic total labels", () => {
    const result = parseReceiptText(`
      سوبر ماركت
      10/07/2026
      الإجمالي 245.75 ج.م
    `);

    expect(result.amount).toBe(245.75);
    expect(result.transactionDate).toBe("2026-07-10");
  });
});
