"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { isWorkspaceAuthorizationError, verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
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
  try {
    await verifyWorkspaceWriteAccess(session.user.id, workspaceId);
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) {
      return { error: tErrors("unauthorized") };
    }
    throw error;
  }

  const archived = await archiveClient(clientId, workspaceId);
  if (!archived) {
    return { error: tErrors("clientNotFound") };
  }

  revalidatePath("/dashboard/clients");
  revalidateTag(CACHE_TAGS.clients, "max");
  return { error: null };
}