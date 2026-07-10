"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveAccount } from "@/features/accounts/data";

export async function archiveAccountAction(accountId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await archiveAccount(accountId, workspaceId);

  revalidatePath("/dashboard/accounts");
}
