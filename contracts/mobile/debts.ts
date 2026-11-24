import { z } from "zod";

export const mobileDebtSchema = z.object({
  id: z.string(),
  name: z.string(),
  creditor: z.string(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  progressPercent: z.number(),
  currency: z.string(),
  dueDate: z.string().nullable(),
  status: z.enum(["active", "paid"]),
  category: z.string(),
  notes: z.string(),
});

export type MobileDebt = z.infer<typeof mobileDebtSchema>;

export const mobileDebtSummarySchema = z.object({
  totalLiabilities: z.number(),
  totalPaid: z.number(),
  remainingLiabilities: z.number(),
  activeCount: z.number().int(),
  paidCount: z.number().int(),
  currency: z.string(),
});

export const mobileDebtsListResponseSchema = z.object({
  items: z.array(mobileDebtSchema),
  summary: mobileDebtSummarySchema,
});
export type MobileDebtsListResponse = z.infer<typeof mobileDebtsListResponseSchema>;

export const mobileDebtCreatedSchema = z.object({
  id: z.string(),
});

/** PATCH /api/mobile/debts — same `debtsService.archive` the web uses. */
export const mobileDebtPatchBodySchema = z.object({
  workspaceId: z.string().min(1),
  debtId: z.string().min(1),
});

export const mobileDebtPaymentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  paymentDate: z.string(),
  accountName: z.string(),
  reference: z.string(),
  notes: z.string(),
});

export const mobileDebtPaymentsResponseSchema = z.object({
  items: z.array(mobileDebtPaymentSchema),
});
export type MobileDebtPaymentsResponse = z.infer<typeof mobileDebtPaymentsResponseSchema>;

export const mobileDebtPaymentCreatedSchema = z.object({
  paymentId: z.string(),
  transactionId: z.string(),
});
