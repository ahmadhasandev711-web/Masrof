"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { transactionsService } from "@/features/transactions/transactions.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveTransactionAction(transactionId: string, workspaceId: string) {
  try {
    await runWorkspaceWrite(workspaceId, () =>
      transactionsService.archive(transactionId, workspaceId),
    );

    revalidateTag(CACHE_TAGS.budgets, "max");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
