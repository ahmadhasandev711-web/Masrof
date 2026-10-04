import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

import { getClientStatement } from "@/features/clients/statement-data";
import { getWorkspaceReceivablesSummary } from "@/features/invoices/receivables-data";
import { ClientModel } from "@/models/client";
import { InvoiceModel } from "@/models/invoice";
import { InvoicePaymentModel } from "@/models/invoice-payment";

vi.mock("@/models/client", () => ({
  ClientModel: {
    findOne: vi.fn(),
  },
}));

vi.mock("@/models/invoice", () => ({
  InvoiceModel: {
    find: vi.fn(),
  },
}));

vi.mock("@/models/invoice-payment", () => ({
  InvoicePaymentModel: {
    find: vi.fn(),
    aggregate: vi.fn(),
  },
}));

describe("P1.7 — getClientStatement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBranding = {
    name: "Masrofaty HQ",
    businessName: "Acme Agency",
    logoUrl: "https://example.com/logo.png",
    taxId: "TAX-999",
    businessPhone: "+201125030642",
    businessAddress: "Cairo, Egypt",
    currency: "EGP",
  };

  it("returns null if client is not found in the workspace (tenant isolation)", async () => {
    vi.mocked(ClientModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as any);

    const result = await getClientStatement("client-1", "ws-wrong", mockBranding);
    expect(result).toBeNull();
  });

  it("builds a chronological running ledger with correct debit, credit, and running balance", async () => {
    vi.mocked(ClientModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "client-1",
        name: "Client Alpha",
        email: "alpha@example.com",
        phone: "+201111111111",
        workspaceId: "ws-1",
        isArchived: false,
      }),
    } as any);

    // Invoice 1 on Day 1 (1000 EGP), Invoice 2 on Day 3 (2000 EGP)
    const mockInvoices = [
      {
        _id: "inv-1",
        invoiceNumber: "INV-001",
        issueDate: new Date("2026-09-01T10:00:00.000Z"),
        items: [{ description: "UI Design", amount: 100000 }],
        projectId: { name: "Web Redesign" },
        notes: "Deposit due",
      },
      {
        _id: "inv-2",
        invoiceNumber: "INV-002",
        issueDate: new Date("2026-09-03T10:00:00.000Z"),
        items: [{ description: "Frontend Development", amount: 200000 }],
        projectId: { name: "Web Redesign" },
        notes: null,
      },
    ];

    vi.mocked(InvoiceModel.find).mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockInvoices),
      }),
    } as any);

    // Payment on Day 2 for Invoice 1 (500 EGP)
    const mockPayments = [
      {
        _id: "pay-1",
        invoiceId: "inv-1",
        paymentDate: new Date("2026-09-02T12:00:00.000Z"),
        amount: 50000,
        reference: "BANK-TRANSFER-1",
        notes: "Partial payment",
        accountId: { name: "CIB Bank" },
      },
    ];

    vi.mocked(InvoicePaymentModel.find).mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockPayments),
      }),
    } as any);

    const statement = await getClientStatement("client-1", "ws-1", mockBranding);

    expect(statement).not.toBeNull();
    expect(statement?.client.name).toBe("Client Alpha");
    expect(statement?.branding.businessName).toBe("Acme Agency");

    // Total invoiced: 1000 + 2000 = 3000 EGP (300,000 minor)
    expect(statement?.totalInvoiced).toBe(300000);
    // Total paid: 500 EGP (50,000 minor)
    expect(statement?.totalPaid).toBe(50000);
    // Outstanding: 3000 - 500 = 2500 EGP (250,000 minor)
    expect(statement?.currentOutstanding).toBe(250000);

    // Check chronological ordering:
    // 1. Invoice 1 (Day 1): debit 100000, balance 100000
    // 2. Payment 1 (Day 2): credit 50000, balance 50000
    // 3. Invoice 2 (Day 3): debit 200000, balance 250000
    expect(statement?.entries).toHaveLength(3);

    expect(statement?.entries[0]).toMatchObject({
      type: "invoice",
      numberOrRef: "INV-001",
      debit: 100000,
      credit: 0,
      runningBalance: 100000,
    });

    expect(statement?.entries[1]).toMatchObject({
      type: "payment",
      numberOrRef: "BANK-TRANSFER-1",
      debit: 0,
      credit: 50000,
      runningBalance: 50000,
    });

    expect(statement?.entries[2]).toMatchObject({
      type: "invoice",
      numberOrRef: "INV-002",
      debit: 200000,
      credit: 0,
      runningBalance: 250000,
    });
  });
});

describe("P1.8 — getWorkspaceReceivablesSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates receivables, unpaid counts, and overdue amounts correctly", async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const mockInvoices = [
      {
        _id: "inv-overdue",
        items: [{ amount: 15000 }], // 150 EGP
        dueDate: yesterday,
        status: "sent",
      },
      {
        _id: "inv-current",
        items: [{ amount: 20000 }], // 200 EGP
        dueDate: nextWeek,
        status: "sent",
      },
      {
        _id: "inv-legacy-paid",
        items: [{ amount: 10000 }],
        dueDate: yesterday,
        status: "paid", // legacy paid without payment record
      },
    ];

    // mock payment of 5000 on overdue invoice (remaining 10000 overdue)
    const mockPaymentsAggregate = [
      {
        _id: "inv-overdue",
        paidTotal: 5000,
      },
    ];

    vi.mocked(InvoiceModel.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockInvoices),
      }),
    } as any);

    vi.mocked(InvoicePaymentModel.aggregate).mockResolvedValue(mockPaymentsAggregate as any);

    const validWsId = "507f191e810c19729de860ea";
    const summary = await getWorkspaceReceivablesSummary(validWsId);

    // inv-overdue: 15000 - 5000 = 10000 remaining (overdue)
    // inv-current: 20000 - 0 = 20000 remaining (not overdue)
    // inv-legacy-paid: 0 remaining (legacy paid)
    // Total outstanding = 10000 + 20000 = 30000
    // Unpaid count = 2
    // Overdue amount = 10000
    // Overdue count = 1
    expect(summary.totalOutstanding).toBe(30000);
    expect(summary.unpaidCount).toBe(2);
    expect(summary.overdueAmount).toBe(10000);
    expect(summary.overdueCount).toBe(1);
  });

  it("safely returns zeroes when an invalid workspaceId is passed", async () => {
    const summary = await getWorkspaceReceivablesSummary("invalid-non-hex-id");
    expect(summary).toEqual({
      totalOutstanding: 0,
      unpaidCount: 0,
      overdueAmount: 0,
      overdueCount: 0,
    });
  });
});
