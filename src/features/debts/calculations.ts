import type { DebtSummary } from "@/features/debts/types";

/**
 * Pure calculation function for computing debt summary metrics in-memory
 * without database round-trips.
 */
export function calculateDebtSummaryFromDebts(
  debts: Array<{ totalAmount: number; paidAmount: number; status: string }>,
  currency: string,
): DebtSummary {
  let totalLiabilities = 0;
  let totalPaid = 0;
  let activeCount = 0;
  let paidCount = 0;

  for (const debt of debts) {
    totalLiabilities += debt.totalAmount ?? 0;
    totalPaid += debt.paidAmount ?? 0;
    if (debt.status === "paid") {
      paidCount++;
    } else {
      activeCount++;
    }
  }

  const remainingLiabilities = Math.max(0, totalLiabilities - totalPaid);

  return {
    totalLiabilities,
    totalPaid,
    remainingLiabilities,
    activeCount,
    paidCount,
    currency,
  };
}
