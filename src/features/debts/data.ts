import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { runInTransaction } from "@/lib/db/transaction";
import { toMinorUnits } from "@/lib/money";
import { DebtModel } from "@/models/debt";
import { DebtPaymentModel } from "@/models/debt-payment";
import { TransactionModel } from "@/models/transaction";
import { AccountModel } from "@/models/account";
import { CategoryModel } from "@/models/category";
import type { DebtItem, DebtPaymentItem, DebtSummary } from "@/features/debts/types";

export class DebtNotFoundError extends Error {
  readonly code = "debtNotFound";
  constructor() {
    super("Debt not found");
    this.name = "DebtNotFoundError";
  }
}

export class DebtAccountNotFoundError extends Error {
  readonly code = "debtAccountNotFound";
  constructor() {
    super("Selected account not found");
    this.name = "DebtAccountNotFoundError";
  }
}

export class DebtOverpaymentError extends Error {
  readonly code = "debtOverpayment";
  readonly remainingAmount: number;
  constructor(remainingAmount: number) {
    super(`Payment exceeds remaining debt of ${remainingAmount}`);
    this.name = "DebtOverpaymentError";
    this.remainingAmount = remainingAmount;
  }
}

export async function getDebtsForWorkspace(
  workspaceId: string,
  options?: { status?: "active" | "paid" },
): Promise<DebtItem[]> {
  await connectToDatabase();

  const query: Record<string, unknown> = {
    workspaceId,
    isArchived: false,
  };

  if (options?.status) {
    query.status = options.status;
  }

  const debts = await DebtModel.find(query)
    .sort({ dueDate: 1, createdAt: -1 })
    .limit(100)
    .lean();

  return debts.map((doc) => {
    const total = doc.totalAmount ?? 0;
    const paid = doc.paidAmount ?? 0;
    const remaining = Math.max(0, total - paid);
    const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

    return {
      id: doc._id.toString(),
      workspaceId: doc.workspaceId,
      name: doc.name,
      creditor: doc.creditor,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      progressPercent: progress,
      currency: doc.currency || "EGP",
      dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
      status: doc.status as "active" | "paid",
      category: doc.category || "",
      notes: doc.notes || "",
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    };
  });
}

export async function getDebtSummary(
  workspaceId: string,
  currency: string = "EGP",
): Promise<DebtSummary> {
  await connectToDatabase();

  const debts = await DebtModel.find({
    workspaceId,
    isArchived: false,
  })
    .select("totalAmount paidAmount status")
    .lean();

  let totalLiabilities = 0;
  let totalPaid = 0;
  let activeCount = 0;
  let paidCount = 0;

  for (const debt of debts) {
    totalLiabilities += debt.totalAmount ?? 0;
    totalPaid += debt.paidAmount ?? 0;
    if (debt.status === "paid") {
      paidCount++;
    } else {
      activeCount++;
    }
  }

  const remainingLiabilities = Math.max(0, totalLiabilities - totalPaid);

  return {
    totalLiabilities,
    totalPaid,
    remainingLiabilities,
    activeCount,
    paidCount,
    currency,
  };
}

export async function getDebtPayments(
  workspaceId: string,
  debtId: string,
): Promise<DebtPaymentItem[]> {
  await connectToDatabase();

  const payments = await DebtPaymentModel.find({ workspaceId, debtId })
    .sort({ paymentDate: -1, createdAt: -1 })
    .lean();

  if (payments.length === 0) {
    return [];
  }

  const accountIds = Array.from(new Set(payments.map((p) => p.accountId)));
  const accounts = await AccountModel.find({
    _id: { $in: accountIds },
    workspaceId,
  })
    .select("name")
    .lean();

  const accountMap = new Map<string, string>();
  for (const acc of accounts) {
    accountMap.set(acc._id.toString(), acc.name);
  }

  return payments.map((p) => ({
    id: p._id.toString(),
    workspaceId: p.workspaceId,
    debtId: p.debtId,
    amount: p.amount,
    paymentDate: p.paymentDate ? p.paymentDate.toISOString() : new Date().toISOString(),
    accountId: p.accountId,
    accountName: accountMap.get(p.accountId) || "—",
    transactionId: p.transactionId,
    reference: p.reference || "",
    notes: p.notes || "",
    createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
  }));
}

export async function createDebt(input: {
  workspaceId: string;
  name: string;
  creditor: string;
  amount: number;
  dueDate?: Date | null;
  currency?: string;
  category?: string;
  notes?: string;
}): Promise<string> {
  await connectToDatabase();

  const totalAmountMinor = toMinorUnits(input.amount);

  const doc = await DebtModel.create({
    workspaceId: input.workspaceId,
    name: input.name.trim(),
    creditor: input.creditor.trim(),
    totalAmount: totalAmountMinor,
    paidAmount: 0,
    currency: input.currency || "EGP",
    dueDate: input.dueDate || null,
    status: "active",
    category: input.category?.trim() || "",
    notes: input.notes?.trim() || "",
    isArchived: false,
  });

  return doc._id.toString();
}

export async function recordDebtPayment(
  input: {
    workspaceId: string;
    debtId: string;
    accountId: string;
    amount: number;
    paymentDate: Date;
    reference?: string;
    notes?: string;
  },
  userId: string,
): Promise<{ paymentId: string; transactionId: string }> {
  await connectToDatabase();

  const debt = await DebtModel.findOne({
    _id: input.debtId,
    workspaceId: input.workspaceId,
    isArchived: false,
  }).lean();

  if (!debt) {
    throw new DebtNotFoundError();
  }

  const account = await AccountModel.findOne({
    _id: input.accountId,
    workspaceId: input.workspaceId,
    isArchived: false,
  }).lean();

  if (!account) {
    throw new DebtAccountNotFoundError();
  }

  const amountMinor = toMinorUnits(input.amount);
  const remainingMinor = Math.max(0, (debt.totalAmount ?? 0) - (debt.paidAmount ?? 0));

  if (amountMinor > remainingMinor) {
    throw new DebtOverpaymentError(remainingMinor);
  }

  const expenseCategory = await CategoryModel.findOne({
    kind: "expense",
    isArchived: false,
    $or: [{ workspaceId: input.workspaceId }, { workspaceId: null }],
  })
    .sort({ workspaceId: -1, isSystem: 1 })
    .lean();

  return await runInTransaction(mongoose, async (session) => {
    // 1. Create expense transaction in the selected account
    const createdTx = await TransactionModel.create(
      [
        {
          workspaceId: input.workspaceId,
          accountId: input.accountId,
          categoryId: expenseCategory?._id,
          type: "expense" as const,
          amount: amountMinor,
          transactionDate: input.paymentDate,
          description: `سداد التزام: ${debt.name}`,
          notes: input.notes?.trim() || `سداد للجهة: ${debt.creditor}`,
          createdBy: userId,
        },
      ],
      session ? { session } : {},
    );
    const tx = createdTx[0];
    if (!tx) {
      throw new Error("Failed to create transaction record");
    }

    // 2. Decrement account cached balance
    await AccountModel.findByIdAndUpdate(
      input.accountId,
      { $inc: { cachedBalance: -amountMinor } },
      session ? { session } : {},
    );

    // 3. Update debt paid amount and status
    const newPaidAmount = (debt.paidAmount ?? 0) + amountMinor;
    const newStatus = newPaidAmount >= debt.totalAmount ? "paid" : "active";

    await DebtModel.findByIdAndUpdate(
      debt._id,
      {
        $inc: { paidAmount: amountMinor },
        $set: { status: newStatus },
      },
      session ? { session } : {},
    );

    // 4. Create debt payment record
    const createdPayment = await DebtPaymentModel.create(
      [
        {
          workspaceId: input.workspaceId,
          debtId: debt._id.toString(),
          amount: amountMinor,
          paymentDate: input.paymentDate,
          accountId: input.accountId,
          transactionId: tx._id.toString(),
          reference: input.reference?.trim() || "",
          notes: input.notes?.trim() || "",
        },
      ],
      session ? { session } : {},
    );
    const payment = createdPayment[0];
    if (!payment) {
      throw new Error("Failed to record debt payment");
    }

    return {
      paymentId: payment._id.toString(),
      transactionId: tx._id.toString(),
    };
  });
}

export async function archiveDebt(
  workspaceId: string,
  debtId: string,
): Promise<boolean> {
  await connectToDatabase();

  const res = await DebtModel.updateOne(
    { _id: debtId, workspaceId },
    { $set: { isArchived: true } },
  );

  return res.modifiedCount > 0;
}
