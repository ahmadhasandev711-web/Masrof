import "server-only";

import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { endOfLocalDay } from "@/lib/dates";
import { RecurringExpenseModel } from "@/models/recurring-expense";
import { CategoryModel } from "@/models/category";
import { AccountModel } from "@/models/account";
import { toMinorUnits } from "@/lib/money";
import { runInTransaction } from "@/lib/db/transaction";
import { TransactionModel } from "@/models/transaction";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CreateRecurringExpenseInput } from "@/features/recurring-expenses/schemas";
import type { RecurringFrequency } from "@/models/recurring-expense";
import { advanceDueDate } from "./due-date";

export class InvalidRecurringExpenseError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "InvalidRecurringExpenseError";
  }
}

export type RecurringExpenseListItem = {
  id: string;
  amount: number;
  description: string;
  frequency: RecurringFrequency;
  nextDueDate: string;
  accountName: string;
  categoryName: string;
  categoryIcon: string | null;
};

type PopulatedAccount = { name?: string };
type PopulatedCategory = { name?: string; icon?: string | null };

type RecurringExpenseLean = {
  _id: unknown;
  amount: number;
  description?: string;
  frequency: RecurringFrequency;
  nextDueDate: Date | string;
  accountId: PopulatedAccount | null;
  categoryId: PopulatedCategory | null;
};

function mapRecurringExpenseForList(item: RecurringExpenseLean): RecurringExpenseListItem {
  const account = item.accountId;
  const category = item.categoryId;

  return {
    id: String(item._id),
    amount: item.amount,
    description: item.description ?? "",
    frequency: item.frequency,
    nextDueDate: new Date(item.nextDueDate).toISOString(),
    accountName: account?.name ?? "",
    categoryName: category?.name ?? "",
    categoryIcon: category?.icon ?? null,
  };
}

export async function createRecurringExpense(input: CreateRecurringExpenseInput) {
  await connectToDatabase();

  const [account, category] = await Promise.all([
    AccountModel.findOne({
      _id: input.accountId,
      workspaceId: input.workspaceId,
      isArchived: false,
    }),
    CategoryModel.findOne({
      _id: input.categoryId,
      kind: "expense",
      isArchived: false,
      $or: [{ workspaceId: null }, { workspaceId: input.workspaceId }],
    }),
  ]);

  if (!account) throw new InvalidRecurringExpenseError("accountNotFoundShort");
  if (!category) throw new InvalidRecurringExpenseError("categoryInvalid");

  const recurring = await RecurringExpenseModel.create({
    workspaceId: input.workspaceId,
    accountId: input.accountId,
    categoryId: input.categoryId,
    amount: toMinorUnits(input.amount),
    description: input.description,
    frequency: input.frequency,
    dayOfMonth: input.frequency === "monthly" ? input.dayOfMonth : undefined,
    dayOfWeek: input.frequency === "weekly" ? input.dayOfWeek : undefined,
    nextDueDate: input.nextDueDate,
  });

  return recurring.toObject();
}

export const listRecurringExpenses = unstable_cache(
  async (workspaceId: string, limit?: number): Promise<RecurringExpenseListItem[]> => {
    await connectToDatabase();

    const query = RecurringExpenseModel.find({
      workspaceId,
      isArchived: false,
      isActive: true,
    })
      .sort({ nextDueDate: 1 })
      .populate("accountId", "name")
      .populate("categoryId", "name icon");

    if (typeof limit === "number") {
      query.limit(limit);
    }

    const items = await query.lean();

    return items.map((item) => mapRecurringExpenseForList(item as RecurringExpenseLean));
  },
  ["recurring-expenses-for-workspace"],
  { revalidate: 30, tags: [CACHE_TAGS.recurring] },
);

export async function archiveRecurringExpense(recurringId: string, workspaceId: string) {
  await connectToDatabase();
  return RecurringExpenseModel.findOneAndUpdate(
    { _id: recurringId, workspaceId },
    { isArchived: true, isActive: false },
    { returnDocument: "after" },
  ).lean();
}

/** Records the expense as a transaction and advances nextDueDate atomically with idempotency. */
export async function recordRecurringExpense(
  recurringId: string,
  workspaceId: string,
  userId: string,
) {
  const mongooseInstance = await connectToDatabase();

  return await runInTransaction(mongooseInstance, async (session) => {
    const recurring = await RecurringExpenseModel.findOne({
      _id: recurringId,
      workspaceId,
      isArchived: false,
      isActive: true,
    }).session(session);

    if (!recurring) {
      throw new InvalidRecurringExpenseError("recurringExpenseNotFound");
    }

    const currentDueDate = recurring.nextDueDate;
    const nextDue = advanceDueDate(
      currentDueDate,
      recurring.frequency,
      recurring.dayOfMonth,
      recurring.dayOfWeek,
    );

    // Atomic conditional update on nextDueDate ensures idempotency:
    // If concurrent requests attempt to record the same due date, only one succeeds.
    const updated = await RecurringExpenseModel.findOneAndUpdate(
      {
        _id: recurringId,
        workspaceId,
        isArchived: false,
        isActive: true,
        nextDueDate: currentDueDate,
      },
      { $set: { nextDueDate: nextDue } },
      session ? { session, returnDocument: "after" } : { returnDocument: "after" },
    );

    if (!updated) {
      // Already advanced by a concurrent call; idempotent return
      return;
    }

    // 1. Create expense transaction in the selected account
    const createdTx = await TransactionModel.create(
      [
        {
          workspaceId,
          accountId: recurring.accountId,
          categoryId: recurring.categoryId,
          type: "expense" as const,
          amount: recurring.amount,
          transactionDate: currentDueDate,
          description: recurring.description || "مصروف متكرر",
          notes: "",
          createdBy: userId,
        },
      ],
      session ? { session } : {},
    );

    if (!createdTx || !createdTx[0]) {
      throw new Error("Failed to create transaction for recurring expense");
    }

    // 2. Decrement account cached balance atomically
    await AccountModel.findByIdAndUpdate(
      recurring.accountId,
      { $inc: { cachedBalance: -recurring.amount } },
      session ? { session } : {},
    );

    return createdTx[0]._id.toString();
  });
}

export async function listDueRecurringExpenses(
  workspaceId: string,
): Promise<RecurringExpenseListItem[]> {
  await connectToDatabase();
  const cutoff = endOfLocalDay(new Date());

  const items = await RecurringExpenseModel.find({
    workspaceId,
    isArchived: false,
    isActive: true,
    nextDueDate: { $lte: cutoff },
  })
    .populate("accountId", "name")
    .populate("categoryId", "name icon")
    .lean();

  return items.map((item) => mapRecurringExpenseForList(item as RecurringExpenseLean));
}
