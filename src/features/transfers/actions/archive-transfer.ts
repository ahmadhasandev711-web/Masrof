"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { isWorkspaceAuthorizationError, verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveTransfer } from "@/features/transfers/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveTransferAction(transferId: string, workspaceId: string) {
  try {
    const session = await requireSession();
    await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

    await archiveTransfer(transferId, workspaceId);

    revalidateTag(CACHE_TAGS.transfers, "max");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
