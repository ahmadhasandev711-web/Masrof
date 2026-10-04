import "server-only";

import mongoose from "mongoose";
import { revalidateTag } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { runInTransaction } from "@/lib/db/transaction";
import { toPlain } from "@/lib/db/plain";
import { toMinorUnits } from "@/lib/money";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { resolveAccountCurrency } from "@/lib/currency";
import { InvoiceModel } from "@/models/invoice";
import { InvoicePaymentModel, type PaymentMethod } from "@/models/invoice-payment";
import { TransactionModel } from "@/models/transaction";
import { AccountModel } from "@/models/account";
import { CategoryModel } from "@/models/category";
import { WorkspaceModel } from "@/models/workspace";
import type { RecordPaymentInput } from "@/features/invoices/payment-schemas";
import type {
  InvoiceFinancialSummary,
  InvoicePaymentListItem,
} from "@/features/invoices/types";

export class InvalidPaymentReferenceError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "InvalidPaymentReferenceError";
  }
}

export class InvoiceOverpaymentError extends Error {
  readonly code = "invoiceOverpayment";
  readonly remainingAmount: number;
  constructor(remainingAmount: number) {
    super(`Payment exceeds invoice remaining balance of ${remainingAmount}`);
    this.name = "InvoiceOverpaymentError";
    this.remainingAmount = remainingAmount;
  }
}

export class InvoiceCancelledError extends Error {
  readonly code = "invoiceCancelledCannotPay";
  constructor() {
    super("Cannot record payment on a cancelled invoice");
    this.name = "InvoiceCancelledError";
  }
}

export class AccountCurrencyMismatchError extends Error {
  readonly code = "accountCurrencyMismatch";
  constructor() {
    super("Account currency does not match invoice currency");
    this.name = "AccountCurrencyMismatchError";
  }
}

/**
 * Validates external domain preconditions before acquiring a database transaction.
 */
async function validatePaymentPreconditions(input: RecordPaymentInput) {
  const [workspace, invoice, account] = await Promise.all([
    WorkspaceModel.findById(input.workspaceId).lean(),
    InvoiceModel.findOne({
      _id: input.invoiceId,
      workspaceId: input.workspaceId,
      isArchived: false,
    }).lean(),
    AccountModel.findOne({
      _id: input.accountId,
      workspaceId: input.workspaceId,
      isArchived: false,
    }).lean(),
  ]);

  if (!workspace) {
    throw new InvalidPaymentReferenceError("workspaceNotFound");
  }
  if (!invoice) {
    throw new InvalidPaymentReferenceError("invoiceNotFound");
  }
  if (invoice.status === "cancelled") {
    throw new InvoiceCancelledError();
  }
  if (!account) {
    throw new InvalidPaymentReferenceError("accountNotFound");
  }

  const accountCurrency = resolveAccountCurrency(account.currency, workspace.currency);
  if (accountCurrency !== workspace.currency) {
    throw new AccountCurrencyMismatchError();
  }

  let resolvedCategoryId = input.categoryId;
  if (resolvedCategoryId) {
    const category = await CategoryModel.findOne({
      _id: resolvedCategoryId,
      kind: "income",
      isArchived: false,
      $or: [{ workspaceId: null }, { workspaceId: input.workspaceId }],
    }).lean();

    if (!category) {
      throw new InvalidPaymentReferenceError("categoryInvalid");
    }
  } else {
    // Find default income category for workspace or system
    const defaultCategory = await CategoryModel.findOne({
      kind: "income",
      isArchived: false,
      $or: [{ workspaceId: input.workspaceId }, { workspaceId: null }],
    })
      .sort({ workspaceId: -1, isSystem: 1 })
      .lean();

    if (!defaultCategory) {
      throw new InvalidPaymentReferenceError("categoryNotFound");
    }
    resolvedCategoryId = String(defaultCategory._id);
  }

  return { workspace, invoice, account, resolvedCategoryId };
}

/**
 * Records an invoice payment atomically inside a MongoDB transaction:
 * 1. Checks idempotency by (workspaceId, idempotencyKey).
 * 2. Checks remaining balance invariant (rejects overpayment).
 * 3. Creates the income Transaction.
 * 4. Creates the InvoicePayment linking transactionId.
 * 5. Increments the account cachedBalance.
 * 6. Updates invoice paidAt if fully settled.
 */
export async function recordInvoicePayment(
  input: RecordPaymentInput,
  userId: string,
) {
  await connectToDatabase();

  const { invoice, resolvedCategoryId } = await validatePaymentPreconditions(input);

  const amountMinorUnits = toMinorUnits(input.amount);
  const mongooseInstance = await connectToDatabase();

  const resultPayment = await runInTransaction(mongooseInstance, async (session) => {
    // 1. Idempotency Check
    const existingPayment = await InvoicePaymentModel.findOne({
      workspaceId: input.workspaceId,
      idempotencyKey: input.idempotencyKey,
    }).session(session);

    if (existingPayment) {
      return existingPayment.toObject();
    }

    // 2. Compute Invariant: Invoice total vs Existing active payments
    const invoiceTotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);

    const existingPayments = await InvoicePaymentModel.find({
      workspaceId: input.workspaceId,
      invoiceId: input.invoiceId,
      isArchived: false,
    }).session(session);

    const paidTotal = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = Math.max(0, invoiceTotal - paidTotal);

    if (amountMinorUnits > remainingBalance) {
      throw new InvoiceOverpaymentError(remainingBalance);
    }

    // 3. Create Cash Ledger Transaction
    const [transaction] = await TransactionModel.create(
      [
        {
          workspaceId: input.workspaceId,
          accountId: input.accountId,
          categoryId: resolvedCategoryId,
          type: "income",
          amount: amountMinorUnits,
          transactionDate: input.paymentDate,
          description: `تحصيل فاتورة ${invoice.invoiceNumber}`,
          notes: input.notes || "",
          clientId: invoice.clientId,
          projectId: invoice.projectId ?? null,
          createdBy: userId,
        },
      ],
      { session },
    );

    // 4. Create InvoicePayment linked to Transaction
    const [payment] = await InvoicePaymentModel.create(
      [
        {
          workspaceId: input.workspaceId,
          invoiceId: input.invoiceId,
          transactionId: transaction._id,
          accountId: input.accountId,
          amount: amountMinorUnits,
          paymentDate: input.paymentDate,
          paymentMethod: input.paymentMethod as PaymentMethod,
          reference: input.reference || "",
          notes: input.notes || "",
          idempotencyKey: input.idempotencyKey,
          createdBy: userId,
        },
      ],
      { session },
    );

    // 5. Atomically increment Account Balance
    await AccountModel.findByIdAndUpdate(
      input.accountId,
      { $inc: { cachedBalance: amountMinorUnits } },
      { session },
    );

    // 6. Update Invoice status & paidAt if fully settled
    const newPaidTotal = paidTotal + amountMinorUnits;
    if (newPaidTotal >= invoiceTotal) {
      await InvoiceModel.findByIdAndUpdate(
        invoice._id,
        { paidAt: input.paymentDate, status: "paid" },
        { session },
      );
    }

    return payment.toObject();
  });

  // Invalidate caches outside session
  revalidateTag(CACHE_TAGS.invoices, "max");
  revalidateTag(CACHE_TAGS.accounts, "max");

  return toPlain(resultPayment as unknown) as InvoicePaymentListItem;
}

/**
 * Lists all payments recorded for an invoice.
 */
export async function getInvoicePayments(
  invoiceId: string,
  workspaceId: string,
): Promise<InvoicePaymentListItem[]> {
  await connectToDatabase();

  const payments = await InvoicePaymentModel.find({
    invoiceId,
    workspaceId,
    isArchived: false,
  })
    .sort({ paymentDate: -1, createdAt: -1 })
    .populate("accountId", "name")
    .lean();

  return toPlain(
    payments.map((p) => {
      const account = p.accountId as { _id?: unknown; name?: string } | null;
      return {
        _id: String(p._id),
        invoiceId: String(p.invoiceId),
        transactionId: String(p.transactionId),
        accountId: account?._id ? String(account._id) : String(p.accountId),
        accountName: account?.name ?? "",
        amount: p.amount,
        paymentDate: new Date(p.paymentDate).toISOString(),
        paymentMethod: p.paymentMethod,
        reference: p.reference ?? "",
        notes: p.notes ?? "",
        createdAt: new Date(p.createdAt).toISOString(),
      };
    }),
  );
}

/**
 * Returns the financial summary (paid, remaining, financial status) for an invoice.
 */
export async function getInvoiceFinancialSummary(
  invoiceId: string,
  workspaceId: string,
): Promise<InvoiceFinancialSummary | null> {
  await connectToDatabase();

  const invoice = await InvoiceModel.findOne({
    _id: invoiceId,
    workspaceId,
    isArchived: false,
  }).lean();

  if (!invoice) return null;

  const invoiceTotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);

  const payments = await InvoicePaymentModel.find({
    invoiceId,
    workspaceId,
    isArchived: false,
  }).lean();

  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingTotal = Math.max(0, invoiceTotal - paidTotal);

  let financialStatus: InvoiceFinancialSummary["financialStatus"];
  if (paidTotal >= invoiceTotal && invoiceTotal > 0) {
    financialStatus = "paid";
  } else if (paidTotal > 0) {
    financialStatus = "partially_paid";
  } else if (invoice.status === "paid") {
    financialStatus = "legacy_paid";
  } else {
    financialStatus = "unpaid";
  }

  return {
    invoiceTotal,
    paidTotal,
    remainingTotal,
    financialStatus,
  };
}
