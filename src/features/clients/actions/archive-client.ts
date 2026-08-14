"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveClient } from "@/features/clients/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveClientAction(clientId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await archiveClient(clientId, workspaceId);

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/clients");
  revalidateTag(CACHE_TAGS.clients, "max");
}
