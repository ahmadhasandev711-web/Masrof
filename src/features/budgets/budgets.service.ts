import "server-only";

import type { CreateBudgetInput } from "@/features/budgets/schemas";
import {
  BudgetsRepository,
  InvalidBudgetCategoryError,
  budgetsRepository,
} from "@/features/budgets/budgets.repository";
import { NotFoundError } from "@/server/kernel/errors";
import { err, ok, type Result } from "@/server/kernel/result";
import { requirePlanFeature } from "@/server/kernel/plan-policy";

function asBudgetResult<T>(error: unknown): Result<T> | null {
  if (error instanceof InvalidBudgetCategoryError) {
    return err(error);
  }
  return null;
}

export class BudgetsService {
  constructor(private readonly repo: BudgetsRepository = budgetsRepository) {}

  async create(userId: string, input: CreateBudgetInput) {
    const feature = await requirePlanFeature(userId, input.workspaceId, "budgets");
    if (!feature.ok) return feature;

    const existing = await this.repo.findByIdempotencyKey(input.workspaceId, input.idempotencyKey);
    if (existing) return ok(existing);

    try {
      const created = await this.repo.create(input);
      return ok(created);
    } catch (error) {
      const mapped = asBudgetResult<Awaited<ReturnType<BudgetsRepository["create"]>>>(error);
      if (mapped) return mapped;
      throw error;
    }
  }

  async archive(budgetId: string, workspaceId: string) {
    const archived = await this.repo.archive(budgetId, workspaceId);
    if (!archived) return err(new NotFoundError("budgetNotFound"));
    return ok(archived);
  }

  listWithProgress(workspaceId: string) {
    return this.repo.listWithProgress(workspaceId);
  }
}

export const budgetsService = new BudgetsService();
