"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveInvoice, InvalidInvoiceReferenceError } from "@/features/invoices/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveInvoiceAction(invoiceId: string, workspaceId: string) {
  const session = await requireSession();
  const tErrors = await getTranslations("errors");

  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  try {
    await archiveInvoice(invoiceId, workspaceId);
  } catch (error) {
    if (error instanceof InvalidInvoiceReferenceError) {
      return { error: tErrors(error.code as Parameters<typeof tErrors>[0]) };
    }
    throw error;
  }

  revalidateTag(CACHE_TAGS.invoices, "max");
  revalidatePath("/dashboard/invoices");
  return { error: null };
}
