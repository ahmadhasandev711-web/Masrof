import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { toPlain } from "@/lib/db/plain";
import { ClientModel } from "@/models/client";
import { InvoiceModel } from "@/models/invoice";
import { InvoicePaymentModel } from "@/models/invoice-payment";
import type { WorkspaceBrandingForPrint } from "@/features/invoices/data";

export type StatementLedgerEntry = {
  id: string;
  date: string;
  type: "invoice" | "payment";
  numberOrRef: string;
  description: string;
  projectName: string | null;
  debit: number; // Invoiced amount (increases balance)
  credit: number; // Paid amount (decreases balance)
  runningBalance: number;
};

export type ClientStatementView = {
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  branding: {
    workspaceName: string;
    businessName: string;
    logoUrl: string | null;
    taxId: string | null;
    businessPhone: string | null;
    businessAddress: string | null;
    currency: string;
  };
  totalInvoiced: number;
  totalPaid: number;
  currentOutstanding: number;
  entries: StatementLedgerEntry[];
  generatedAt: string;
};

export async function getClientStatement(
  clientId: string,
  workspaceId: string,
  branding: WorkspaceBrandingForPrint,
): Promise<ClientStatementView | null> {
  await connectToDatabase();

  const client = await ClientModel.findOne({
    _id: clientId,
    workspaceId,
    isArchived: false,
  }).lean();

  if (!client) return null;

  // 1. Fetch all non-archived, non-cancelled invoices for this client
  const invoices = await InvoiceModel.find({
    clientId,
    workspaceId,
    isArchived: false,
    status: { $ne: "cancelled" },
  })
    .sort({ issueDate: 1, createdAt: 1 })
    .populate("projectId", "name")
    .lean();

  const invoiceIds = invoices.map((inv) => inv._id);

  // 2. Fetch all payments linked to these invoices
  const payments = invoiceIds.length > 0
    ? await InvoicePaymentModel.find({
        invoiceId: { $in: invoiceIds },
        workspaceId,
        isArchived: false,
      })
        .sort({ paymentDate: 1, createdAt: 1 })
        .populate("accountId", "name")
        .lean()
    : [];

  // Map invoices by ID for quick reference during payment mapping
  const invoiceMap = new Map(invoices.map((inv) => [String(inv._id), inv]));

  // 3. Assemble raw events (Invoices & Payments)
  type RawEvent = {
    id: string;
    date: Date;
    type: "invoice" | "payment";
    numberOrRef: string;
    description: string;
    projectName: string | null;
    amount: number;
  };

  const rawEvents: RawEvent[] = [];

  for (const inv of invoices) {
    const total = inv.items.reduce((sum, item) => sum + item.amount, 0);
    const proj = inv.projectId as { name?: string } | null;
    rawEvents.push({
      id: String(inv._id),
      date: new Date(inv.issueDate),
      type: "invoice",
      numberOrRef: inv.invoiceNumber,
      description: inv.notes || inv.items.map((i) => i.description).join(", "),
      projectName: proj?.name ?? null,
      amount: total,
    });
  }

  for (const pay of payments) {
    const parentInvoice = invoiceMap.get(String(pay.invoiceId));
    const account = pay.accountId as { name?: string } | null;
    const proj = parentInvoice?.projectId as { name?: string } | null;

    rawEvents.push({
      id: String(pay._id),
      date: new Date(pay.paymentDate),
      type: "payment",
      numberOrRef: pay.reference || parentInvoice?.invoiceNumber || "—",
      description: pay.notes || (account?.name ? `إيداع في: ${account.name}` : "تحصيل دفعة"),
      projectName: proj?.name ?? null,
      amount: pay.amount,
    });
  }

  // 4. Sort chronologically (oldest to newest)
  rawEvents.sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    if (diff !== 0) return diff;
    // If same timestamp, invoice comes before payment
    return a.type === "invoice" ? -1 : 1;
  });

  // 5. Calculate running balance and entries
  let running = 0;
  let totalInvoiced = 0;
  let totalPaid = 0;

  const entries: StatementLedgerEntry[] = rawEvents.map((evt) => {
    let debit = 0;
    let credit = 0;

    if (evt.type === "invoice") {
      debit = evt.amount;
      running += debit;
      totalInvoiced += debit;
    } else {
      credit = evt.amount;
      running -= credit;
      totalPaid += credit;
    }

    return {
      id: evt.id,
      date: evt.date.toISOString(),
      type: evt.type,
      numberOrRef: evt.numberOrRef,
      description: evt.description,
      projectName: evt.projectName,
      debit,
      credit,
      runningBalance: running,
    };
  });

  const displayName = (branding.businessName || "").trim() || branding.name;

  return toPlain({
    client: {
      id: String(client._id),
      name: client.name,
      email: client.email ?? null,
      phone: client.phone ?? null,
    },
    branding: {
      workspaceName: branding.name,
      businessName: displayName,
      logoUrl: branding.logoUrl || null,
      taxId: branding.taxId || null,
      businessPhone: branding.businessPhone || null,
      businessAddress: branding.businessAddress || null,
      currency: branding.currency,
    },
    totalInvoiced,
    totalPaid,
    currentOutstanding: Math.max(0, totalInvoiced - totalPaid),
    entries,
    generatedAt: new Date().toISOString(),
  });
}
