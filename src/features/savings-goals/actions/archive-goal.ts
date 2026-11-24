"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { savingsGoalsService } from "@/features/savings-goals/savings-goals.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveSavingsGoalAction(
  goalId: string,
  workspaceId: string,
): Promise<{ error: string | null }> {
  const tErrors = await getTranslations("errors");
  try {
    const result = await runWorkspaceWrite(workspaceId, ({ userId }) =>
      savingsGoalsService.archive(userId, goalId, workspaceId),
    );
    if (!result.ok) {
      const code = result.error.code as Parameters<typeof tErrors>[0];
      try {
        return { error: tErrors(code) };
      } catch {
        return { error: result.error.message };
      }
    }

    revalidateTag(CACHE_TAGS.goals, "max");
    revalidatePath("/dashboard/goals");
    return { error: null };
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return { error: tErrors("unauthorized") };
    throw error;
  }
}
