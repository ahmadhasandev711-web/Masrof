"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { debtsService } from "@/features/debts/debts.service";
import { runWorkspaceWrite } from "@/server/kernel";

export async function archiveDebtAction(
  workspaceId: string,
  debtId: string,
): Promise<{ success: boolean; error: string | null }> {
  const tErrors = await getTranslations("errors");

  try {
    const result = await runWorkspaceWrite(workspaceId, () =>
      debtsService.archive(workspaceId, debtId),
    );

    if (!result.ok) {
      return { success: false, error: tErrors("debtNotFound") };
    }

    revalidatePath("/dashboard/debts");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (err: unknown) {
    if (isWorkspaceAuthorizationError(err)) {
      return { success: false, error: tErrors("unauthorized") };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : tErrors("unexpected"),
    };
  }
}
