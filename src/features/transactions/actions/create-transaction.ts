"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { createTransactionSchema } from "@/features/transactions/schemas";
import { createTransaction, InvalidTransactionReferenceError } from "@/features/transactions/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateTransactionState = {
  error: string | null;
};

export async function createTransactionAction(
  _prevState: CreateTransactionState,
  formData: FormData,
): Promise<CreateTransactionState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createTransactionSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    transactionDate: formData.get("transactionDate"),
    description: formData.get("description") || "",
    notes: formData.get("notes") || "",
    clientId: String(formData.get("clientId") ?? "") || undefined,
    projectId: String(formData.get("projectId") ?? "") || undefined,
    attachmentUrl: String(formData.get("attachmentUrl") ?? "") || undefined,
    attachmentName: String(formData.get("attachmentName") ?? "") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  try {
    await createTransaction(parsed.data, session.user.id);
  } catch (error) {
    if (error instanceof InvalidTransactionReferenceError) {
      return { error: tErrors(error.code as Parameters<typeof tErrors>[0]) };
    }
    throw error;
  }

  revalidateTag(CACHE_TAGS.budgets, "max");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { error: null };
}
