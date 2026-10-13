"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { updateInvoice, InvalidInvoiceReferenceError } from "@/features/invoices/data";
import { updateInvoiceSchema, type UpdateInvoiceInput } from "@/features/invoices/schemas";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function updateInvoiceAction(input: UpdateInvoiceInput) {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = updateInvoiceSchema(tValidation).safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  try {
    await updateInvoice(parsed.data);
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
