"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { createSavingsGoalSchema } from "@/features/savings-goals/schemas";
import { createSavingsGoal } from "@/features/savings-goals/data";

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

  await createSavingsGoal(parsed.data);

  revalidatePath("/dashboard/goals");
  return { error: null };
}
