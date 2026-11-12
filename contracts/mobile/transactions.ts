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
});

export type MobileTransaction = z.infer<typeof mobileTransactionSchema>;

export const mobileTransactionsPageResponseSchema = mobilePageSchema(mobileTransactionSchema);
export type MobileTransactionsPageResponse = z.infer<typeof mobileTransactionsPageResponseSchema>;

export const mobileTransactionCreatedSchema = z.object({
  id: z.string(),
});
