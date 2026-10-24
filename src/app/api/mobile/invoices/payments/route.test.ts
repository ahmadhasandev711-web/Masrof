import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const paymentMocks = vi.hoisted(() => {
  class InvoiceOverpaymentError extends Error {
    readonly code = "invoiceOverpayment";
    readonly remainingAmount: number;
    constructor(remainingAmount: number) {
      super(`Payment exceeds remaining ${remainingAmount}`);
      this.name = "InvoiceOverpaymentError";
      this.remainingAmount = remainingAmount;
    }
  }

  return {
    InvoiceOverpaymentError,
    recordInvoicePayment: vi.fn(),
  };
});

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/features/invoices/payment-data", () => ({
  ...paymentMocks,
  InvoiceCancelledError: class extends Error {
    readonly code = "invoiceCancelled";
  },
  AccountCurrencyMismatchError: class extends Error {
    readonly code = "accountCurrencyMismatch";
  },
  InvalidPaymentReferenceError: class extends Error {
    readonly code = "invalidPaymentReference";
  },
}));

vi.mock("@/lib/mobile/session", () => ({
  requireMobileSession: vi.fn(),
  requireMobileWorkspace: vi.fn(),
  mobileErrorResponse: vi.fn(),
  serializeId: (value: unknown) => String(value),
}));

import { POST } from "./route";
import { recordInvoicePayment, InvoiceOverpaymentError } from "@/features/invoices/payment-data";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";

const mockedSession = vi.mocked(requireMobileSession);
const mockedWorkspace = vi.mocked(requireMobileWorkspace);
const mockedRecord = vi.mocked(recordInvoicePayment);

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/mobile/invoices/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  workspaceId: "ws-1",
  invoiceId: "inv-1",
  accountId: "acc-1",
  amount: 100,
  paymentDate: "2026-01-15",
  idempotencyKey: "idem-1",
};

describe("POST /api/mobile/invoices/payments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session is missing", async () => {
    mockedSession.mockResolvedValue(NextResponse.json({ error: "unauthorized" }, { status: 401 }));

    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(401);
    expect(mockedRecord).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid payload", async () => {
    mockedSession.mockResolvedValue({
      user: { id: "user-1", name: "Test", email: "t@example.com" },
    });

    const res = await POST(jsonRequest({ workspaceId: "ws-1" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalidData");
    expect(mockedWorkspace).not.toHaveBeenCalled();
  });

  it("returns workspace access error without recording payment", async () => {
    mockedSession.mockResolvedValue({
      user: { id: "user-1", name: "Test", email: "t@example.com" },
    });
    mockedWorkspace.mockResolvedValue(
      NextResponse.json({ error: "writeDenied" }, { status: 403 }),
    );

    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(403);
    expect(mockedRecord).not.toHaveBeenCalled();
  });

  it("records payment and returns payment id", async () => {
    mockedSession.mockResolvedValue({
      user: { id: "user-1", name: "Test", email: "t@example.com" },
    });
    mockedWorkspace.mockResolvedValue({
      workspace: { _id: "ws-1" },
      workspaceId: "ws-1",
    });
    mockedRecord.mockResolvedValue({ _id: "pay-99" } as never);

    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.paymentId).toBe("pay-99");
    expect(mockedRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws-1",
        invoiceId: "inv-1",
        accountId: "acc-1",
        amount: 100,
        idempotencyKey: "idem-1",
      }),
      "user-1",
    );
  });

  it("maps invoice overpayment to 400 with error code", async () => {
    mockedSession.mockResolvedValue({
      user: { id: "user-1", name: "Test", email: "t@example.com" },
    });
    mockedWorkspace.mockResolvedValue({
      workspace: { _id: "ws-1" },
      workspaceId: "ws-1",
    });
    mockedRecord.mockRejectedValue(new InvoiceOverpaymentError(50));

    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invoiceOverpayment");
  });
});
