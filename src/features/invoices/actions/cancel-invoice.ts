"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { invoicesService } from "@/features/invoices/invoices.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function cancelInvoiceAction(invoiceId: string, workspaceId: string) {
  const tErrors = await getTranslations("errors");

  const result = await runWorkspaceWrite(workspaceId, () =>
    invoicesService.cancel(invoiceId, workspaceId),
  );

  if (!result.ok) {
    const code = result.error.code as Parameters<typeof tErrors>[0];
    try {
      return { error: tErrors(code) };
    } catch {
      return { error: result.error.message };
    }
  }

  revalidateTag(CACHE_TAGS.invoices, "max");
  revalidatePath("/dashboard/invoices");
  return { error: null };
}
