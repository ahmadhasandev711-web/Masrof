/**
 * Input validation shared by web Server Actions, `/api/mobile` routes and the
 * mobile app (client-side, before sending). Every factory takes `t(key)` so
 * each side supplies its own translated `validation.*` message for the key.
 */
import { z } from "zod";
import {
  ACCOUNT_TYPES,
  CATEGORY_KINDS,
  SUPPORTED_CURRENCIES,
  TRANSACTION_TYPES,
} from "./constants";

export const idempotencyKeyField = z.string().trim().min(1).max(64);

// ── Accounts ────────────────────────────────────────────────────────────────

export type AccountValidationKey = "accountNameMin2" | "accountTypeInvalid" | "openingBalanceInvalid";

export function createAccountSchema(t: (key: AccountValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    name: z.string().trim().min(2, t("accountNameMin2")).max(60),
    type: z.enum(ACCOUNT_TYPES, { message: t("accountTypeInvalid") }),
    currency: z.enum(SUPPORTED_CURRENCIES).optional(),
    openingBalance: z.coerce
      .number()
      .refine((val) => Number.isFinite(val), t("openingBalanceInvalid"))
      .default(0),
    idempotencyKey: idempotencyKeyField,
  });
}

/**
 * Edit an account's name and opening balance. A wrong opening balance would
 * otherwise sit in every balance forever; the service moves the live balance
 * by the difference only, so transactions stay untouched.
 */
export function createUpdateAccountSchema(t: (key: AccountValidationKey) => string) {
  return z.object({
    accountId: z.string().min(1),
    workspaceId: z.string().min(1),
    name: z.string().trim().min(2, t("accountNameMin2")).max(60),
    openingBalance: z.coerce
      .number()
      .refine((val) => Number.isFinite(val), t("openingBalanceInvalid")),
  });
}

export const updateAccountSchema = createUpdateAccountSchema((key) => key);

export type CreateAccountInput = z.infer<ReturnType<typeof createAccountSchema>>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

// ── Categories ──────────────────────────────────────────────────────────────

export type CategoryValidationKey = "categoryNameMin2" | "categoryNameEnMin2" | "categoryKindInvalid";

const categoryNameField = (t: (key: CategoryValidationKey) => string) =>
  z.string().trim().min(2, t("categoryNameMin2")).max(60);

const categoryNameEnField = (t: (key: CategoryValidationKey) => string) =>
  z.preprocess(
    (val) => {
      if (val == null || val === "") return undefined;
      const s = String(val).trim();
      return s.length === 0 ? undefined : s;
    },
    z.string().min(2, t("categoryNameEnMin2")).max(60).optional(),
  );

export function createCategorySchema(t: (key: CategoryValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    name: categoryNameField(t),
    nameEn: categoryNameEnField(t),
    kind: z.enum(CATEGORY_KINDS, { message: t("categoryKindInvalid") }),
    idempotencyKey: idempotencyKeyField,
  });
}

/**
 * Rename a custom category. Kind is not editable — existing transactions depend on it.
 */
export function createUpdateCategorySchema(t: (key: CategoryValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    categoryId: z.string().min(1),
    name: categoryNameField(t),
    nameEn: categoryNameEnField(t),
  });
}

export const updateCategorySchema = createUpdateCategorySchema((key) => key);

export type CreateCategoryInput = z.infer<ReturnType<typeof createCategorySchema>>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ── Transactions ────────────────────────────────────────────────────────────

export type TransactionValidationKey =
  | "selectAccount"
  | "selectCategory"
  | "transactionTypeInvalid"
  | "amountPositive"
  | "dateInvalid";

export function createTransactionSchema(t: (key: TransactionValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    accountId: z.string().min(1, t("selectAccount")),
    categoryId: z.string().min(1, t("selectCategory")),
    type: z.enum(TRANSACTION_TYPES, { message: t("transactionTypeInvalid") }),
    amount: z.coerce.number().positive(t("amountPositive")),
    transactionDate: z.coerce.date({ message: t("dateInvalid") }),
    description: z.string().trim().max(140).optional().default(""),
    notes: z.string().trim().max(1000).optional().default(""),
    clientId: z.string().optional(),
    projectId: z.string().optional(),
    attachmentUrl: z.string().trim().optional(),
    attachmentName: z.string().trim().max(120).optional(),
    idempotencyKey: idempotencyKeyField,
  });
}

/**
 * Editing creates nothing, so no idempotency key (the web edit form never sent
 * one, and requiring it made every edit fail validation).
 */
export function createUpdateTransactionSchema(t: (key: TransactionValidationKey) => string) {
  return createTransactionSchema(t).omit({ idempotencyKey: true }).extend({
    transactionId: z.string().min(1),
  });
}

// ── Transfers ───────────────────────────────────────────────────────────────

export type TransferValidationKey =
  | "selectSourceAccount"
  | "selectDestinationAccount"
  | "amountPositive"
  | "dateInvalid"
  | "transferAccountsMustDiffer";

/** Move money between two accounts. Not income or an expense. */
export function createTransferSchema(t: (key: TransferValidationKey) => string) {
  return z
    .object({
      workspaceId: z.string().min(1),
      fromAccountId: z.string().min(1, t("selectSourceAccount")),
      toAccountId: z.string().min(1, t("selectDestinationAccount")),
      amount: z.coerce.number().positive(t("amountPositive")),
      transferDate: z.coerce.date({ message: t("dateInvalid") }),
      description: z.string().trim().max(140).optional().default(""),
      notes: z.string().trim().max(1000).optional().default(""),
      idempotencyKey: idempotencyKeyField,
    })
    .refine((data) => data.fromAccountId !== data.toAccountId, {
      message: t("transferAccountsMustDiffer"),
      path: ["toAccountId"],
    });
}

export type CreateTransferInput = z.infer<ReturnType<typeof createTransferSchema>>;

// ── Debts ───────────────────────────────────────────────────────────────────

export type DebtValidationKey = "nameMin2" | "amountPositive" | "selectAccount" | "dateInvalid";

export function createDebtSchema(t: (key: DebtValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    name: z.string().trim().min(2, t("nameMin2") || "Name must be at least 2 characters").max(120),
    creditor: z.string().trim().min(2, t("nameMin2") || "Creditor name must be at least 2 characters").max(120),
    amount: z.coerce.number().positive(t("amountPositive") || "Amount must be greater than zero"),
    dueDate: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? new Date(val) : null)),
    category: z.string().trim().max(80).optional().default(""),
    notes: z.string().trim().max(500).optional().default(""),
    idempotencyKey: idempotencyKeyField,
  });
}

export function recordDebtPaymentSchema(t: (key: DebtValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    debtId: z.string().min(1),
    accountId: z.string().min(1, t("selectAccount") || "Account is required"),
    amount: z.coerce.number().positive(t("amountPositive") || "Amount must be greater than zero"),
    paymentDate: z.coerce.date({
      message: t("dateInvalid") || "Invalid payment date",
    }),
    reference: z.string().trim().max(100).optional().default(""),
    notes: z.string().trim().max(500).optional().default(""),
    idempotencyKey: z.string().trim().min(1).max(64),
  });
}

export type CreateDebtInput = z.infer<ReturnType<typeof createDebtSchema>>;
export type RecordDebtPaymentInput = z.infer<ReturnType<typeof recordDebtPaymentSchema>>;

// ── Budgets ─────────────────────────────────────────────────────────────────

export type BudgetValidationKey = "budgetNameMin2" | "budgetAmountPositive";

export function createBudgetSchema(t: (key: BudgetValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    name: z.string().trim().min(2, t("budgetNameMin2")).max(60),
    categoryId: z.string().optional(),
    amount: z.coerce.number().positive(t("budgetAmountPositive")),
    idempotencyKey: idempotencyKeyField,
  });
}

export type CreateBudgetInput = z.infer<ReturnType<typeof createBudgetSchema>>;

// ── Savings goals ───────────────────────────────────────────────────────────

export type SavingsGoalValidationKey =
  | "goalNameMin2"
  | "targetAmountPositive"
  | "deadlineInvalid"
  | "amountPositive";

export function createSavingsGoalSchema(t: (key: SavingsGoalValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    name: z.string().trim().min(2, t("goalNameMin2")).max(120),
    targetAmount: z.coerce.number().positive(t("targetAmountPositive")),
    deadline: z.preprocess(
      (val) => (val === "" || val == null ? undefined : val),
      z.coerce.date({ message: t("deadlineInvalid") }).optional(),
    ),
    idempotencyKey: idempotencyKeyField,
  });
}

export function createUpdateGoalProgressSchema(t: (key: SavingsGoalValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    goalId: z.string().min(1),
    amount: z.coerce.number().positive(t("amountPositive")),
  });
}

export type CreateSavingsGoalInput = z.infer<ReturnType<typeof createSavingsGoalSchema>>;
export type UpdateGoalProgressInput = z.infer<ReturnType<typeof createUpdateGoalProgressSchema>>;

// ── Recurring expenses ──────────────────────────────────────────────────────

export const RECURRING_FREQUENCIES = ["monthly", "weekly"] as const;

export type RecurringValidationKey =
  | "selectAccount"
  | "selectCategory"
  | "amountPositive"
  | "frequencyInvalid"
  | "dueDateInvalid"
  | "dayOfMonthRequired"
  | "dayOfWeekRequired";

export function createRecurringExpenseSchema(t: (key: RecurringValidationKey) => string) {
  return z
    .object({
      workspaceId: z.string().min(1),
      accountId: z.string().min(1, t("selectAccount")),
      categoryId: z.string().min(1, t("selectCategory")),
      amount: z.coerce.number().positive(t("amountPositive")),
      description: z.string().trim().max(140).optional().default(""),
      frequency: z.enum(RECURRING_FREQUENCIES, { message: t("frequencyInvalid") }),
      dayOfMonth: z.coerce.number().int().min(1).max(28).optional(),
      dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
      nextDueDate: z.coerce.date({ message: t("dueDateInvalid") }),
      idempotencyKey: idempotencyKeyField,
    })
    .superRefine((data, ctx) => {
      if (data.frequency === "monthly" && data.dayOfMonth == null) {
        ctx.addIssue({ code: "custom", message: t("dayOfMonthRequired"), path: ["dayOfMonth"] });
      }
      if (data.frequency === "weekly" && data.dayOfWeek == null) {
        ctx.addIssue({ code: "custom", message: t("dayOfWeekRequired"), path: ["dayOfWeek"] });
      }
    });
}

export type CreateRecurringExpenseInput = z.infer<ReturnType<typeof createRecurringExpenseSchema>>;

export const transactionFiltersSchema = z.object({
  workspaceId: z.string().min(1),
  type: z.enum(TRANSACTION_TYPES).optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTransactionInput = z.infer<ReturnType<typeof createTransactionSchema>>;
export type UpdateTransactionInput = z.infer<ReturnType<typeof createUpdateTransactionSchema>>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
