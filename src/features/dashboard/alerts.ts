import "server-only";

import { cache } from "react";
import { dashboardRepository } from "@/features/dashboard/dashboard.repository";
import { budgetsService } from "@/features/budgets/budgets.service";
import { recurringExpensesService } from "@/features/recurring-expenses/recurring-expenses.service";
import { projectsService } from "@/features/projects/projects.service";

export type BudgetWarning = {
  id: string;
  name: string;
  percentage: number;
  spent: number;
  amount: number;
  status: "warning" | "exceeded";
};

/** Dashboard home stats — cached per request (moved from dashboard/data barrel). */
const getDashboardOverview = cache(async (workspaceId: string) =>
  dashboardRepository.getOverview(workspaceId),
);

export const getDashboardAlerts = cache(async (workspaceId: string) => {
  const [budgets, dueRecurring, receivableProjects] = await Promise.all([
    budgetsService.listWithProgress(workspaceId),
    recurringExpensesService.listDue(workspaceId),
    projectsService.listReceivable(workspaceId),
  ]);

  const budgetWarnings: BudgetWarning[] = budgets.flatMap((budget) => {
    if (budget.percentage == null || budget.spent == null || budget.percentage < 80) return [];
    return [
      {
        id: String(budget._id),
        name: budget.name,
        percentage: budget.percentage,
        spent: budget.spent,
        amount: budget.amount,
        status: budget.percentage >= 100 ? ("exceeded" as const) : ("warning" as const),
      },
    ];
  });

  return { budgetWarnings, dueRecurring, receivableProjects };
});

export const getDashboardHomeData = cache(async (workspaceId: string) => {
  const [overview, alerts] = await Promise.all([
    getDashboardOverview(workspaceId),
    getDashboardAlerts(workspaceId),
  ]);

  return { ...overview, ...alerts };
});
