"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { invoicesService } from "@/features/invoices/invoices.service";
import { updateInvoiceSchema, type UpdateInvoiceInput } from "@/features/invoices/schemas";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function updateInvoiceAction(input: UpdateInvoiceInput) {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = updateInvoiceSchema(tValidation).safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, () =>
    invoicesService.update(parsed.data),
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
