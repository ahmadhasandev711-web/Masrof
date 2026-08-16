"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature, assertWorkspaceQuantityLimit } from "@/features/subscriptions/data";
import { createSavingsGoalSchema } from "@/features/savings-goals/schemas";
import { createSavingsGoal } from "@/features/savings-goals/data";
import { countSavingsGoalsForWorkspace } from "@/features/subscriptions/plan-usage";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateSavingsGoalState = {
  error: string | null;
};

export async function createSavingsGoalAction(
  _prevState: CreateSavingsGoalState,
  formData: FormData,
): Promise<CreateSavingsGoalState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createSavingsGoalSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    deadline: formData.get("deadline"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  const featureError = await assertWorkspacePlanFeature(session.user.id, parsed.data.workspaceId, "savingsGoals");
  if (featureError) {
    return { error: featureError };
  }

  const goalCount = await countSavingsGoalsForWorkspace(parsed.data.workspaceId);
  const limitError = await assertWorkspaceQuantityLimit(
    session.user.id,
    parsed.data.workspaceId,
    "maxSavingsGoals",
    goalCount,
  );
  if (limitError) {
    return { error: limitError };
  }

  await createSavingsGoal(parsed.data);

  revalidateTag(CACHE_TAGS.goals, "max");
  revalidatePath("/dashboard/goals");
  return { error: null };
}
