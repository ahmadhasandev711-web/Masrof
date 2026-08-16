import "server-only";

import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { endOfLocalDay } from "@/lib/dates";
import { RecurringExpenseModel } from "@/models/recurring-expense";
import { CategoryModel } from "@/models/category";
import { AccountModel } from "@/models/account";
import { toMinorUnits, fromMinorUnits } from "@/lib/money";
import { createTransaction } from "@/features/transactions/data";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CreateRecurringExpenseInput } from "@/features/recurring-expenses/schemas";
import type { RecurringFrequency } from "@/models/recurring-expense";

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

function advanceDueDate(
  current: Date,
  frequency: RecurringFrequency,
  dayOfMonth?: number | null,
  dayOfWeek?: number | null,
): Date {
  const next = new Date(current);

  if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
    next.setDate(dayOfMonth ?? next.getDate());
    return next;
  }

  const targetDay = dayOfWeek ?? next.getDay();
  const daysUntil = (targetDay - next.getDay() + 7) % 7 || 7;
  next.setDate(next.getDate() + daysUntil);
  return next;
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

/** Records the expense as a transaction and advances nextDueDate. */
export async function recordRecurringExpense(
  recurringId: string,
  workspaceId: string,
  userId: string,
) {
  await connectToDatabase();

  const recurring = await RecurringExpenseModel.findOne({
    _id: recurringId,
    workspaceId,
    isArchived: false,
    isActive: true,
  });

  if (!recurring) {
    throw new InvalidRecurringExpenseError("recurringExpenseNotFound");
  }

  await createTransaction(
    {
      workspaceId,
      accountId: recurring.accountId.toString(),
      categoryId: recurring.categoryId.toString(),
      type: "expense",
      amount: fromMinorUnits(recurring.amount),
      transactionDate: recurring.nextDueDate,
      description: recurring.description || "مصروف متكرر",
      notes: "",
    },
    userId,
  );

  recurring.nextDueDate = advanceDueDate(
    recurring.nextDueDate,
    recurring.frequency,
    recurring.dayOfMonth,
    recurring.dayOfWeek,
  );
  await recurring.save();
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
