import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/debts/debts.service` for writes
 * and `@/features/debts/debts.repository` for persistence-only access.
 */
import type { SupportedCurrency } from "@/lib/currency/constants";
import type { CreateDebtInput, RecordDebtPaymentInput } from "@/features/debts/schemas";
import { debtsRepository } from "@/features/debts/debts.repository";
import { debtsService } from "@/features/debts/debts.service";

export {
  DebtNotFoundError,
  DebtAccountNotFoundError,
  DebtOverpaymentError,
} from "@/features/debts/debts.errors";

export { calculateDebtSummaryFromDebts } from "@/features/debts/calculations";

export const getDebtsForWorkspace = (
  workspaceId: string,
  options?: { status?: "active" | "paid" },
) => debtsService.listForWorkspace(workspaceId, options);

export const getDebtSummary = (workspaceId: string, currency: string) =>
  debtsService.getSummary(workspaceId, currency);

export const getDebtPayments = (workspaceId: string, debtId: string) =>
  debtsService.listPayments(workspaceId, debtId);

export async function createDebt(
  input: CreateDebtInput & { currency: SupportedCurrency | string },
): Promise<string> {
  return debtsRepository.create(input);
}

export async function recordDebtPayment(
  input: RecordDebtPaymentInput,
  userId: string,
): Promise<{ paymentId: string; transactionId: string }> {
  return debtsRepository.recordPayment(input, userId);
}

export async function archiveDebt(workspaceId: string, debtId: string): Promise<boolean> {
  return debtsRepository.archive(workspaceId, debtId);
}
