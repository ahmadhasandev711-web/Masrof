"use server";

import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceAccess } from "@/features/workspaces/access";
import { getDebtPayments } from "@/features/debts/data";
import type { DebtPaymentItem } from "@/features/debts/types";

export async function getDebtPaymentsAction(
  workspaceId: string,
  debtId: string,
): Promise<{ success: boolean; payments: DebtPaymentItem[]; error: string | null }> {
  const session = await requireSession();
  await verifyWorkspaceAccess(session.user.id, workspaceId);

  try {
    const payments = await getDebtPayments(workspaceId, debtId);
    return { success: true, payments, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      payments: [],
      error: err instanceof Error ? err.message : "Failed to load payments",
    };
  }
}
