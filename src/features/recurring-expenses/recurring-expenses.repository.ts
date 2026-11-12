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
import type { RecurringExpenseListItem } from "@/features/recurring-expenses/types";
import type { RecurringFrequency } from "@/models/recurring-expense";
import { advanceDueDate } from "@/features/recurring-expenses/due-date";
import { InvalidReferenceError } from "@/server/kernel/errors";
import {
  findWorkspaceIdempotentId,
  registerWorkspaceIdempotentResource,
} from "@/lib/idempotency/workspace-resource";

export type { RecurringExpenseListItem } from "@/features/recurring-expenses/types";

export class InvalidRecurringExpenseError extends InvalidReferenceError {
  constructor(code: string) {
    super(code, code);
    this.name = "InvalidRecurringExpenseError";
  }
}

type PopulatedAccount = { name?: string };
type PopulatedCategory = {
  name?: string;
  nameEn?: string | null;
  icon?: string | null;
  slug?: string | null;
};

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
    categoryNameEn: category?.nameEn ?? null,
    categorySlug: category?.slug ?? null,
  };
}

export class RecurringExpensesRepository {
  async findByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    await connectToDatabase();
    const existingId = await findWorkspaceIdempotentId(workspaceId, idempotencyKey);
    if (!existingId) return null;
    return RecurringExpenseModel.findOne({ _id: existingId, workspaceId }).lean();
  }

  async create(input: CreateRecurringExpenseInput) {
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

    await registerWorkspaceIdempotentResource(
      input.workspaceId,
      input.idempotencyKey,
      "recurringExpense",
      recurring._id.toString(),
    );

    return recurring.toObject();
  }

  listForWorkspace = unstable_cache(
    async (workspaceId: string, limit?: number): Promise<RecurringExpenseListItem[]> => {
      await connectToDatabase();

      const query = RecurringExpenseModel.find({
        workspaceId,
        isArchived: false,
        isActive: true,
      })
        .sort({ nextDueDate: 1 })
        .populate("accountId", "name")
        .populate("categoryId", "name nameEn icon slug");

      if (typeof limit === "number") {
        query.limit(limit);
      }

      const items = await query.lean();

      return items.map((item) => mapRecurringExpenseForList(item as RecurringExpenseLean));
    },
    ["recurring-expenses-for-workspace"],
    { revalidate: 30, tags: [CACHE_TAGS.recurring] },
  );

  async archive(recurringId: string, workspaceId: string) {
    await connectToDatabase();
    return RecurringExpenseModel.findOneAndUpdate(
      { _id: recurringId, workspaceId },
      { isArchived: true, isActive: false },
      { returnDocument: "after" },
    ).lean();
  }

  /** Records the expense as a transaction and advances nextDueDate atomically with idempotency. */
  async record(recurringId: string, workspaceId: string, userId: string) {
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

  async listDue(workspaceId: string): Promise<RecurringExpenseListItem[]> {
    await connectToDatabase();
    const cutoff = endOfLocalDay(new Date());

    const items = await RecurringExpenseModel.find({
      workspaceId,
      isArchived: false,
      isActive: true,
      nextDueDate: { $lte: cutoff },
    })
      .populate("accountId", "name")
      .populate("categoryId", "name nameEn icon slug")
      .lean();

    return items.map((item) => mapRecurringExpenseForList(item as RecurringExpenseLean));
  }
}

export const recurringExpensesRepository = new RecurringExpensesRepository();
