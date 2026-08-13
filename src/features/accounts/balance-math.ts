/**
 * Pure balance formula used by recalculate and incremental updates.
 * Transfers are first-class: out decreases, in increases.
 */
export function computeAccountBalanceMinor(input: {
  openingBalance: number;
  incomeTotal: number;
  expenseTotal: number;
  transferInTotal: number;
  transferOutTotal: number;
}): number {
  return (
    input.openingBalance +
    input.incomeTotal -
    input.expenseTotal +
    input.transferInTotal -
    input.transferOutTotal
  );
}
