"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveClient } from "@/features/clients/data";

export async function archiveClientAction(clientId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await archiveClient(clientId, workspaceId);

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/projects");
}
