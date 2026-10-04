import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { toPlain } from "@/lib/db/plain";
import { ProjectModel, type ProjectStatus } from "@/models/project";
import { ClientModel } from "@/models/client";
import { InvoiceModel, type InvoiceStatus } from "@/models/invoice";
import { InvoicePaymentModel } from "@/models/invoice-payment";
import { TransactionModel } from "@/models/transaction";

export type ProjectInvoiceItem = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  financialStatus: "unpaid" | "partially_paid" | "paid" | "legacy_paid";
};

export type ProjectTransactionItem = {
  id: string;
  type: "income" | "expense";
  amount: number;
  transactionDate: string;
  description: string;
  notes: string;
  categoryName: string;
  categoryIcon: string | null;
  accountName: string;
  accountCurrency: string;
};

export type ProjectFinancialDetailsView = {
  project: {
    id: string;
    name: string;
    status: ProjectStatus;
    expectedAmount: number | null;
    dueDate: string | null;
    description: string;
    createdAt: string;
  };
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  summary: {
    expectedAmount: number | null;
    invoicedTotal: number;
    incomeTotal: number;
    expenseTotal: number;
    netProfit: number;
    profitMargin: number | null;
    isOverBudget: boolean;
    collectionProgressPercent: number;
    budgetBurnPercent: number | null;
  };
  invoices: ProjectInvoiceItem[];
  transactions: ProjectTransactionItem[];
};

export async function getProjectFinancialDetails(
  projectId: string,
  workspaceId: string,
): Promise<ProjectFinancialDetailsView | null> {
  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(workspaceId)
  ) {
    return null;
  }

  await connectToDatabase();

  const project = await ProjectModel.findOne({
    _id: projectId,
    workspaceId,
    isArchived: false,
  }).lean();

  if (!project) return null;

  const [client, invoices, transactions] = await Promise.all([
    project.clientId
      ? ClientModel.findOne({
          _id: project.clientId,
          workspaceId,
          isArchived: false,
        })
          .select("name email phone")
          .lean()
      : null,
    InvoiceModel.find({
      projectId,
      workspaceId,
      isArchived: false,
    })
      .sort({ issueDate: -1, createdAt: -1 })
      .lean(),
    TransactionModel.find({
      projectId,
      workspaceId,
      isArchived: false,
    })
      .populate("categoryId", "name icon kind")
      .populate("accountId", "name currency")
      .sort({ transactionDate: -1, createdAt: -1 })
      .lean(),
  ]);

  // Fetch payments for project invoices to compute accurate financial statuses
  const invoiceIds = invoices.map((inv) => inv._id);
  const payments =
    invoiceIds.length > 0
      ? await InvoicePaymentModel.aggregate<{
          _id: mongoose.Types.ObjectId;
          paidTotal: number;
        }>([
          {
            $match: {
              workspaceId: new mongoose.Types.ObjectId(workspaceId),
              invoiceId: { $in: invoiceIds },
              isArchived: false,
            },
          },
          {
            $group: {
              _id: "$invoiceId",
              paidTotal: { $sum: "$amount" },
            },
          },
        ])
      : [];

  const paymentMap = new Map(
    payments.map((p) => [String(p._id), p.paidTotal]),
  );

  let invoicedTotal = 0;
  const invoiceItems: ProjectInvoiceItem[] = invoices.map((inv) => {
    const total = inv.items.reduce((sum, item) => sum + item.amount, 0);
    if (inv.status !== "cancelled") {
      invoicedTotal += total;
    }

    const paidAmount = paymentMap.get(String(inv._id)) ?? 0;
    const remainingAmount = Math.max(0, total - paidAmount);

    let financialStatus: "unpaid" | "partially_paid" | "paid" | "legacy_paid" = "unpaid";
    if (paidAmount >= total && total > 0) {
      financialStatus = "paid";
    } else if (paidAmount > 0) {
      financialStatus = "partially_paid";
    } else if (inv.status === "paid") {
      financialStatus = "legacy_paid";
    }

    return {
      id: String(inv._id),
      invoiceNumber: inv.invoiceNumber,
      issueDate: new Date(inv.issueDate).toISOString(),
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString() : null,
      total,
      paidAmount,
      remainingAmount,
      status: inv.status,
      financialStatus,
    };
  });

  let incomeTotal = 0;
  let expenseTotal = 0;

  const transactionItems: ProjectTransactionItem[] = transactions.map((tx) => {
    if (tx.type === "income") {
      incomeTotal += tx.amount;
    } else {
      expenseTotal += tx.amount;
    }

    const category = tx.categoryId as { name?: string; icon?: string | null } | null;
    const account = tx.accountId as { name?: string; currency?: string } | null;

    return {
      id: String(tx._id),
      type: tx.type,
      amount: tx.amount,
      transactionDate: new Date(tx.transactionDate).toISOString(),
      description: tx.description || "",
      notes: tx.notes || "",
      categoryName: category?.name || "—",
      categoryIcon: category?.icon ?? null,
      accountName: account?.name || "—",
      accountCurrency: account?.currency || "",
    };
  });

  const netProfit = incomeTotal - expenseTotal;
  const profitMargin = incomeTotal > 0 ? Math.round((netProfit / incomeTotal) * 100) : null;
  const expectedAmount = project.expectedAmount ?? null;
  const isOverBudget =
    expectedAmount != null && expectedAmount > 0 && expenseTotal > expectedAmount;
  const collectionProgressPercent =
    invoicedTotal > 0 ? Math.min(100, Math.round((incomeTotal / invoicedTotal) * 100)) : 0;
  const budgetBurnPercent =
    expectedAmount != null && expectedAmount > 0
      ? Math.round((expenseTotal / expectedAmount) * 100)
      : null;

  return toPlain({
    project: {
      id: String(project._id),
      name: project.name,
      status: project.status,
      expectedAmount,
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString() : null,
      description: project.description || "",
      createdAt: new Date(project.createdAt).toISOString(),
    },
    client: client
      ? {
          id: String(client._id),
          name: client.name,
          email: client.email ?? null,
          phone: client.phone ?? null,
        }
      : null,
    summary: {
      expectedAmount,
      invoicedTotal,
      incomeTotal,
      expenseTotal,
      netProfit,
      profitMargin,
      isOverBudget,
      collectionProgressPercent,
      budgetBurnPercent,
    },
    invoices: invoiceItems,
    transactions: transactionItems,
  });
}
