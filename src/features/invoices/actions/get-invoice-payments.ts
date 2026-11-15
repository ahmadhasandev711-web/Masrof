"use server";

import { getTranslations } from "next-intl/server";
import { invoicesService } from "@/features/invoices/invoices.service";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceAccess } from "@/features/workspaces/access";
import type { InvoicePaymentListItem } from "@/features/invoices/types";

export async function getInvoicePaymentsAction(
  invoiceId: string,
  workspaceId: string,
): Promise<{ payments: InvoicePaymentListItem[]; error: string | null }> {
  const session = await requireSession();
  await verifyWorkspaceAccess(session.user.id, workspaceId);

  try {
    const payments = await invoicesService.listPayments(invoiceId, workspaceId);
    return { payments, error: null };
  } catch {
    const tErrors = await getTranslations("errors");
    return { payments: [], error: tErrors("paymentsLoadFailed") };
  }
}
