"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { createUpdateTransactionSchema } from "@/features/transactions/schemas";
import { updateTransaction, InvalidTransactionReferenceError } from "@/features/transactions/data";

export type UpdateTransactionState = {
  error: string | null;
  success: boolean;
};

export async function updateTransactionAction(
  _prevState: UpdateTransactionState,
  formData: FormData,
): Promise<UpdateTransactionState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createUpdateTransactionSchema(tValidation).safeParse({
    transactionId: formData.get("transactionId"),
    workspaceId: formData.get("workspaceId"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    transactionDate: formData.get("transactionDate"),
    description: formData.get("description") || "",
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData"), success: false };
  }

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  try {
    await updateTransaction(parsed.data, parsed.data.workspaceId);
  } catch (error) {
    if (error instanceof InvalidTransactionReferenceError) {
      return { error: tErrors(error.code as Parameters<typeof tErrors>[0]), success: false };
    }
    throw error;
  }

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/budgets");
  return { error: null, success: true };
}
