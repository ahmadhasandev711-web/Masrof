import { describe, expect, it } from "vitest";
import { resolveInvoiceDisplayStatus } from "@/features/invoices/status";

describe("resolveInvoiceDisplayStatus", () => {
  it("keeps paid and draft as-is", () => {
    expect(
      resolveInvoiceDisplayStatus({
        status: "paid",
        dueDate: "2020-01-01",
      }),
    ).toBe("paid");
    expect(
      resolveInvoiceDisplayStatus({
        status: "draft",
        dueDate: "2020-01-01",
      }),
    ).toBe("draft");
  });

  it("marks sent invoices past due as overdue", () => {
    expect(
      resolveInvoiceDisplayStatus({
        status: "sent",
        dueDate: "2020-01-01",
        now: new Date("2026-08-10"),
      }),
    ).toBe("overdue");
  });

  it("keeps future due dates as sent", () => {
    expect(
      resolveInvoiceDisplayStatus({
        status: "sent",
        dueDate: "2099-01-01",
        now: new Date("2026-08-10"),
      }),
    ).toBe("sent");
  });
});
