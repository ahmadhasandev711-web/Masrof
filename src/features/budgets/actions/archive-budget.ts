"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { isWorkspaceAuthorizationError, verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveBudget } from "@/features/budgets/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveBudgetAction(budgetId: string, workspaceId: string) {
  try {
    const session = await requireSession();
    await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

    await archiveBudget(budgetId, workspaceId);

    revalidateTag(CACHE_TAGS.budgets, "max");
    revalidatePath("/dashboard/budgets");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
