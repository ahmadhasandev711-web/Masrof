import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { TransactionModel } from "@/models/transaction";
import { AccountModel } from "@/models/account";
import { CategoryModel } from "@/models/category";
import { ClientModel } from "@/models/client";
import { ProjectModel } from "@/models/project";
import { toMinorUnits } from "@/lib/money";
import { resolveAccountCurrency } from "@/lib/currency";
import { transactionAccountCurrencyStages } from "@/lib/currency/transaction-pipeline";
import {
  mergeConversionMeta,
  sumAmountsInBase,
  type ConversionMeta,
} from "@/lib/currency/report-conversion";
import { getWorkspaceExchangeContext } from "@/features/workspaces/exchange-context";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
} from "@/features/transactions/schemas";

export class InvalidTransactionReferenceError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "InvalidTransactionReferenceError";
  }
}

/** A transaction's signed effect on its account's balance: +amount for income, -amount for expense. */
function balanceDelta(type: "income" | "expense", amountMinorUnits: number): number {
  return type === "income" ? amountMinorUnits : -amountMinorUnits;
}

/**
 * Confirms references belong to the workspace (read-only, no session).
 * Run before opening a MongoDB transaction to keep the transaction short.
 */
async function validateReferencesBelongToWorkspace(
  workspaceId: string,
  accountId: string,
  categoryId: string,
  clientId?: string,
  projectId?: string,
) {
  const account = await AccountModel.findOne({
    _id: accountId,
    workspaceId,
    isArchived: false,
  });

  const category = await CategoryModel.findOne({
    _id: categoryId,
    isArchived: false,
    $or: [{ workspaceId: null }, { workspaceId }],
  });

  if (!account) {
    throw new InvalidTransactionReferenceError("accountNotFound");
  }
  if (!category) {
    throw new InvalidTransactionReferenceError("categoryNotFound");
  }

  if (clientId) {
    const client = await ClientModel.findOne({
      _id: clientId,
      workspaceId,
      isArchived: false,
    });
    if (!client) {
      throw new InvalidTransactionReferenceError("clientNotFound");
    }
  }

  if (projectId) {
    const project = await ProjectModel.findOne({
      _id: projectId,
      workspaceId,
      isArchived: false,
    });
    if (!project) {
      throw new InvalidTransactionReferenceError("projectNotFound");
    }
  }
}

/**
 * Confirms references inside an active MongoDB session (for updates).
 * MongoDB sessions are not concurrent — one operation at a time per session.
 */
async function assertReferencesBelongToWorkspace(
  workspaceId: string,
  accountId: string,
  categoryId: string,
  session: mongoose.ClientSession,
) {
  const account = await AccountModel.findOne({
    _id: accountId,
    workspaceId,
    isArchived: false,
  }).session(session);

  const category = await CategoryModel.findOne({
    _id: categoryId,
    isArchived: false,
    $or: [{ workspaceId: null }, { workspaceId }],
  }).session(session);

  if (!account) {
    throw new InvalidTransactionReferenceError("accountNotFound");
  }
  if (!category) {
    throw new InvalidTransactionReferenceError("categoryNotFound");
  }
}

/**
 * Creates a transaction AND applies its effect to the account's cached
 * balance inside a single MongoDB transaction — both writes commit
 * together or neither does. This is the balance strategy's core guarantee:
 * `cachedBalance` can never drift out of sync with the transactions that
 * are supposed to explain it.
 *
 * Note: this requires MongoDB to be running as a replica set (which
 * MongoDB Atlas provides by default) — a single standalone `mongod` does
 * not support multi-document transactions.
 */
export async function createTransaction(input: CreateTransactionInput, userId: string) {
  await connectToDatabase();
  await validateReferencesBelongToWorkspace(
    input.workspaceId,
    input.accountId,
    input.categoryId,
    input.clientId,
    input.projectId,
  );

  const mongooseInstance = await connectToDatabase();
  const session = await mongooseInstance.startSession();

  try {
    let createdId: string | undefined;

    await session.withTransaction(async () => {
      const amountMinorUnits = toMinorUnits(input.amount);

      const [transaction] = await TransactionModel.create(
        [
          {
            workspaceId: input.workspaceId,
            accountId: input.accountId,
            categoryId: input.categoryId,
            type: input.type,
            amount: amountMinorUnits,
            transactionDate: input.transactionDate,
            description: input.description,
            notes: input.notes,
            clientId: input.clientId || null,
            projectId: input.projectId || null,
            attachmentUrl: input.attachmentUrl || null,
            attachmentName: input.attachmentName || null,
            createdBy: userId,
          },
        ],
        { session },
      );

      await AccountModel.findByIdAndUpdate(
        input.accountId,
        { $inc: { cachedBalance: balanceDelta(input.type, amountMinorUnits) } },
        { session },
      );

      createdId = transaction._id.toString();
    });

    return createdId!;
  } finally {
    await session.endSession();
  }
}

/**
 * Updates a transaction. Because the account and/or amount and/or type can
 * all change at once, we don't try to compute one combined delta — we
 * reverse the OLD transaction's effect on its OLD account, then apply the
 * NEW transaction's effect on its (possibly different) NEW account. Both
 * happen in the same MongoDB transaction as the document update.
 */
export async function updateTransaction(input: UpdateTransactionInput, workspaceId: string) {
  const mongooseInstance = await connectToDatabase();
  const session = await mongooseInstance.startSession();

  try {
    await session.withTransaction(async () => {
      const existing = await TransactionModel.findOne({
        _id: input.transactionId,
        workspaceId,
        isArchived: false,
      }).session(session);

      if (!existing) {
        throw new InvalidTransactionReferenceError("transactionNotFound");
      }

      await assertReferencesBelongToWorkspace(
        workspaceId,
        input.accountId,
        input.categoryId,
        session,
      );

      const newAmountMinorUnits = toMinorUnits(input.amount);

      // Reverse the old effect on the old account.
      await AccountModel.findByIdAndUpdate(
        existing.accountId,
        { $inc: { cachedBalance: -balanceDelta(existing.type, existing.amount) } },
        { session },
      );

      // Apply the new effect on the (possibly different) new account.
      await AccountModel.findByIdAndUpdate(
        input.accountId,
        { $inc: { cachedBalance: balanceDelta(input.type, newAmountMinorUnits) } },
        { session },
      );

      existing.accountId = new mongoose.Types.ObjectId(input.accountId);
      existing.categoryId = new mongoose.Types.ObjectId(input.categoryId);
      existing.type = input.type;
      existing.amount = newAmountMinorUnits;
      existing.transactionDate = input.transactionDate;
      existing.description = input.description ?? "";
      existing.notes = input.notes ?? "";

      await existing.save({ session });
    });
  } finally {
    await session.endSession();
  }
}

/**
 * Soft-deletes a transaction and reverses its effect on the account's
 * balance — the inverse of what `createTransaction` applied.
 */
export async function archiveTransaction(transactionId: string, workspaceId: string) {
  const mongooseInstance = await connectToDatabase();
  const session = await mongooseInstance.startSession();

  try {
    await session.withTransaction(async () => {
      const existing = await TransactionModel.findOne({
        _id: transactionId,
        workspaceId,
        isArchived: false,
      }).session(session);

      if (!existing) {
        throw new InvalidTransactionReferenceError("transactionNotFound");
      }

      await AccountModel.findByIdAndUpdate(
        existing.accountId,
        { $inc: { cachedBalance: -balanceDelta(existing.type, existing.amount) } },
        { session },
      );

      existing.isArchived = true;
      await existing.save({ session });
    });
  } finally {
    await session.endSession();
  }
}

/** Filtered, sorted, paginated transaction list — the main /transactions screen query. */
export async function listTransactions(filters: TransactionFilters) {
  await connectToDatabase();

  const query: Record<string, unknown> = {
    workspaceId: filters.workspaceId,
    isArchived: false,
  };

  if (filters.type) query.type = filters.type;
  if (filters.accountId) query.accountId = filters.accountId;
  if (filters.categoryId) query.categoryId = filters.categoryId;

  if (filters.dateFrom || filters.dateTo) {
    query.transactionDate = {
      ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { $lte: filters.dateTo } : {}),
    };
  }

  if (filters.search) {
    query.description = { $regex: filters.search, $options: "i" };
  }

  const skip = (filters.page - 1) * filters.pageSize;

  const [items, total] = await Promise.all([
    TransactionModel.find(query)
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(filters.pageSize)
      .populate("accountId", "name")
      .populate("categoryId", "name icon")
      .populate("clientId", "name")
      .populate("projectId", "name")
      .lean(),
    TransactionModel.countDocuments(query),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

const TRANSACTION_EXPORT_MAX_ROWS = 5000;

/** All transactions matching filters (capped) for spreadsheet export. */
export async function listTransactionsForExport(
  filters: Omit<TransactionFilters, "page" | "pageSize">,
) {
  await connectToDatabase();

  const query: Record<string, unknown> = {
    workspaceId: filters.workspaceId,
    isArchived: false,
  };

  if (filters.type) query.type = filters.type;
  if (filters.accountId) query.accountId = filters.accountId;
  if (filters.categoryId) query.categoryId = filters.categoryId;

  if (filters.dateFrom || filters.dateTo) {
    query.transactionDate = {
      ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { $lte: filters.dateTo } : {}),
    };
  }

  if (filters.search) {
    query.description = { $regex: filters.search, $options: "i" };
  }

  const [items, total] = await Promise.all([
    TransactionModel.find(query)
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(TRANSACTION_EXPORT_MAX_ROWS)
      .populate("accountId", "name")
      .populate("categoryId", "name icon")
      .populate("clientId", "name")
      .populate("projectId", "name")
      .lean(),
    TransactionModel.countDocuments(query),
  ]);

  return {
    items,
    total,
    truncated: total > TRANSACTION_EXPORT_MAX_ROWS,
  };
}

/** Income / expense / net totals for a workspace within an optional date range — powers the dashboard. */
export type WorkspaceSummary = {
  income: number | null;
  expense: number | null;
  net: number | null;
} & ConversionMeta;

export async function getWorkspaceSummary(
  workspaceId: string,
  range?: { from?: Date; to?: Date },
): Promise<WorkspaceSummary> {
  await connectToDatabase();

  const { baseCurrency, exchangeRates } = await getWorkspaceExchangeContext(workspaceId);

  const match: Record<string, unknown> = {
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    isArchived: false,
  };

  if (range?.from || range?.to) {
    match.transactionDate = {
      ...(range.from ? { $gte: range.from } : {}),
      ...(range.to ? { $lte: range.to } : {}),
    };
  }

  const rows = await TransactionModel.aggregate<{
    _id: { currency: string | null; type: string };
    total: number;
  }>([
    { $match: match },
    ...transactionAccountCurrencyStages(baseCurrency),
    {
      $group: {
        _id: { currency: "$currency", type: "$type" },
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

  const income = incomeResult.totalMinor;
  const expense = expenseResult.totalMinor;
  const net =
    conversion.canConvertAll && income != null && expense != null ? income - expense : null;

  return { income, expense, net, ...conversion };
}
