import "server-only";

import { countSavingsGoalsForWorkspace } from "@/features/subscriptions/plan-usage";
import type {
  CreateSavingsGoalInput,
  UpdateGoalProgressInput,
} from "@/features/savings-goals/schemas";
import {
  SavingsGoalsRepository,
  savingsGoalsRepository,
} from "@/features/savings-goals/savings-goals.repository";
import { NotFoundError } from "@/server/kernel/errors";
import { err, ok, type Result } from "@/server/kernel/result";
import { requirePlanFeature, requireQuantityLimit } from "@/server/kernel/plan-policy";

export class SavingsGoalsService {
  constructor(private readonly repo: SavingsGoalsRepository = savingsGoalsRepository) {}

  async create(userId: string, input: CreateSavingsGoalInput) {
    const feature = await requirePlanFeature(userId, input.workspaceId, "savingsGoals");
    if (!feature.ok) return feature;

    const goalCount = await countSavingsGoalsForWorkspace(input.workspaceId);
    const limit = await requireQuantityLimit(
      userId,
      input.workspaceId,
      "maxSavingsGoals",
      goalCount,
    );
    if (!limit.ok) return limit;

    const existing = await this.repo.findByIdempotencyKey(input.workspaceId, input.idempotencyKey);
    if (existing) return ok(existing);

    const created = await this.repo.create(input);
    return ok(created);
  }

  async updateProgress(
    input: UpdateGoalProgressInput,
  ): Promise<Result<NonNullable<Awaited<ReturnType<SavingsGoalsRepository["updateProgress"]>>>>> {
    const updated = await this.repo.updateProgress(input);
    if (!updated) return err(new NotFoundError("savingsGoalNotFound"));
    return ok(updated);
  }

  async archive(goalId: string, workspaceId: string) {
    const archived = await this.repo.archive(goalId, workspaceId);
    if (!archived) return err(new NotFoundError("savingsGoalNotFound"));
    return ok(archived);
  }

  listForWorkspace(workspaceId: string) {
    return this.repo.listForWorkspace(workspaceId);
  }
}

export const savingsGoalsService = new SavingsGoalsService();
