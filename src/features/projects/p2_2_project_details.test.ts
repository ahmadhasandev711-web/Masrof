import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

import { getProjectFinancialDetails } from "@/features/projects/project-details-data";
import { ProjectModel } from "@/models/project";
import { ClientModel } from "@/models/client";
import { InvoiceModel } from "@/models/invoice";
import { InvoicePaymentModel } from "@/models/invoice-payment";
import { TransactionModel } from "@/models/transaction";

vi.mock("@/models/project", () => ({
  ProjectModel: {
    findOne: vi.fn(),
  },
}));

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
    aggregate: vi.fn(),
  },
}));

vi.mock("@/models/transaction", () => ({
  TransactionModel: {
    find: vi.fn(),
  },
}));

describe("Slice P2.2 — getProjectFinancialDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validWsId = "507f191e810c19729de860ea";
  const validProjectId = "507f1f77bcf86cd799439011";

  it("returns null on invalid ObjectId inputs", async () => {
    const res1 = await getProjectFinancialDetails("invalid-id", validWsId);
    expect(res1).toBeNull();

    const res2 = await getProjectFinancialDetails(validProjectId, "invalid-ws-id");
    expect(res2).toBeNull();
  });

  it("returns null when project is not found in the workspace (tenant isolation)", async () => {
    vi.mocked(ProjectModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as any);

    const result = await getProjectFinancialDetails(validProjectId, validWsId);
    expect(result).toBeNull();
  });

  it("assembles complete project financial details with accurate KPI summary, invoice statuses, and transactions", async () => {
    const mockProject = {
      _id: validProjectId,
      workspaceId: validWsId,
      clientId: "507f1f77bcf86cd799439099",
      name: "Mobile App Development",
      status: "active",
      expectedAmount: 500000, // 5,000 EGP budget
      dueDate: new Date("2026-11-01T00:00:00.000Z"),
      description: "Full stack Flutter app",
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
    };

    vi.mocked(ProjectModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockProject),
    } as any);

    vi.mocked(ClientModel.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439099",
          name: "Client Alpha",
          email: "alpha@example.com",
          phone: "+201125030642",
        }),
      }),
    } as any);

    const mockInvoices = [
      {
        _id: "inv-1",
        invoiceNumber: "INV-001",
        issueDate: new Date("2026-09-05T00:00:00.000Z"),
        dueDate: new Date("2026-09-20T00:00:00.000Z"),
        items: [{ amount: 300000 }], // 3,000 EGP
        status: "sent",
      },
    ];

    vi.mocked(InvoiceModel.find).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockInvoices),
      }),
    } as any);

    // Mock payment of 1,000 EGP towards INV-001 (partially paid, remaining 2,000)
    vi.mocked(InvoicePaymentModel.aggregate).mockResolvedValue([
      { _id: "inv-1", paidTotal: 100000 },
    ] as any);

    const mockTransactions = [
      {
        _id: "tx-income-1",
        type: "income",
        amount: 100000, // 1,000 EGP collected
        transactionDate: new Date("2026-09-10T00:00:00.000Z"),
        description: "Payment for INV-001",
        notes: "",
        categoryId: { name: "Client Invoicing", icon: "💼" },
        accountId: { name: "CIB Bank", currency: "EGP" },
      },
      {
        _id: "tx-expense-1",
        type: "expense",
        amount: 80000, // 800 EGP server cost
        transactionDate: new Date("2026-09-12T00:00:00.000Z"),
        description: "AWS Cloud hosting",
        notes: "EC2 & RDS",
        categoryId: { name: "Hosting & Cloud", icon: "☁️" },
        accountId: { name: "Credit Card", currency: "EGP" },
      },
    ];

    vi.mocked(TransactionModel.find).mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockTransactions),
      }),
    } as any);

    const result = await getProjectFinancialDetails(validProjectId, validWsId);

    expect(result).not.toBeNull();
    expect(result?.project.name).toBe("Mobile App Development");
    expect(result?.client?.name).toBe("Client Alpha");

    // Summary verification:
    // Expected: 500,000
    // Invoiced: 300,000
    // Income: 100,000
    // Expenses: 80,000
    // Net Profit: 100,000 - 80,000 = 20,000 (200 EGP)
    // Profit Margin: (20,000 / 100,000) * 100 = 20%
    // Over budget: false (80,000 < 500,000)
    // Collection Progress: (100,000 / 300,000) * 100 = 33%
    // Budget Burn: (80,000 / 500,000) * 100 = 16%
    expect(result?.summary.expectedAmount).toBe(500000);
    expect(result?.summary.invoicedTotal).toBe(300000);
    expect(result?.summary.incomeTotal).toBe(100000);
    expect(result?.summary.expenseTotal).toBe(80000);
    expect(result?.summary.netProfit).toBe(20000);
    expect(result?.summary.profitMargin).toBe(20);
    expect(result?.summary.isOverBudget).toBe(false);
    expect(result?.summary.collectionProgressPercent).toBe(33);
    expect(result?.summary.budgetBurnPercent).toBe(16);

    // Invoices verification
    expect(result?.invoices).toHaveLength(1);
    expect(result?.invoices[0]).toMatchObject({
      invoiceNumber: "INV-001",
      total: 300000,
      paidAmount: 100000,
      remainingAmount: 200000,
      financialStatus: "partially_paid",
    });

    // Transactions verification
    expect(result?.transactions).toHaveLength(2);
    expect(result?.transactions[0]).toMatchObject({
      type: "income",
      amount: 100000,
      categoryName: "Client Invoicing",
    });
    expect(result?.transactions[1]).toMatchObject({
      type: "expense",
      amount: 80000,
      categoryName: "Hosting & Cloud",
    });
  });
});
