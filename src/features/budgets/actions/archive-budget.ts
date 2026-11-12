"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { budgetsService } from "@/features/budgets/budgets.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveBudgetAction(budgetId: string, workspaceId: string) {
  try {
    await runWorkspaceWrite(workspaceId, () => budgetsService.archive(budgetId, workspaceId));

    revalidateTag(CACHE_TAGS.budgets, "max");
    revalidatePath("/dashboard/budgets");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
