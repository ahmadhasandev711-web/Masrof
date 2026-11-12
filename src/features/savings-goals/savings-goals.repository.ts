import "server-only";

import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SavingsGoalModel } from "@/models/savings-goal";
import { toMinorUnits } from "@/lib/money";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type {
  CreateSavingsGoalInput,
  UpdateGoalProgressInput,
} from "@/features/savings-goals/schemas";
import {
  findWorkspaceIdempotentId,
  registerWorkspaceIdempotentResource,
} from "@/lib/idempotency/workspace-resource";

export class SavingsGoalsRepository {
  async findByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    await connectToDatabase();
    const existingId = await findWorkspaceIdempotentId(workspaceId, idempotencyKey);
    if (!existingId) return null;
    return SavingsGoalModel.findOne({ _id: existingId, workspaceId }).lean();
  }

  async create(input: CreateSavingsGoalInput) {
    await connectToDatabase();

    const goal = await SavingsGoalModel.create({
      workspaceId: input.workspaceId,
      name: input.name,
      targetAmount: toMinorUnits(input.targetAmount),
      deadline: input.deadline ?? null,
    });

    await registerWorkspaceIdempotentResource(
      input.workspaceId,
      input.idempotencyKey,
      "savingsGoal",
      goal._id.toString(),
    );

    return goal.toObject();
  }

  async updateProgress(input: UpdateGoalProgressInput) {
    await connectToDatabase();

    const increment = toMinorUnits(input.amount);

    return SavingsGoalModel.findOneAndUpdate(
      { _id: input.goalId, workspaceId: input.workspaceId, isArchived: false },
      { $inc: { currentAmount: increment } },
      { returnDocument: "after" },
    ).lean();
  }

  async archive(goalId: string, workspaceId: string) {
    await connectToDatabase();
    return SavingsGoalModel.findOneAndUpdate(
      { _id: goalId, workspaceId },
      { isArchived: true },
      { returnDocument: "after" },
    ).lean();
  }

  listForWorkspace = unstable_cache(
    async (workspaceId: string) => {
      await connectToDatabase();

      const goals = await SavingsGoalModel.find({ workspaceId, isArchived: false })
        .sort({ createdAt: 1 })
        .lean();

      return goals.map((goal) => {
        const percentage =
          goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;

        return {
          ...goal,
          remaining: goal.targetAmount - goal.currentAmount,
          percentage,
        };
      });
    },
    ["savings-goals-for-workspace"],
    { revalidate: 30, tags: [CACHE_TAGS.goals] },
  );
}

export const savingsGoalsRepository = new SavingsGoalsRepository();
