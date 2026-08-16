"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import {
  recordRecurringExpense,
  archiveRecurringExpense,
} from "@/features/recurring-expenses/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function recordRecurringExpenseAction(recurringId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await recordRecurringExpense(recurringId, workspaceId, session.user.id);

  revalidateTag(CACHE_TAGS.recurring, "max");
  revalidateTag(CACHE_TAGS.budgets, "max");
  revalidatePath("/dashboard/budgets");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
}

export async function archiveRecurringExpenseAction(recurringId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await archiveRecurringExpense(recurringId, workspaceId);

  revalidateTag(CACHE_TAGS.recurring, "max");
  revalidatePath("/dashboard/budgets");
}
