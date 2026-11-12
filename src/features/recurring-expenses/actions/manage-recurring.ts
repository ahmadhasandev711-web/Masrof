"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { recurringExpensesService } from "@/features/recurring-expenses/recurring-expenses.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function recordRecurringExpenseAction(recurringId: string, workspaceId: string) {
  try {
    await runWorkspaceWrite(workspaceId, ({ userId }) =>
      recurringExpensesService.record(recurringId, workspaceId, userId),
    );

    revalidateTag(CACHE_TAGS.recurring, "max");
    revalidateTag(CACHE_TAGS.budgets, "max");
    revalidatePath("/dashboard/budgets");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}

export async function archiveRecurringExpenseAction(recurringId: string, workspaceId: string) {
  try {
    await runWorkspaceWrite(workspaceId, () =>
      recurringExpensesService.archive(recurringId, workspaceId),
    );

    revalidateTag(CACHE_TAGS.recurring, "max");
    revalidatePath("/dashboard/budgets");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
