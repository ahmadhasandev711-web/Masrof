import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { recordInvoicePaymentAction } from "@/features/invoices/actions/record-payment";
import { getInvoicePaymentsAction } from "@/features/invoices/actions/get-invoice-payments";
import { invoicesService } from "@/features/invoices/invoices.service";
import { InvoiceOverpaymentError } from "@/features/invoices/invoices.errors";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceAccess } from "@/features/workspaces/access";
import { runWorkspaceWrite } from "@/server/kernel";

vi.mock("@/features/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/features/workspaces/access", () => ({
  verifyWorkspaceWriteAccess: vi.fn().mockResolvedValue({ _id: "ws-1" }),
  verifyWorkspaceAccess: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/invoices/invoices.service", () => ({
  invoicesService: {
    recordPayment: vi.fn(),
    listPayments: vi.fn(),
  },
}));

vi.mock("@/server/kernel", () => ({
  runWorkspaceWrite: vi.fn(async (_workspaceId: string, work: (ctx: { userId: string }) => unknown) => {
    return work({ userId: "user-1" });
  }),
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
    vi.mocked(runWorkspaceWrite).mockImplementation(async (_workspaceId, work) =>
      work({ userId: "user-1", workspaceId: "ws-1", workspace: {} as never }),
    );
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
    expect(invoicesService.recordPayment).not.toHaveBeenCalled();
  });

  it("successfully invokes domain service and returns success", async () => {
    vi.mocked(invoicesService.recordPayment).mockResolvedValue({
      ok: true,
      value: { _id: "pay-1" },
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
    expect(runWorkspaceWrite).toHaveBeenCalledWith("ws-1", expect.any(Function));
    expect(invoicesService.recordPayment).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        workspaceId: "ws-1",
        invoiceId: "inv-1",
        accountId: "acc-1",
        amount: 250,
        idempotencyKey: "key-uuid-ok",
      }),
    );
  });

  it("handles domain error (e.g. InvoiceOverpaymentError) and returns localized error", async () => {
    vi.mocked(invoicesService.recordPayment).mockResolvedValue({
      ok: false,
      error: new InvoiceOverpaymentError(100),
    });

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
    vi.mocked(invoicesService.listPayments).mockResolvedValue(mockPayments as any);

    const result = await getInvoicePaymentsAction("inv-1", "ws-1");
    expect(result.error).toBeNull();
    expect(result.payments).toEqual(mockPayments);
    expect(verifyWorkspaceAccess).toHaveBeenCalledWith("user-1", "ws-1");
  });
});
