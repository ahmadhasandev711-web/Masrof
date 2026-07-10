"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import {
  recordRecurringExpense,
  archiveRecurringExpense,
} from "@/features/recurring-expenses/data";

export async function recordRecurringExpenseAction(recurringId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await recordRecurringExpense(recurringId, workspaceId, session.user.id);

  revalidatePath("/dashboard/budgets");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
}

export async function archiveRecurringExpenseAction(recurringId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await archiveRecurringExpense(recurringId, workspaceId);

  revalidatePath("/dashboard/budgets");
}
