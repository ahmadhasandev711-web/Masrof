"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { transfersService } from "@/features/transfers/transfers.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveTransferAction(transferId: string, workspaceId: string) {
  try {
    await runWorkspaceWrite(workspaceId, () =>
      transfersService.archive(transferId, workspaceId),
    );

    revalidateTag(CACHE_TAGS.transfers, "max");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
