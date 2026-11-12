"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { savingsGoalsService } from "@/features/savings-goals/savings-goals.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveSavingsGoalAction(goalId: string, workspaceId: string) {
  try {
    await runWorkspaceWrite(workspaceId, () => savingsGoalsService.archive(goalId, workspaceId));

    revalidateTag(CACHE_TAGS.goals, "max");
    revalidatePath("/dashboard/goals");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
