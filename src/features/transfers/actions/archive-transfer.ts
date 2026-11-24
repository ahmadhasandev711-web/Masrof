"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { transfersService } from "@/features/transfers/transfers.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveTransferAction(
  transferId: string,
  workspaceId: string,
): Promise<{ error: string | null }> {
  const tErrors = await getTranslations("errors");
  try {
    const result = await runWorkspaceWrite(workspaceId, () =>
      transfersService.archive(transferId, workspaceId),
    );
    if (!result.ok) {
      const code = result.error.code as Parameters<typeof tErrors>[0];
      try {
        return { error: tErrors(code) };
      } catch {
        return { error: result.error.message };
      }
    }

    revalidateTag(CACHE_TAGS.transfers, "max");
    revalidateTag(CACHE_TAGS.accounts, "max");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
    return { error: null };
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return { error: tErrors("unauthorized") };
    throw error;
  }
}
