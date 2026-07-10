import { z } from "zod";
import { TRANSACTION_TYPES } from "@/models/transaction";

type TransactionValidationKey =
  | "selectAccount"
  | "selectCategory"
  | "transactionTypeInvalid"
  | "amountPositive"
  | "dateInvalid";

type ValidationTranslator = (key: TransactionValidationKey) => string;

export function createTransactionSchema(t: ValidationTranslator) {
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
  });
}

export function createUpdateTransactionSchema(t: ValidationTranslator) {
  return createTransactionSchema(t).extend({
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
