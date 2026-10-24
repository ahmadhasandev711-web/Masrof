"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { createBudgetSchema } from "@/features/budgets/schemas";
import { createBudget, InvalidBudgetCategoryError } from "@/features/budgets/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateBudgetState = {
  error: string | null;
};

export async function createBudgetAction(
  _prevState: CreateBudgetState,
  formData: FormData,
): Promise<CreateBudgetState> {
  const session = await requireSession();
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

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  const { assertWorkspacePlanFeature } = await import("@/features/subscriptions/data");
  const featureError = await assertWorkspacePlanFeature(
    session.user.id,
    parsed.data.workspaceId,
    "budgets",
  );
  if (featureError) {
    return { error: featureError };
  }

  try {
    await createBudget(parsed.data);
  } catch (error) {
    if (error instanceof InvalidBudgetCategoryError) {
      return { error: tErrors(error.code as Parameters<typeof tErrors>[0]) };
    }
    throw error;
  }

  revalidateTag(CACHE_TAGS.budgets, "max");
  revalidatePath("/dashboard/budgets");
  return { error: null };
}
