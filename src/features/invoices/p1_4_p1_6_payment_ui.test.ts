import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { recordInvoicePaymentAction } from "@/features/invoices/actions/record-payment";
import { getInvoicePaymentsAction } from "@/features/invoices/actions/get-invoice-payments";
import {
  recordInvoicePayment,
  getInvoicePayments,
  InvoiceOverpaymentError,
} from "@/features/invoices/payment-data";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess, verifyWorkspaceAccess } from "@/features/workspaces/access";

vi.mock("@/features/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/features/workspaces/access", () => ({
  verifyWorkspaceWriteAccess: vi.fn().mockResolvedValue(undefined),
  verifyWorkspaceAccess: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/invoices/payment-data", () => ({
  recordInvoicePayment: vi.fn(),
  getInvoicePayments: vi.fn(),
  InvoiceOverpaymentError: class extends Error {
    readonly code = "invoiceOverpayment";
    constructor() {
      super("Overpayment");
      this.name = "InvoiceOverpaymentError";
    }
  },
  InvoiceCancelledError: class extends Error {
    readonly code = "invoiceCancelledCannotPay";
  },
  AccountCurrencyMismatchError: class extends Error {
    readonly code = "accountCurrencyMismatch";
  },
  InvalidPaymentReferenceError: class extends Error {
    readonly code: string;
    constructor(c: string) {
      super(c);
      this.code = c;
    }
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockImplementation((ns: string) => {
    return (key: string) => `${ns}.${key}`;
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe("P1.6 — recordInvoicePaymentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireSession).mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    } as any);
  });

  it("returns error on invalid input (e.g. missing amount or negative amount)", async () => {
    const formData = new FormData();
    formData.set("workspaceId", "ws-1");
    formData.set("invoiceId", "inv-1");
    formData.set("accountId", "acc-1");
    formData.set("amount", "-50"); // invalid
    formData.set("paymentDate", "2026-09-17");
    formData.set("idempotencyKey", "key-123");

    const result = await recordInvoicePaymentAction({ error: null }, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(recordInvoicePayment).not.toHaveBeenCalled();
  });

  it("successfully invokes domain service and returns success", async () => {
    vi.mocked(recordInvoicePayment).mockResolvedValue({
      _id: "pay-1",
    } as any);

    const formData = new FormData();
    formData.set("workspaceId", "ws-1");
    formData.set("invoiceId", "inv-1");
    formData.set("accountId", "acc-1");
    formData.set("amount", "250.00");
    formData.set("paymentDate", "2026-09-17");
    formData.set("paymentMethod", "bank_transfer");
    formData.set("idempotencyKey", "key-uuid-ok");

    const result = await recordInvoicePaymentAction({ error: null }, formData);
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(verifyWorkspaceWriteAccess).toHaveBeenCalledWith("user-1", "ws-1");
    expect(recordInvoicePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws-1",
        invoiceId: "inv-1",
        accountId: "acc-1",
        amount: 250,
        idempotencyKey: "key-uuid-ok",
      }),
      "user-1",
    );
  });

  it("handles domain error (e.g. InvoiceOverpaymentError) and returns localized error", async () => {
    vi.mocked(recordInvoicePayment).mockRejectedValue(new InvoiceOverpaymentError(100));

    const formData = new FormData();
    formData.set("workspaceId", "ws-1");
    formData.set("invoiceId", "inv-1");
    formData.set("accountId", "acc-1");
    formData.set("amount", "9999");
    formData.set("paymentDate", "2026-09-17");
    formData.set("idempotencyKey", "key-overpay");

    const result = await recordInvoicePaymentAction({ error: null }, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("errors.invoiceOverpayment");
  });
});

describe("P1.6 — getInvoicePaymentsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireSession).mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    } as any);
  });

  it("verifies read access and returns payment list", async () => {
    const mockPayments = [
      {
        _id: "p-1",
        invoiceId: "inv-1",
        amount: 5000,
        paymentDate: "2026-09-17T00:00:00.000Z",
      },
    ];
    vi.mocked(getInvoicePayments).mockResolvedValue(mockPayments as any);

    const result = await getInvoicePaymentsAction("inv-1", "ws-1");
    expect(result.error).toBeNull();
    expect(result.payments).toEqual(mockPayments);
    expect(verifyWorkspaceAccess).toHaveBeenCalledWith("user-1", "ws-1");
  });
});
