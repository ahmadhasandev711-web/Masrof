import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientModel } from "@/models/client";
import { InvoiceModel } from "@/models/invoice";
import { ProjectModel } from "@/models/project";
import { RecurringExpenseModel } from "@/models/recurring-expense";
import { SavingsGoalModel } from "@/models/savings-goal";

function startOfUtcMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function countInvoicesCreatedThisMonth(workspaceId: string): Promise<number> {
  await connectToDatabase();
  return InvoiceModel.countDocuments({
    workspaceId,
    createdAt: { $gte: startOfUtcMonth() },
  });
}

export async function countClientsForWorkspace(workspaceId: string): Promise<number> {
  await connectToDatabase();
  return ClientModel.countDocuments({ workspaceId, isArchived: false });
}

export async function countActiveProjectsForWorkspace(workspaceId: string): Promise<number> {
  await connectToDatabase();
  return ProjectModel.countDocuments({
    workspaceId,
    isArchived: false,
    status: "active",
  });
}

export async function countSavingsGoalsForWorkspace(workspaceId: string): Promise<number> {
  await connectToDatabase();
  return SavingsGoalModel.countDocuments({ workspaceId, isArchived: false });
}

export async function countRecurringExpensesForWorkspace(workspaceId: string): Promise<number> {
  await connectToDatabase();
  return RecurringExpenseModel.countDocuments({ workspaceId, isArchived: false });
}
