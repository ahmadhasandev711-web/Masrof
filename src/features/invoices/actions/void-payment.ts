"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { invoicesService } from "@/features/invoices/invoices.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

/** Void a wrong payment: money leaves the account again and the invoice reopens. */
export async function voidInvoicePaymentAction(
  paymentId: string,
  workspaceId: string,
): Promise<{ error: string | null }> {
  const tErrors = await getTranslations("errors");

  const result = await runWorkspaceWrite(workspaceId, () =>
    invoicesService.voidPayment(paymentId, workspaceId),
  );
  if (!result.ok) {
    try {
      return { error: tErrors(result.error.code as Parameters<typeof tErrors>[0]) };
    } catch {
      return { error: tErrors("unexpected") };
    }
  }

  revalidateTag(CACHE_TAGS.invoices, "max");
  revalidateTag(CACHE_TAGS.accounts, "max");
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { error: null };
}
