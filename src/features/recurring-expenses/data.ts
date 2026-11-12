import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/recurring-expenses/recurring-expenses.service` for writes
 * and `@/features/recurring-expenses/recurring-expenses.repository` for persistence-only access.
 */
import {
  recurringExpensesRepository,
  type RecurringExpenseListItem,
} from "@/features/recurring-expenses/recurring-expenses.repository";
import { recurringExpensesService } from "@/features/recurring-expenses/recurring-expenses.service";
import type { CreateRecurringExpenseInput } from "@/features/recurring-expenses/schemas";

export {
  InvalidRecurringExpenseError,
  type RecurringExpenseListItem,
} from "@/features/recurring-expenses/recurring-expenses.repository";

export async function createRecurringExpense(input: CreateRecurringExpenseInput) {
  const existing = await recurringExpensesRepository.findByIdempotencyKey(
    input.workspaceId,
    input.idempotencyKey,
  );
  if (existing) return existing;
  return recurringExpensesRepository.create(input);
}

export const listRecurringExpenses = (workspaceId: string, limit?: number) =>
  recurringExpensesService.listForWorkspace(workspaceId, limit);

export async function archiveRecurringExpense(recurringId: string, workspaceId: string) {
  return recurringExpensesRepository.archive(recurringId, workspaceId);
}

export async function recordRecurringExpense(
  recurringId: string,
  workspaceId: string,
  userId: string,
) {
  return recurringExpensesRepository.record(recurringId, workspaceId, userId);
}

export const listDueRecurringExpenses = (workspaceId: string): Promise<RecurringExpenseListItem[]> =>
  recurringExpensesService.listDue(workspaceId);
