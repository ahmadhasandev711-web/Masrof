import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/transactions/transactions.service` for writes
 * and `@/features/transactions/transactions.repository` for persistence-only access.
 */
import {
  InvalidTransactionReferenceError,
  transactionsRepository,
  type RecentTransactionItem,
  type WorkspaceSummary,
} from "@/features/transactions/transactions.repository";
import { transactionsService } from "@/features/transactions/transactions.service";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
} from "@/features/transactions/schemas";
import type { AppLocale } from "@/i18n/config";

export { InvalidTransactionReferenceError };
export type { RecentTransactionItem, WorkspaceSummary };

export async function createTransaction(input: CreateTransactionInput, userId: string) {
  return transactionsRepository.create(input, userId);
}

export async function updateTransaction(input: UpdateTransactionInput, workspaceId: string) {
  return transactionsRepository.update(input, workspaceId);
}

export async function archiveTransaction(transactionId: string, workspaceId: string) {
  return transactionsRepository.archive(transactionId, workspaceId);
}

export const listTransactions = (filters: TransactionFilters) =>
  transactionsService.list(filters);

export async function listTransactionsForExport(
  filters: Omit<TransactionFilters, "page" | "pageSize">,
) {
  return transactionsRepository.listForExport(filters);
}

export const getWorkspaceSummary = (
  workspaceId: string,
  range?: { from?: Date; to?: Date },
): Promise<WorkspaceSummary> => transactionsService.getWorkspaceSummary(workspaceId, range);

export const getRecentTransactions = (
  workspaceId: string,
  limit = 5,
  locale: AppLocale = "ar",
): Promise<RecentTransactionItem[]> => transactionsService.getRecent(workspaceId, limit, locale);
