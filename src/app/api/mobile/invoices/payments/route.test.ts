import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("server-only", () => ({}));

const paymentMocks = vi.hoisted(() => {
  class InvoiceOverpaymentError extends Error {
    readonly code = "invoiceOverpayment";
    readonly status = 400;
    readonly remainingAmount: number;
    constructor(remainingAmount: number) {
      super(`Payment exceeds remaining ${remainingAmount}`);
      this.name = "InvoiceOverpaymentError";
      this.remainingAmount = remainingAmount;
    }
  }

  return {
    InvoiceOverpaymentError,
    recordPayment: vi.fn(),
  };
});

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/features/invoices/invoices.service", () => ({
  invoicesService: {
    recordPayment: paymentMocks.recordPayment,
  },
}));

vi.mock("@/server/kernel", () => ({
  resultToResponse: (result: { ok: boolean; error?: { code: string; message: string; status?: number }; value?: unknown }) => {
    if (!result.ok && result.error) {
      return NextResponse.json(
        { error: result.error.code, message: result.error.message },
        { status: result.error.status ?? 400 },
      );
    }
    return NextResponse.json(result.value);
  },
  thrownToMobileResponse: () =>
    NextResponse.json({ error: "unexpected" }, { status: 500 }),
}));

vi.mock("@/lib/mobile/session", () => ({
  requireMobileSession: vi.fn(),
  requireMobileWorkspace: vi.fn(),
  mobileErrorResponse: vi.fn(),
  serializeId: (value: unknown) => String(value),
}));

import { POST } from "./route";
import { invoicesService } from "@/features/invoices/invoices.service";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";

const mockedSession = vi.mocked(requireMobileSession);
const mockedWorkspace = vi.mocked(requireMobileWorkspace);
const mockedRecord = vi.mocked(invoicesService.recordPayment);

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
      workspace: { _id: "ws-1" } as never,
      workspaceId: "ws-1",
    });
    mockedRecord.mockResolvedValue({ ok: true, value: { _id: "pay-99" } } as never);

    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.paymentId).toBe("pay-99");
    expect(mockedRecord).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        workspaceId: "ws-1",
        invoiceId: "inv-1",
        accountId: "acc-1",
        amount: 100,
        idempotencyKey: "idem-1",
      }),
    );
  });

  it("maps invoice overpayment to 400 with error code", async () => {
    mockedSession.mockResolvedValue({
      user: { id: "user-1", name: "Test", email: "t@example.com" },
    });
    mockedWorkspace.mockResolvedValue({
      workspace: { _id: "ws-1" } as never,
      workspaceId: "ws-1",
    });
    mockedRecord.mockResolvedValue({
      ok: false,
      error: new paymentMocks.InvoiceOverpaymentError(50),
    } as never);

    const res = await POST(jsonRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invoiceOverpayment");
  });
});
