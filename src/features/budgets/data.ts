import "server-only";

import { unstable_cache } from "next/cache";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BudgetModel } from "@/models/budget";
import { CategoryModel } from "@/models/category";
import { TransactionModel } from "@/models/transaction";
import { toMinorUnits } from "@/lib/money";
import { resolveAccountCurrency } from "@/lib/currency";
import { transactionAccountCurrencyStages } from "@/lib/currency/transaction-pipeline";
import { sumByKeyInBase } from "@/lib/currency/report-conversion";
import { getWorkspaceExchangeContext } from "@/features/workspaces/exchange-context";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CreateBudgetInput } from "@/features/budgets/schemas";

export class InvalidBudgetCategoryError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "InvalidBudgetCategoryError";
  }
}

export async function createBudget(input: CreateBudgetInput) {
  await connectToDatabase();

  if (input.categoryId) {
    // A budget only makes sense against an expense category, and it must
    // actually be usable by this workspace (system or workspace-owned).
    const category = await CategoryModel.findOne({
      _id: input.categoryId,
      kind: "expense",
      isArchived: false,
      $or: [{ workspaceId: null }, { workspaceId: input.workspaceId }],
    });

    if (!category) {
      throw new InvalidBudgetCategoryError("budgetCategoryInvalid");
    }
  }

  const budget = await BudgetModel.create({
    workspaceId: input.workspaceId,
    name: input.name,
    categoryId: input.categoryId || null,
    amount: toMinorUnits(input.amount),
  });

  return budget.toObject();
}

export async function archiveBudget(budgetId: string, workspaceId: string) {
  await connectToDatabase();
  return BudgetModel.findOneAndUpdate(
    { _id: budgetId, workspaceId },
    { isArchived: true },
    { returnDocument: "after" },
  ).lean();
}

/**
 * Lists a workspace's active budgets, each annotated with how much has
 * been spent this calendar month and the resulting percentage used.
 *
 * Two aggregation queries total (not one per budget): the per-category
 * expense totals for this month is enough to answer every
 * category-specific budget, plus their sum covers the one workspace-wide
 * total every workspace-wide budget shares.
 */
export const listBudgetsWithProgress = unstable_cache(
  async (workspaceId: string) => {
    await connectToDatabase();

    const { baseCurrency, exchangeRates } = await getWorkspaceExchangeContext(workspaceId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [budgets, perCategoryTotals] = await Promise.all([
      BudgetModel.find({ workspaceId, isArchived: false })
        .populate("categoryId", "name icon")
        .sort({ createdAt: 1 })
        .lean(),
      TransactionModel.aggregate<{
        _id: { categoryId: mongoose.Types.ObjectId; currency: string | null };
        total: number;
      }>([
        {
          $match: {
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
            type: "expense",
            isArchived: false,
            transactionDate: { $gte: startOfMonth, $lt: startOfNextMonth },
          },
        },
        ...transactionAccountCurrencyStages(baseCurrency),
        {
          $group: {
            _id: { categoryId: "$categoryId", currency: "$currency" },
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const { totals: spentByCategoryConverted, canConvertAll } = sumByKeyInBase(
      perCategoryTotals.map((row) => ({
        key: row._id.categoryId.toString(),
        currency: resolveAccountCurrency(row._id.currency, baseCurrency),
        amountMinor: row.total,
      })),
      baseCurrency,
      exchangeRates,
    );

    let workspaceTotalSpent = 0;
    if (canConvertAll) {
      for (const spent of spentByCategoryConverted.values()) {
        workspaceTotalSpent += spent ?? 0;
      }
    }

    return budgets.map((budget) => {
      const spent = !canConvertAll
        ? null
        : budget.categoryId
          ? (spentByCategoryConverted.get(String((budget.categoryId as { _id: unknown })._id)) ?? 0)
          : workspaceTotalSpent;

      const percentage =
        spent != null && budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

      return {
        ...budget,
        spent: spent ?? 0,
        remaining: spent != null ? budget.amount - spent : budget.amount,
        percentage,
        conversionIncomplete: !canConvertAll,
      };
    });
  },
  ["budgets-with-progress"],
  { revalidate: 30, tags: [CACHE_TAGS.budgets] },
);
