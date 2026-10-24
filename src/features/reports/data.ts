import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { TransactionModel } from "@/models/transaction";
import type { TransactionType } from "@/models/transaction";
import { resolveAccountCurrency } from "@/lib/currency";
import { transactionAccountCurrencyStages } from "@/lib/currency/transaction-pipeline";
import { sumByKeyInBase, sumAmountsInBase, type ConversionMeta } from "@/lib/currency/report-conversion";
import { getWorkspaceExchangeContext } from "@/features/workspaces/exchange-context";
import { resolveCategoryLabel } from "@/features/categories/labels";
import type { AppLocale } from "@/i18n/config";

export type CategoryBreakdownRow = {
  categoryId: mongoose.Types.ObjectId;
  name: string;
  icon: string | null;
  total: number | null;
};

export type CategoryBreakdownResult = {
  rows: CategoryBreakdownRow[];
} & ConversionMeta;

/**
 * Sums transactions of one kind (income/expense) grouped by category
 * within a date range, sorted highest-spend-first — answers "where did my
 * money actually go?" which is the whole point of a category report.
 */
export async function getCategoryBreakdown(
  workspaceId: string,
  kind: TransactionType,
  range: { from: Date; to: Date },
  locale: AppLocale = "ar",
): Promise<CategoryBreakdownResult> {
  await connectToDatabase();

  const { baseCurrency, exchangeRates } = await getWorkspaceExchangeContext(workspaceId);

  const rawRows = await TransactionModel.aggregate<{
    _id: { categoryId: mongoose.Types.ObjectId; currency: string | null };
    total: number;
    name: string;
    nameEn: string | null;
    icon: string | null;
  }>([
    {
      $match: {
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        type: kind,
        isArchived: false,
        transactionDate: { $gte: range.from, $lte: range.to },
      },
    },
    ...transactionAccountCurrencyStages(baseCurrency),
    {
      $group: {
        _id: { categoryId: "$categoryId", currency: "$currency" },
        total: { $sum: "$amount" },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id.categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $project: {
        _id: 1,
        total: 1,
        name: "$category.name",
        nameEn: "$category.nameEn",
        icon: "$category.icon",
      },
    },
  ]);

  const { totals, ...conversion } = sumByKeyInBase(
    rawRows.map((row) => ({
      key: String(row._id.categoryId),
      currency: resolveAccountCurrency(row._id.currency, baseCurrency),
      amountMinor: row.total,
    })),
    baseCurrency,
    exchangeRates,
  );

  const metaByCategory = new Map(
    rawRows.map((row) => [
      String(row._id.categoryId),
      { name: row.name, nameEn: row.nameEn, icon: row.icon },
    ]),
  );

  const rows: CategoryBreakdownRow[] = [...totals.entries()]
    .map(([categoryId, total]) => {
      const meta = metaByCategory.get(categoryId);
      return {
        categoryId: new mongoose.Types.ObjectId(categoryId),
        name: meta
          ? resolveCategoryLabel({ name: meta.name, nameEn: meta.nameEn }, locale)
          : "—",
        icon: meta?.icon ?? null,
        total,
      };
    })
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));

  return { rows, ...conversion };
}

export type MonthlyTrendRow = {
  label: string;
  year: number;
  month: number;
  income: number | null;
  expense: number | null;
};

export type MonthlyTrendResult = {
  months: MonthlyTrendRow[];
} & ConversionMeta;

/**
 * Income/expense totals per calendar month for the last `monthsCount`
 * months (including the current, partial one) — the data behind the
 * "monthly income vs expenses" view.
 */
export async function getMonthlyTrend(
  workspaceId: string,
  monthsCount: number,
  locale = "ar-EG",
): Promise<MonthlyTrendResult> {
  await connectToDatabase();

  const { baseCurrency, exchangeRates } = await getWorkspaceExchangeContext(workspaceId);

  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);

  const rows = await TransactionModel.aggregate<{
    _id: { year: number; month: number; currency: string | null; type: string };
    total: number;
  }>([
    {
      $match: {
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        isArchived: false,
        transactionDate: { $gte: rangeStart },
      },
    },
    ...transactionAccountCurrencyStages(baseCurrency),
    {
      $group: {
        _id: {
          year: { $year: "$transactionDate" },
          month: { $month: "$transactionDate" },
          currency: "$currency",
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  type MonthKey = string;
  const incomeByMonth = new Map<MonthKey, Array<{ currency: typeof baseCurrency; amountMinor: number }>>();
  const expenseByMonth = new Map<MonthKey, Array<{ currency: typeof baseCurrency; amountMinor: number }>>();

  for (const row of rows) {
    const key = `${row._id.year}-${row._id.month}`;
    const currency = resolveAccountCurrency(row._id.currency, baseCurrency);
    const entry = { currency, amountMinor: row.total };
    const bucket = row._id.type === "income" ? incomeByMonth : expenseByMonth;
    const list = bucket.get(key) ?? [];
    list.push(entry);
    bucket.set(key, list);
  }

  const allMissing = new Set<string>();
  let canConvertAll = true;

  const monthTotals = new Map<
    MonthKey,
    { income: number | null; expense: number | null; year: number; month: number }
  >();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    monthTotals.set(key, {
      income: null,
      expense: null,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    });
  }

  for (const [key, monthMeta] of monthTotals) {
    const incomeResult = sumAmountsInBase(incomeByMonth.get(key) ?? [], baseCurrency, exchangeRates);
    const expenseResult = sumAmountsInBase(expenseByMonth.get(key) ?? [], baseCurrency, exchangeRates);

    if (!incomeResult.canConvertAll || !expenseResult.canConvertAll) {
      canConvertAll = false;
      incomeResult.missingRates.forEach((c) => allMissing.add(c));
      expenseResult.missingRates.forEach((c) => allMissing.add(c));
    }

    monthMeta.income = incomeResult.totalMinor ?? 0;
    monthMeta.expense = expenseResult.totalMinor ?? 0;

    if (!incomeResult.canConvertAll) monthMeta.income = null;
    if (!expenseResult.canConvertAll) monthMeta.expense = null;
  }

  const months: MonthlyTrendRow[] = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const row = monthTotals.get(key)!;
    months.push({
      label: new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }).format(date),
      year: row.year,
      month: row.month,
      income: row.income,
      expense: row.expense,
    });
  }

  return {
    months,
    missingRates: [...allMissing].sort((a, b) => a.localeCompare(b)) as typeof baseCurrency[],
    canConvertAll,
  };
}
