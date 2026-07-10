import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { SavingsGoalModel } from "@/models/savings-goal";
import { toMinorUnits } from "@/lib/money";
import type { CreateSavingsGoalInput, UpdateGoalProgressInput } from "@/features/savings-goals/schemas";

export class SavingsGoalNotFoundError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "SavingsGoalNotFoundError";
  }
}

export async function createSavingsGoal(input: CreateSavingsGoalInput) {
  await connectToDatabase();

  const goal = await SavingsGoalModel.create({
    workspaceId: input.workspaceId,
    name: input.name,
    targetAmount: toMinorUnits(input.targetAmount),
    deadline: input.deadline ?? null,
  });

  return goal.toObject();
}

export async function updateSavingsGoalProgress(input: UpdateGoalProgressInput) {
  await connectToDatabase();

  const increment = toMinorUnits(input.amount);

  const goal = await SavingsGoalModel.findOneAndUpdate(
    { _id: input.goalId, workspaceId: input.workspaceId, isArchived: false },
    { $inc: { currentAmount: increment } },
    { returnDocument: "after" },
  ).lean();

  if (!goal) {
    throw new SavingsGoalNotFoundError("savingsGoalNotFound");
  }

  return goal;
}

export async function archiveSavingsGoal(goalId: string, workspaceId: string) {
  await connectToDatabase();
  return SavingsGoalModel.findOneAndUpdate(
    { _id: goalId, workspaceId },
    { isArchived: true },
    { returnDocument: "after" },
  ).lean();
}

export async function listSavingsGoals(workspaceId: string) {
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
}
