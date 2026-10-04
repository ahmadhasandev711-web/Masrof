import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

import { listProjectsWithTotals } from "@/features/projects/data";
import { ProjectModel } from "@/models/project";
import { TransactionModel } from "@/models/transaction";
import { InvoiceModel } from "@/models/invoice";
import { ClientModel } from "@/models/client";

vi.mock("@/models/project", () => ({
  ProjectModel: {
    find: vi.fn(),
  },
}));

vi.mock("@/models/transaction", () => ({
  TransactionModel: {
    aggregate: vi.fn(),
  },
}));

vi.mock("@/models/invoice", () => ({
  InvoiceModel: {
    aggregate: vi.fn(),
  },
}));

vi.mock("@/models/client", () => ({
  ClientModel: {
    find: vi.fn(),
  },
}));

describe("Slice P2.1 — listProjectsWithTotals & Profitability Math", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validWsId = "507f191e810c19729de860ea";

  it("returns empty array when workspaceId is invalid", async () => {
    const result = await listProjectsWithTotals("invalid-ws-id");
    expect(result).toEqual([]);
    expect(ProjectModel.find).not.toHaveBeenCalled();
  });

  it("accurately computes income, costs, net profit, margin, and budget warnings", async () => {
    const p1Id = "507f1f77bcf86cd799439011"; // Profitable project
    const p2Id = "507f1f77bcf86cd799439022"; // Over-budget / loss project
    const p3Id = "507f1f77bcf86cd799439033"; // New project without transactions

    const mockProjects = [
      {
        _id: p1Id,
        name: "E-Commerce App",
        status: "active",
        expectedAmount: 1000000, // 10,000 EGP
        dueDate: new Date("2026-10-01T00:00:00.000Z"),
        clientId: "client-1",
      },
      {
        _id: p2Id,
        name: "Brand Redesign",
        status: "active",
        expectedAmount: 200000, // 2,000 EGP budget
        dueDate: null,
        clientId: "client-2",
      },
      {
        _id: p3Id,
        name: "Consulting",
        status: "active",
        expectedAmount: null,
        dueDate: null,
        clientId: null,
      },
    ];

    vi.mocked(ProjectModel.find).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockProjects),
      }),
    } as any);

    // Mock aggregated transactions:
    // P1: Income = 800,000 minor, Expense = 200,000 minor -> Net Profit = 600,000 (Margin = 75%)
    // P2: Income = 100,000 minor, Expense = 350,000 minor -> Net Profit = -250,000 (Loss), Expense > Budget (200,000) -> isOverBudget: true!
    const mockTxTotals = [
      { _id: { projectId: p1Id, type: "income" }, total: 800000 },
      { _id: { projectId: p1Id, type: "expense" }, total: 200000 },
      { _id: { projectId: p2Id, type: "income" }, total: 100000 },
      { _id: { projectId: p2Id, type: "expense" }, total: 350000 },
    ];
    vi.mocked(TransactionModel.aggregate).mockResolvedValue(mockTxTotals as any);

    // Mock aggregated invoices:
    // P1: Invoiced = 1,000,000 minor
    // P2: Invoiced = 200,000 minor
    const mockInvoicedTotals = [
      { _id: p1Id, invoicedTotal: 1000000 },
      { _id: p2Id, invoicedTotal: 200000 },
    ];
    vi.mocked(InvoiceModel.aggregate).mockResolvedValue(mockInvoicedTotals as any);

    vi.mocked(ClientModel.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: "client-1", name: "Acme Corp", phone: "+201111111111" },
          { _id: "client-2", name: "Beta LLC", phone: null },
        ]),
      }),
    } as any);

    const results = await listProjectsWithTotals(validWsId);

    expect(results).toHaveLength(3);

    // P1 Assertions
    const p1 = results.find((p) => p._id === p1Id);
    expect(p1).toBeDefined();
    expect(p1?.incomeTotal).toBe(800000);
    expect(p1?.expenseTotal).toBe(200000);
    expect(p1?.netProfit).toBe(600000);
    expect(p1?.profitMargin).toBe(75); // (600,000 / 800,000) * 100
    expect(p1?.invoicedTotal).toBe(1000000);
    expect(p1?.isOverBudget).toBe(false);

    // P2 Assertions (Over-budget, negative profit)
    const p2 = results.find((p) => p._id === p2Id);
    expect(p2).toBeDefined();
    expect(p2?.incomeTotal).toBe(1000000 - 900000); // 100,000
    expect(p2?.expenseTotal).toBe(350000);
    expect(p2?.netProfit).toBe(-250000);
    expect(p2?.profitMargin).toBe(-250); // (-250,000 / 100,000) * 100
    expect(p2?.isOverBudget).toBe(true); // 350,000 expenses > 200,000 expected

    // P3 Assertions (Zero transactions)
    const p3 = results.find((p) => p._id === p3Id);
    expect(p3).toBeDefined();
    expect(p3?.incomeTotal).toBe(0);
    expect(p3?.expenseTotal).toBe(0);
    expect(p3?.netProfit).toBe(0);
    expect(p3?.profitMargin).toBeNull();
    expect(p3?.isOverBudget).toBe(false);
  });
});
