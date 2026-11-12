import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/savings-goals/savings-goals.service` for writes
 * and `@/features/savings-goals/savings-goals.repository` for persistence-only access.
 */
import { savingsGoalsRepository } from "@/features/savings-goals/savings-goals.repository";
import { savingsGoalsService } from "@/features/savings-goals/savings-goals.service";
import type {
  CreateSavingsGoalInput,
  UpdateGoalProgressInput,
} from "@/features/savings-goals/schemas";

/** @deprecated Prefer NotFoundError from the service layer. Kept for barrel callers. */
export class SavingsGoalNotFoundError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "SavingsGoalNotFoundError";
  }
}

export async function createSavingsGoal(input: CreateSavingsGoalInput) {
  const existing = await savingsGoalsRepository.findByIdempotencyKey(
    input.workspaceId,
    input.idempotencyKey,
  );
  if (existing) return existing;
  return savingsGoalsRepository.create(input);
}

export async function updateSavingsGoalProgress(input: UpdateGoalProgressInput) {
  const goal = await savingsGoalsRepository.updateProgress(input);
  if (!goal) {
    throw new SavingsGoalNotFoundError("savingsGoalNotFound");
  }
  return goal;
}

export async function archiveSavingsGoal(goalId: string, workspaceId: string) {
  return savingsGoalsRepository.archive(goalId, workspaceId);
}

export const listSavingsGoals = (workspaceId: string) =>
  savingsGoalsService.listForWorkspace(workspaceId);
