"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createUpdateTransactionSchema } from "@/features/transactions/schemas";
import {
  InvalidTransactionReferenceError,
} from "@/features/transactions/transactions.repository";
import { transactionsService } from "@/features/transactions/transactions.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type UpdateTransactionState = {
  error: string | null;
  success: boolean;
};

export async function updateTransactionAction(
  _prevState: UpdateTransactionState,
  formData: FormData,
): Promise<UpdateTransactionState> {
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

  const result = await runWorkspaceWrite(parsed.data.workspaceId, () =>
    transactionsService.update(parsed.data, parsed.data.workspaceId),
  );

  if (!result.ok) {
    if (result.error instanceof InvalidTransactionReferenceError) {
      return {
        error: tErrors(result.error.code as Parameters<typeof tErrors>[0]),
        success: false,
      };
    }
    return { error: result.error.message, success: false };
  }

  revalidateTag(CACHE_TAGS.budgets, "max");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/budgets");
  return { error: null, success: true };
}
