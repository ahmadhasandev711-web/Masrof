"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { isWorkspaceAuthorizationError, verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveAccount } from "@/features/accounts/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveAccountAction(accountId: string, workspaceId: string) {
  try {
    const session = await requireSession();
    await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

    await archiveAccount(accountId, workspaceId);

    revalidatePath("/dashboard/accounts");
    revalidateTag(CACHE_TAGS.accounts, "max");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
