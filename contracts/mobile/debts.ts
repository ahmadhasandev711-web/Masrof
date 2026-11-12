import { z } from "zod";

export const mobileDebtSchema = z
  .object({
    id: z.string().optional(),
    _id: z.string().optional(),
    title: z.string().optional(),
    name: z.string().optional(),
    amount: z.number().optional(),
    remainingAmount: z.number().optional(),
    status: z.string().optional(),
  })
  .passthrough();

export const mobileDebtsListResponseSchema = z.object({
  items: z.array(mobileDebtSchema),
  summary: z.unknown().optional(),
});

export const mobileDebtCreatedSchema = z.object({
  id: z.string(),
});

export const mobileDebtPaymentCreatedSchema = z.record(z.string(), z.unknown());
