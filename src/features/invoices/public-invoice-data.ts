import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { toPlain } from "@/lib/db/plain";
import { InvoiceModel, type InvoiceStatus } from "@/models/invoice";
import { InvoicePaymentModel } from "@/models/invoice-payment";
import {
  generateSecureShareToken,
  invoicesRepository,
} from "@/features/invoices/invoices.repository";
import type { InvoiceFinancialStatus, PublicInvoiceView } from "@/features/invoices/types";

export { generateSecureShareToken };

/**
 * Gets an existing share token or securely generates and assigns a new one.
 */
export async function getOrCreateInvoiceShareToken(
  invoiceId: string,
  workspaceId: string,
): Promise<string | null> {
  return invoicesRepository.getOrCreateShareToken(invoiceId, workspaceId);
}

/**
 * Revokes the old share token and creates a new one, invalidating old shared links.
 */
export async function regenerateInvoiceShareToken(
  invoiceId: string,
  workspaceId: string,
): Promise<string | null> {
  return invoicesRepository.regenerateShareToken(invoiceId, workspaceId);
}

/**
 * Enables or disables public sharing of an invoice.
 */
export async function toggleInvoiceShareable(
  invoiceId: string,
  workspaceId: string,
  isShareable: boolean,
): Promise<boolean> {
  return invoicesRepository.setShareable(invoiceId, workspaceId, isShareable);
}

/**
 * Retrieves public invoice details for client viewing without authentication.
 * Safely marks the invoice as viewed if not previously viewed.
 */
export async function getPublicInvoiceByToken(
  token: string,
): Promise<PublicInvoiceView | null> {
  if (!token || typeof token !== "string" || token.length < 16) {
    return null;
  }

  await connectToDatabase();

  const invoice = await InvoiceModel.findOne({
    shareToken: token,
    isShareable: true,
    isArchived: false,
    status: { $ne: "cancelled" },
  })
    .populate("clientId", "name email phone")
    .populate("projectId", "name")
    .populate(
      "workspaceId",
      "name businessName logoUrl taxId businessPhone businessAddress currency",
    )
    .lean();

  if (!invoice) return null;

  if (!invoice.viewedAt) {
    InvoiceModel.updateOne(
      { _id: invoice._id, viewedAt: null },
      { $set: { viewedAt: new Date() } },
    )
      .exec()
      .catch((err) => {
        console.error("[public-invoice] failed to update viewedAt:", err);
      });
  }

  const payments = await InvoicePaymentModel.find({
    invoiceId: invoice._id,
    isArchived: false,
  }).lean();

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const total = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const remainingAmount = Math.max(0, total - paidAmount);

  let financialStatus: InvoiceFinancialStatus;
  if (paidAmount >= total && total > 0) {
    financialStatus = "paid";
  } else if (paidAmount > 0) {
    financialStatus = "partially_paid";
  } else if (invoice.status === "paid") {
    financialStatus = "legacy_paid";
  } else {
    financialStatus = "unpaid";
  }

  const client = invoice.clientId as {
    name?: string;
    email?: string | null;
    phone?: string | null;
  } | null;

  const project = invoice.projectId as {
    name?: string;
  } | null;

  const workspace = invoice.workspaceId as {
    name?: string;
    businessName?: string | null;
    logoUrl?: string | null;
    taxId?: string | null;
    businessPhone?: string | null;
    businessAddress?: string | null;
    currency?: string;
  } | null;

  const displayName = (workspace?.businessName || "").trim() || workspace?.name || "";

  return toPlain({
    id: String(invoice._id),
    shareToken: token,
    invoiceNumber: invoice.invoiceNumber,
    issueDate: new Date(invoice.issueDate).toISOString(),
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
    items: invoice.items.map((item) => ({
      description: item.description,
      amount: item.amount,
    })),
    total,
    paidAmount,
    remainingAmount,
    notes: invoice.notes || "",
    status: (invoice.status ?? "sent") as InvoiceStatus,
    financialStatus,
    client: {
      name: client?.name || "—",
      email: client?.email ?? null,
      phone: client?.phone ?? null,
    },
    projectName: project?.name ?? null,
    workspaceName: workspace?.name || "",
    businessName: displayName,
    logoUrl: workspace?.logoUrl || null,
    taxId: workspace?.taxId || null,
    businessPhone: workspace?.businessPhone || null,
    businessAddress: workspace?.businessAddress || null,
    currency: workspace?.currency || "EGP",
    viewedAt: invoice.viewedAt
      ? new Date(invoice.viewedAt).toISOString()
      : new Date().toISOString(),
  });
}
