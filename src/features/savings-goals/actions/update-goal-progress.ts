"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createUpdateGoalProgressSchema } from "@/features/savings-goals/schemas";
import { savingsGoalsService } from "@/features/savings-goals/savings-goals.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type UpdateGoalProgressState = {
  error: string | null;
};

export async function updateGoalProgressAction(
  _prevState: UpdateGoalProgressState,
  formData: FormData,
): Promise<UpdateGoalProgressState> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createUpdateGoalProgressSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    goalId: formData.get("goalId"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, () =>
    savingsGoalsService.updateProgress(parsed.data),
  );

  if (!result.ok) {
    return {
      error: tErrors(result.error.code as Parameters<typeof tErrors>[0]) || result.error.message,
    };
  }

  revalidateTag(CACHE_TAGS.goals, "max");
  revalidatePath("/dashboard/goals");
  return { error: null };
}
