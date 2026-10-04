"use server";

import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceAccess } from "@/features/workspaces/access";
import { getInvoicePayments } from "@/features/invoices/payment-data";
import type { InvoicePaymentListItem } from "@/features/invoices/types";

export async function getInvoicePaymentsAction(
  invoiceId: string,
  workspaceId: string,
): Promise<{ payments: InvoicePaymentListItem[]; error: string | null }> {
  const session = await requireSession();
  await verifyWorkspaceAccess(session.user.id, workspaceId);

  try {
    const payments = await getInvoicePayments(invoiceId, workspaceId);
    return { payments, error: null };
  } catch {
    return { payments: [], error: "Failed to load payments" };
  }
}
