"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { isWorkspaceAuthorizationError, verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveDebt } from "@/features/debts/data";

export async function archiveDebtAction(
  workspaceId: string,
  debtId: string,
): Promise<{ success: boolean; error: string | null }> {
  const session = await requireSession();
  const tErrors = await getTranslations("errors");

  try {
    await verifyWorkspaceWriteAccess(session.user.id, workspaceId);
    await archiveDebt(workspaceId, debtId);
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
