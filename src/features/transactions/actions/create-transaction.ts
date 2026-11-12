"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createTransactionSchema } from "@/features/transactions/schemas";
import {
  InvalidTransactionReferenceError,
} from "@/features/transactions/transactions.repository";
import { transactionsService } from "@/features/transactions/transactions.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateTransactionState = {
  error: string | null;
};

export async function createTransactionAction(
  _prevState: CreateTransactionState,
  formData: FormData,
): Promise<CreateTransactionState> {
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
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, ({ userId }) =>
    transactionsService.create(userId, parsed.data),
  );

  if (!result.ok) {
    if (result.error instanceof InvalidTransactionReferenceError) {
      return { error: tErrors(result.error.code as Parameters<typeof tErrors>[0]) };
    }
    return { error: result.error.message };
  }

  revalidateTag(CACHE_TAGS.budgets, "max");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { error: null };
}
