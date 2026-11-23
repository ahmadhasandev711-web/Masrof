import { z } from "zod";
import { mobilePageSchema } from "./common";

export const mobileTransactionSchema = z.object({
  id: z.string(),
  type: z.string(),
  amount: z.number(),
  transactionDate: z.string(),
  description: z.string(),
  notes: z.string(),
  accountId: z.string(),
  accountName: z.string().nullable(),
  categoryId: z.string(),
  categoryName: z.string().nullable(),
  clientId: z.string().nullable(),
  clientName: z.string().nullable(),
  projectId: z.string().nullable(),
  projectName: z.string().nullable(),
  /** Booked by an invoice payment: correct it by voiding the payment on the invoice. */
  linkedInvoiceId: z.string().nullable().optional(),
  linkedInvoiceNumber: z.string().nullable().optional(),
  /** Booked by a debt payment. */
  linkedDebt: z.boolean().optional(),
});

export type MobileTransaction = z.infer<typeof mobileTransactionSchema>;

export const mobileTransactionsPageResponseSchema = mobilePageSchema(mobileTransactionSchema);
export type MobileTransactionsPageResponse = z.infer<typeof mobileTransactionsPageResponseSchema>;

export const mobileTransactionCreatedSchema = z.object({
  id: z.string(),
});

/** PATCH /api/mobile/transactions — transactionsService.update / archive (same as the web). */
export const mobileTransactionPatchBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    workspaceId: z.string().min(1),
    transactionId: z.string().min(1),
    accountId: z.string(),
    categoryId: z.string(),
    type: z.string(),
    amount: z.coerce.number(),
    transactionDate: z.string(),
    description: z.string().optional(),
    notes: z.string().optional(),
  }),
  z.object({
    action: z.literal("archive"),
    workspaceId: z.string().min(1),
    transactionId: z.string().min(1),
  }),
]);
export type MobileTransactionPatchBody = z.infer<typeof mobileTransactionPatchBodySchema>;
