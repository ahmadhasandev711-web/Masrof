import "server-only";

import { cache } from "react";
import { getDashboardOverview } from "@/features/dashboard/data";
import { listBudgetsWithProgress } from "@/features/budgets/data";
import { listDueRecurringExpenses } from "@/features/recurring-expenses/data";
import { listReceivableProjects } from "@/features/projects/data";

export type BudgetWarning = {
  id: string;
  name: string;
  percentage: number;
  spent: number;
  amount: number;
  status: "warning" | "exceeded";
};

export const getDashboardAlerts = cache(async (workspaceId: string) => {
  const [budgets, dueRecurring, receivableProjects] = await Promise.all([
    listBudgetsWithProgress(workspaceId),
    listDueRecurringExpenses(workspaceId),
    listReceivableProjects(workspaceId),
  ]);

  const budgetWarnings: BudgetWarning[] = budgets
    .filter((budget) => budget.percentage >= 80)
    .map((budget) => ({
      id: String(budget._id),
      name: budget.name,
      percentage: budget.percentage,
      spent: budget.spent,
      amount: budget.amount,
      status: budget.percentage >= 100 ? "exceeded" : "warning",
    }));

  return { budgetWarnings, dueRecurring, receivableProjects };
});

export const getDashboardHomeData = cache(async (workspaceId: string) => {
  const [overview, alerts] = await Promise.all([
    getDashboardOverview(workspaceId),
    getDashboardAlerts(workspaceId),
  ]);

  return { ...overview, ...alerts };
});
