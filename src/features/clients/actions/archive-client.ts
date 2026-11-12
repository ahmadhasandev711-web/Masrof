"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { clientsService } from "@/features/clients/clients.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type ArchiveClientState = {
  error: string | null;
};

export async function archiveClientAction(
  clientId: string,
  workspaceId: string,
): Promise<ArchiveClientState> {
  const tErrors = await getTranslations("errors");
  try {
    const result = await runWorkspaceWrite(workspaceId, () =>
      clientsService.archive(clientId, workspaceId),
    );
    if (!result.ok) {
      return { error: tErrors("clientNotFound") };
    }
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) {
      return { error: tErrors("unauthorized") };
    }
    throw error;
  }

  revalidatePath("/dashboard/clients");
  revalidateTag(CACHE_TAGS.clients, "max");
  return { error: null };
}
