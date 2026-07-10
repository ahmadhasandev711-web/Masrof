"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveSavingsGoal } from "@/features/savings-goals/data";

export async function archiveSavingsGoalAction(goalId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await archiveSavingsGoal(goalId, workspaceId);

  revalidatePath("/dashboard/goals");
}
