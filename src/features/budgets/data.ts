import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/budgets/budgets.service` for writes
 * and `@/features/budgets/budgets.repository` for persistence-only access.
 */
import { budgetsRepository } from "@/features/budgets/budgets.repository";
import { budgetsService } from "@/features/budgets/budgets.service";
import type { CreateBudgetInput } from "@/features/budgets/schemas";

export { InvalidBudgetCategoryError } from "@/features/budgets/budgets.repository";

export async function createBudget(input: CreateBudgetInput) {
  const existing = await budgetsRepository.findByIdempotencyKey(
    input.workspaceId,
    input.idempotencyKey,
  );
  if (existing) return existing;
  return budgetsRepository.create(input);
}

export async function archiveBudget(budgetId: string, workspaceId: string) {
  return budgetsRepository.archive(budgetId, workspaceId);
}

export const listBudgetsWithProgress = (workspaceId: string) =>
  budgetsService.listWithProgress(workspaceId);
