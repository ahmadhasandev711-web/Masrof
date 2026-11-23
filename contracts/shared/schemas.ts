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

export function createCategorySchema(t: (key: CategoryValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    name: z.string().trim().min(2, t("categoryNameMin2")).max(60),
    nameEn: z.preprocess(
      (val) => {
        if (val == null || val === "") return undefined;
        const s = String(val).trim();
        return s.length === 0 ? undefined : s;
      },
      z.string().min(2, t("categoryNameEnMin2")).max(60).optional(),
    ),
    kind: z.enum(CATEGORY_KINDS, { message: t("categoryKindInvalid") }),
    idempotencyKey: idempotencyKeyField,
  });
}

export type CreateCategoryInput = z.infer<ReturnType<typeof createCategorySchema>>;

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
