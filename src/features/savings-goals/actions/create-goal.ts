"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createSavingsGoalSchema } from "@/features/savings-goals/schemas";
import { savingsGoalsService } from "@/features/savings-goals/savings-goals.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateSavingsGoalState = {
  error: string | null;
};

export async function createSavingsGoalAction(
  _prevState: CreateSavingsGoalState,
  formData: FormData,
): Promise<CreateSavingsGoalState> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createSavingsGoalSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    deadline: formData.get("deadline"),
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, ({ userId }) =>
    savingsGoalsService.create(userId, parsed.data),
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidateTag(CACHE_TAGS.goals, "max");
  revalidatePath("/dashboard/goals");
  return { error: null };
}
