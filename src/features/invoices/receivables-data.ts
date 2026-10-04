import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { InvoiceModel } from "@/models/invoice";
import { InvoicePaymentModel } from "@/models/invoice-payment";

export type WorkspaceReceivablesSummary = {
  totalOutstanding: number;
  unpaidCount: number;
  overdueAmount: number;
  overdueCount: number;
};

/**
 * Computes receivables and overdue statistics across a workspace in 2 fast indexed queries.
 */
export async function getWorkspaceReceivablesSummary(
  workspaceId: string,
): Promise<WorkspaceReceivablesSummary> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    return {
      totalOutstanding: 0,
      unpaidCount: 0,
      overdueAmount: 0,
      overdueCount: 0,
    };
  }

  await connectToDatabase();

  const [invoices, payments] = await Promise.all([
    InvoiceModel.find({
      workspaceId,
      isArchived: false,
      status: { $ne: "cancelled" },
    })
      .select("_id items dueDate status")
      .lean(),
    InvoicePaymentModel.aggregate<{ _id: mongoose.Types.ObjectId; paidTotal: number }>([
      {
        $match: {
          workspaceId: new mongoose.Types.ObjectId(workspaceId),
          isArchived: false,
        },
      },
      {
        $group: {
          _id: "$invoiceId",
          paidTotal: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const paidMap = new Map<string, number>(
    payments.map((p) => [String(p._id), p.paidTotal]),
  );

  const now = new Date();
  let totalOutstanding = 0;
  let unpaidCount = 0;
  let overdueAmount = 0;
  let overdueCount = 0;

  for (const inv of invoices) {
    const totalAmount = inv.items.reduce((sum, item) => sum + item.amount, 0);
    const paid = paidMap.get(String(inv._id)) ?? 0;
    const remaining = Math.max(0, totalAmount - paid);

    // If legacy paid without payment record, treat remaining as 0
    if (inv.status === "paid" && paid === 0) {
      continue;
    }

    if (remaining > 0) {
      unpaidCount += 1;
      totalOutstanding += remaining;

      const isOverdue = inv.dueDate ? new Date(inv.dueDate) < now : false;
      if (isOverdue) {
        overdueCount += 1;
        overdueAmount += remaining;
      }
    }
  }

  return {
    totalOutstanding,
    unpaidCount,
    overdueAmount,
    overdueCount,
  };
}

export type InvoiceRadarItem = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientPhone: string | null;
  remainingAmount: number;
  dueDate: Date | null;
  isOverdue: boolean;
  shareToken: string | null;
};

/**
 * Returns prioritized unpaid / overdue invoices for fast WhatsApp reminders on dashboard.
 * Batches payments and client info without N+1 queries.
 */
export async function getOpenInvoicesRadar(
  workspaceId: string,
  limit = 4,
): Promise<InvoiceRadarItem[]> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    return [];
  }

  await connectToDatabase();

  const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

  const [invoices, payments] = await Promise.all([
    InvoiceModel.find({
      workspaceId: wsObjectId,
      isArchived: false,
      status: { $ne: "cancelled" },
    })
      .select("_id invoiceNumber clientId items dueDate status shareToken isShareable")
      .lean(),
    InvoicePaymentModel.aggregate<{ _id: mongoose.Types.ObjectId; paidTotal: number }>([
      {
        $match: {
          workspaceId: wsObjectId,
          isArchived: false,
        },
      },
      {
        $group: {
          _id: "$invoiceId",
          paidTotal: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const paidMap = new Map<string, number>(
    payments.map((p) => [String(p._id), p.paidTotal]),
  );

  const now = new Date();
  const unpaidInvoices: Array<{
    id: string;
    invoiceNumber: string;
    clientId: string;
    remaining: number;
    dueDate: Date | null;
    isOverdue: boolean;
    shareToken: string | null;
  }> = [];

  for (const inv of invoices) {
    const totalAmount = inv.items.reduce((sum, item) => sum + item.amount, 0);
    const paid = paidMap.get(String(inv._id)) ?? 0;
    const remaining = Math.max(0, totalAmount - paid);

    if (inv.status === "paid" && paid === 0) {
      continue;
    }

    if (remaining > 0) {
      const isOverdue = inv.dueDate ? new Date(inv.dueDate) < now : false;
      unpaidInvoices.push({
        id: String(inv._id),
        invoiceNumber: inv.invoiceNumber,
        clientId: String(inv.clientId),
        remaining,
        dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
        isOverdue,
        shareToken: inv.isShareable ? (inv.shareToken ?? null) : null,
      });
    }
  }

  // Sort: Overdue first, then by closest dueDate
  unpaidInvoices.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const sliced = unpaidInvoices.slice(0, limit);
  if (sliced.length === 0) return [];

  const clientIds = Array.from(new Set(sliced.map((inv) => inv.clientId)));
  const clients = await import("@/models/client").then(({ ClientModel }) =>
    ClientModel.find({
      _id: { $in: clientIds },
      workspaceId: wsObjectId,
    })
      .select("_id name phone")
      .lean(),
  );

  const clientMap = new Map(
    clients.map((c) => [String(c._id), { name: c.name, phone: c.phone ?? null }]),
  );

  return sliced.map((inv) => {
    const client = clientMap.get(inv.clientId);
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: client?.name || "—",
      clientPhone: client?.phone || null,
      remainingAmount: inv.remaining,
      dueDate: inv.dueDate,
      isOverdue: inv.isOverdue,
      shareToken: inv.shareToken,
    };
  });
}
