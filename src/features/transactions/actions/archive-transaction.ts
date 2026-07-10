"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveTransaction } from "@/features/transactions/data";

export async function archiveTransactionAction(transactionId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await archiveTransaction(transactionId, workspaceId);

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
}
