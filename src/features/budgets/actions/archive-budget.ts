"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveBudget } from "@/features/budgets/data";

export async function archiveBudgetAction(budgetId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await archiveBudget(budgetId, workspaceId);

  revalidatePath("/dashboard/budgets");
}
