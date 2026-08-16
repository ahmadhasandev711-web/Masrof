"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveSavingsGoal } from "@/features/savings-goals/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveSavingsGoalAction(goalId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await archiveSavingsGoal(goalId, workspaceId);

  revalidateTag(CACHE_TAGS.goals, "max");
  revalidatePath("/dashboard/goals");
}
