"use server";

import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceAccess } from "@/features/workspaces/access";
import { debtsService } from "@/features/debts/debts.service";
import type { DebtPaymentItem } from "@/features/debts/types";

export async function getDebtPaymentsAction(
  workspaceId: string,
  debtId: string,
): Promise<{ success: boolean; payments: DebtPaymentItem[]; error: string | null }> {
  const session = await requireSession();
  await verifyWorkspaceAccess(session.user.id, workspaceId);

  try {
    const payments = await debtsService.listPayments(workspaceId, debtId);
    return { success: true, payments, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      payments: [],
      error: err instanceof Error ? err.message : "Failed to load payments",
    };
  }
}
