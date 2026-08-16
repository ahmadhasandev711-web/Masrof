"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { createUpdateGoalProgressSchema } from "@/features/savings-goals/schemas";
import { updateSavingsGoalProgress, SavingsGoalNotFoundError } from "@/features/savings-goals/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type UpdateGoalProgressState = {
  error: string | null;
};

export async function updateGoalProgressAction(
  _prevState: UpdateGoalProgressState,
  formData: FormData,
): Promise<UpdateGoalProgressState> {
  const session = await requireSession();
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

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  try {
    await updateSavingsGoalProgress(parsed.data);
  } catch (error) {
    if (error instanceof SavingsGoalNotFoundError) {
      return { error: tErrors(error.code as Parameters<typeof tErrors>[0]) };
    }
    throw error;
  }

  revalidateTag(CACHE_TAGS.goals, "max");
  revalidatePath("/dashboard/goals");
  return { error: null };
}
