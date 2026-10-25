"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { isWorkspaceAuthorizationError, verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveSavingsGoal } from "@/features/savings-goals/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveSavingsGoalAction(goalId: string, workspaceId: string) {
  try {
    const session = await requireSession();
    await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

    await archiveSavingsGoal(goalId, workspaceId);

    revalidateTag(CACHE_TAGS.goals, "max");
    revalidatePath("/dashboard/goals");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
