import "server-only";

import { cache } from "react";
import mongoose, { type ClientSession } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AccountModel } from "@/models/account";
import { TransactionModel } from "@/models/transaction";
import { toMinorUnits } from "@/lib/money";
import {
  parseExchangeRates,
  resolveAccountCurrency,
  summarizeBalances,
  type CurrencyBalanceRow,
} from "@/lib/currency";
import type { SupportedCurrency } from "@/models/workspace";
import { WorkspaceModel } from "@/models/workspace";
import { TransferModel } from "@/models/transfer";
import { computeAccountBalanceMinor } from "@/features/accounts/balance-math";
import type { CreateAccountInput } from "@/features/accounts/schemas";

/**
 * Creates an account. `openingBalance` arrives as a decimal (e.g. 500.75)
 * and is converted to minor units here — this is the boundary where user
 * input becomes the app's internal money representation.
 *
 * `cachedBalance` starts equal to `openingBalance`: with zero transactions
 * recorded yet, the two numbers are the same by definition.
 */
export async function createAccount(
  input: CreateAccountInput,
  workspaceCurrency: SupportedCurrency,
) {
  await connectToDatabase();

  const openingBalanceMinor = toMinorUnits(input.openingBalance);
  const currency = resolveAccountCurrency(input.currency, workspaceCurrency);

  const account = await AccountModel.create({
    workspaceId: input.workspaceId,
    name: input.name,
    type: input.type,
    currency,
    openingBalance: openingBalanceMinor,
    cachedBalance: openingBalanceMinor,
  });

  return account.toObject();
}

/** Lists every non-archived account in a workspace. Caller must have already verified access. */
export const listAccountsForWorkspace = cache(async (workspaceId: string) => {
  await connectToDatabase();

  return AccountModel.find({ workspaceId, isArchived: false })
    .sort({ createdAt: 1 })
    .lean();
});

/** Sum of every account's cached balance — only valid for single-currency workspaces. */
export async function getWorkspaceTotalBalance(workspaceId: string): Promise<number> {
  const summary = await getWorkspaceBalanceSummary(workspaceId);
  if (summary.byCurrency.length === 1) {
    return summary.byCurrency[0]?.totalMinor ?? 0;
  }
  return summary.convertedTotalMinor ?? summary.byCurrency[0]?.totalMinor ?? 0;
}

export async function getWorkspaceBalanceSummary(workspaceId: string) {
  await connectToDatabase();

  const workspace = await WorkspaceModel.findById(workspaceId).select("currency exchangeRates").lean();
  const baseCurrency = (workspace?.currency ?? "EGP") as SupportedCurrency;
  const exchangeRates = parseExchangeRates(workspace?.exchangeRates);

  const rows = await AccountModel.aggregate<{ _id: string | null; total: number }>([
    {
      $match: {
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        isArchived: false,
      },
    },
    {
      $group: {
        _id: { $ifNull: ["$currency", baseCurrency] },
        total: { $sum: "$cachedBalance" },
      },
    },
  ]);

  const byCurrency: CurrencyBalanceRow[] = rows.map((row) => ({
    currency: resolveAccountCurrency(row._id, baseCurrency),
    totalMinor: row.total,
  }));

  return summarizeBalances(byCurrency, baseCurrency, exchangeRates);
}

export async function updateAccount(
  accountId: string,
  workspaceId: string,
  updates: { name?: string },
) {
  await connectToDatabase();
  return AccountModel.findOneAndUpdate({ _id: accountId, workspaceId }, updates, {
    returnDocument: "after",
  }).lean();
}

export async function archiveAccount(accountId: string, workspaceId: string) {
  await connectToDatabase();
  return AccountModel.findOneAndUpdate(
    { _id: accountId, workspaceId },
    { isArchived: true },
    { returnDocument: "after" },
  ).lean();
}

/**
 * Atomically adjusts an account's cached balance by a signed delta (in
 * minor units). This is what the Transactions feature will call inside
 * the SAME database transaction that creates/updates/deletes a Transaction
 * document — never as a separate, un-synchronized write.
 *
 * Uses MongoDB's `$inc` so concurrent adjustments to the same account
 * (e.g. two transactions saved at nearly the same time) don't race and
 * silently drop one of the updates the way a read-modify-write would.
 */
export async function adjustAccountBalance(
  accountId: string,
  deltaMinorUnits: number,
  session?: ClientSession,
) {
  await connectToDatabase();
  return AccountModel.findByIdAndUpdate(
    accountId,
    { $inc: { cachedBalance: deltaMinorUnits } },
    { returnDocument: "after", session },
  ).lean();
}

/**
 * Recomputes `cachedBalance` from scratch:
 * openingBalance + income − expense + transferIn − transferOut.
 *
 * Transfers must be included — omitting them would wipe transfer effects
 * and corrupt balances if this safety net is ever run.
 */
export async function recalculateAccountBalance(accountId: string) {
  await connectToDatabase();
  const account = await AccountModel.findById(accountId).lean();
  if (!account) return null;

  const accountObjectId = new mongoose.Types.ObjectId(accountId);

  const [[totals], [transferIn], [transferOut]] = await Promise.all([
    TransactionModel.aggregate<{ income: number; expense: number }>([
      { $match: { accountId: accountObjectId, isArchived: false } },
      {
        $group: {
          _id: null,
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        },
      },
    ]),
    TransferModel.aggregate<{ total: number }>([
      { $match: { toAccountId: accountObjectId, isArchived: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    TransferModel.aggregate<{ total: number }>([
      { $match: { fromAccountId: accountObjectId, isArchived: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const recalculated = computeAccountBalanceMinor({
    openingBalance: account.openingBalance,
    incomeTotal: totals?.income ?? 0,
    expenseTotal: totals?.expense ?? 0,
    transferInTotal: transferIn?.total ?? 0,
    transferOutTotal: transferOut?.total ?? 0,
  });

  return AccountModel.findByIdAndUpdate(
    accountId,
    { cachedBalance: recalculated },
    { returnDocument: "after" },
  ).lean();
}
