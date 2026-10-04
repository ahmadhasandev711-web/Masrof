"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveClient } from "@/features/clients/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type ArchiveClientState = {
  error: string | null;
};

export async function archiveClientAction(
  clientId: string,
  workspaceId: string,
): Promise<ArchiveClientState> {
  const session = await requireSession();
  const tErrors = await getTranslations("errors");
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  const archived = await archiveClient(clientId, workspaceId);
  if (!archived) {
    return { error: tErrors("clientNotFound") };
  }

  revalidatePath("/dashboard/clients");
  revalidateTag(CACHE_TAGS.clients, "max");
  return { error: null };
}