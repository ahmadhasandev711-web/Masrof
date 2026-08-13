"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { updateInvoiceStatus } from "@/features/invoices/data";
import { INVOICE_STATUSES, type InvoiceStatus } from "@/models/invoice";

export async function updateInvoiceStatusAction(
  invoiceId: string,
  workspaceId: string,
  status: InvoiceStatus,
) {
  const session = await requireSession();
  const tErrors = await getTranslations("errors");

  if (!(INVOICE_STATUSES as readonly string[]).includes(status)) {
    return { error: tErrors("invalidData") };
  }

  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);
  const updated = await updateInvoiceStatus(invoiceId, workspaceId, status);
  if (!updated) {
    return { error: tErrors("invalidData") };
  }

  revalidatePath("/dashboard/invoices");
  return { error: null };
}
