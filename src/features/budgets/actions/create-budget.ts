"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createBudgetSchema } from "@/features/budgets/schemas";
import { InvalidBudgetCategoryError } from "@/features/budgets/budgets.repository";
import { budgetsService } from "@/features/budgets/budgets.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateBudgetState = {
  error: string | null;
};

export async function createBudgetAction(
  _prevState: CreateBudgetState,
  formData: FormData,
): Promise<CreateBudgetState> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createBudgetSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    categoryId: formData.get("categoryId") || undefined,
    amount: formData.get("amount"),
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, ({ userId }) =>
    budgetsService.create(userId, parsed.data),
  );

  if (!result.ok) {
    if (result.error instanceof InvalidBudgetCategoryError) {
      return { error: tErrors(result.error.code as Parameters<typeof tErrors>[0]) };
    }
    return { error: result.error.message };
  }

  revalidateTag(CACHE_TAGS.budgets, "max");
  revalidatePath("/dashboard/budgets");
  return { error: null };
}
