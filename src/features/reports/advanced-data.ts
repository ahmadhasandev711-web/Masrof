import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { TransactionModel } from "@/models/transaction";
import { ClientModel } from "@/models/client";
import { resolveAccountCurrency } from "@/lib/currency";
import { transactionAccountCurrencyStages } from "@/lib/currency/transaction-pipeline";
import {
  mergeConversionMeta,
  sumAmountsInBase,
  sumByKeyInBase,
  type ConversionMeta,
} from "@/lib/currency/report-conversion";
import { getWorkspaceExchangeContext } from "@/features/workspaces/exchange-context";

export type ClientReportRow = {
  clientId: string;
  clientName: string;
  income: number | null;
  expense: number | null;
  net: number | null;
  transactionCount: number;
};

export type ClientBreakdownResult = {
  rows: ClientReportRow[];
} & ConversionMeta;

export type CashFlowForecast = {
  avgMonthlyIncome: number | null;
  avgMonthlyExpense: number | null;
  projectedNetNext3Months: number | null;
  monthlySeries: CashFlowMonthPoint[];
} & ConversionMeta;

export type CashFlowMonthPoint = {
  monthKey: string;
  label: string;
  income: number | null;
  expense: number | null;
  net: number | null;
  runningBalance: number | null;
};

export async function getClientBreakdownReport(
  workspaceId: string,
): Promise<ClientBreakdownResult> {
  await connectToDatabase();

  const { baseCurrency, exchangeRates } = await getWorkspaceExchangeContext(workspaceId);

  const clients = await ClientModel.find({ workspaceId, isArchived: false }).lean();
  if (clients.length === 0) {
    return { rows: [], missingRates: [], canConvertAll: true };
  }

  const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

  const aggregates = await TransactionModel.aggregate<{
    _id: { clientId: mongoose.Types.ObjectId; type: string; currency: string | null };
    total: number;
    count: number;
  }>([
    {
      $match: {
        workspaceId: workspaceObjectId,
        isArchived: false,
        clientId: { $ne: null },
      },
    },
    ...transactionAccountCurrencyStages(baseCurrency),
    {
      $group: {
        _id: { clientId: "$clientId", type: "$type", currency: "$currency" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  type ClientKey = string;
  const incomeRows: Array<{ key: ClientKey; currency: typeof baseCurrency; amountMinor: number }> =
    [];
  const expenseRows: Array<{ key: ClientKey; currency: typeof baseCurrency; amountMinor: number }> =
    [];
  const countByClient = new Map<ClientKey, number>();

  for (const row of aggregates) {
    const clientId = String(row._id.clientId);
    const currency = resolveAccountCurrency(row._id.currency, baseCurrency);
    const entry = { key: clientId, currency, amountMinor: row.total };
    if (row._id.type === "income") incomeRows.push(entry);
    else expenseRows.push(entry);
    countByClient.set(clientId, (countByClient.get(clientId) ?? 0) + row.count);
  }

  const incomeTotals = sumByKeyInBase(incomeRows, baseCurrency, exchangeRates);
  const expenseTotals = sumByKeyInBase(expenseRows, baseCurrency, exchangeRates);
  const conversion = mergeConversionMeta(incomeTotals, expenseTotals);

  const rows = clients
    .map((client) => {
      const id = String(client._id);
      const income = incomeTotals.totals.get(id) ?? 0;
      const expense = expenseTotals.totals.get(id) ?? 0;
      const transactionCount = countByClient.get(id) ?? 0;
      const net =
        conversion.canConvertAll && income != null && expense != null ? income - expense : null;

      return {
        clientId: id,
        clientName: client.name,
        income: conversion.canConvertAll ? income : null,
        expense: conversion.canConvertAll ? expense : null,
        net,
        transactionCount,
      };
    })
    .filter((r) => r.transactionCount > 0)
    .sort((a, b) => (b.net ?? 0) - (a.net ?? 0));

  return { rows, ...conversion };
}

export async function getCashFlowForecast(workspaceId: string): Promise<CashFlowForecast> {
  await connectToDatabase();

  const { baseCurrency, exchangeRates } = await getWorkspaceExchangeContext(workspaceId);

  const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
  const since = new Date();
  since.setMonth(since.getMonth() - 3);

  const rows = await TransactionModel.aggregate<{
    _id: { month: number; type: string; currency: string | null };
    total: number;
  }>([
    {
      $match: {
        workspaceId: workspaceObjectId,
        isArchived: false,
        transactionDate: { $gte: since },
      },
    },
    ...transactionAccountCurrencyStages(baseCurrency),
    {
      $group: {
        _id: { month: { $month: "$transactionDate" }, type: "$type", currency: "$currency" },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const incomeRows: Array<{ currency: typeof baseCurrency; amountMinor: number }> = [];
  const expenseRows: Array<{ currency: typeof baseCurrency; amountMinor: number }> = [];

  for (const row of rows) {
    const currency = resolveAccountCurrency(row._id.currency, baseCurrency);
    const entry = { currency, amountMinor: row.total };
    if (row._id.type === "income") incomeRows.push(entry);
    else expenseRows.push(entry);
  }

  const incomeResult = sumAmountsInBase(incomeRows, baseCurrency, exchangeRates);
  const expenseResult = sumAmountsInBase(expenseRows, baseCurrency, exchangeRates);
  const conversion = mergeConversionMeta(incomeResult, expenseResult);

  const income = incomeResult.totalMinor ?? 0;
  const expense = expenseResult.totalMinor ?? 0;

  const avgMonthlyIncome = conversion.canConvertAll ? income / 3 : null;
  const avgMonthlyExpense = conversion.canConvertAll ? expense / 3 : null;

  const monthlySeries = await getCashFlowMonthlySeries(workspaceId, baseCurrency, exchangeRates);

  return {
    avgMonthlyIncome,
    avgMonthlyExpense,
    projectedNetNext3Months:
      conversion.canConvertAll && avgMonthlyIncome != null && avgMonthlyExpense != null
        ? (avgMonthlyIncome - avgMonthlyExpense) * 3
        : null,
    monthlySeries,
    ...conversion,
  };
}

export async function getCashFlowMonthlySeries(
  workspaceId: string,
  baseCurrency?: Awaited<ReturnType<typeof getWorkspaceExchangeContext>>["baseCurrency"],
  exchangeRates?: Awaited<ReturnType<typeof getWorkspaceExchangeContext>>["exchangeRates"],
): Promise<CashFlowMonthPoint[]> {
  await connectToDatabase();

  const ctx = baseCurrency && exchangeRates
    ? { baseCurrency, exchangeRates }
    : await getWorkspaceExchangeContext(workspaceId);

  const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await TransactionModel.aggregate<{
    _id: { year: number; month: number; type: string; currency: string | null };
    total: number;
  }>([
    {
      $match: {
        workspaceId: workspaceObjectId,
        isArchived: false,
        transactionDate: { $gte: since },
      },
    },
    ...transactionAccountCurrencyStages(ctx.baseCurrency),
    {
      $group: {
        _id: {
          year: { $year: "$transactionDate" },
          month: { $month: "$transactionDate" },
          type: "$type",
          currency: "$currency",
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const buckets = new Map<string, { income: Array<{ currency: typeof ctx.baseCurrency; amountMinor: number }>; expense: Array<{ currency: typeof ctx.baseCurrency; amountMinor: number }> }>();

  for (const row of rows) {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    const bucket = buckets.get(key) ?? { income: [], expense: [] };
    const currency = resolveAccountCurrency(row._id.currency, ctx.baseCurrency);
    const entry = { currency, amountMinor: row.total };
    if (row._id.type === "income") bucket.income.push(entry);
    else bucket.expense.push(entry);
    buckets.set(key, bucket);
  }

  const points: CashFlowMonthPoint[] = [];
  let runningBalance = 0;

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(monthKey) ?? { income: [], expense: [] };

    const incomeResult = sumAmountsInBase(bucket.income, ctx.baseCurrency, ctx.exchangeRates);
    const expenseResult = sumAmountsInBase(bucket.expense, ctx.baseCurrency, ctx.exchangeRates);
    const conversion = mergeConversionMeta(incomeResult, expenseResult);

    const income = conversion.canConvertAll ? (incomeResult.totalMinor ?? 0) : null;
    const expense = conversion.canConvertAll ? (expenseResult.totalMinor ?? 0) : null;
    const net = conversion.canConvertAll && income != null && expense != null ? income - expense : null;
    if (net != null) runningBalance += net;

    points.push({
      monthKey,
      label: monthKey,
      income,
      expense,
      net,
      runningBalance: conversion.canConvertAll ? runningBalance : null,
    });
  }

  return points;
}
