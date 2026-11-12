"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { accountsService } from "@/features/accounts/accounts.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveAccountAction(accountId: string, workspaceId: string) {
  try {
    await runWorkspaceWrite(workspaceId, () => accountsService.archive(accountId, workspaceId));
    revalidatePath("/dashboard/accounts");
    revalidateTag(CACHE_TAGS.accounts, "max");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
