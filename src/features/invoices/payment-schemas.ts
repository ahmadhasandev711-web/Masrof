import { z } from "zod";
import { PAYMENT_METHODS } from "@/models/invoice-payment";

type ValidationTranslator = (key: string) => string;

export function recordPaymentSchema(t: ValidationTranslator) {
  return z.object({
    workspaceId: z.string().min(1),
    invoiceId: z.string().min(1),
    accountId: z.string().min(1, t("accountRequired") || "Account is required"),
    categoryId: z.string().trim().optional().nullable(),
    amount: z.coerce.number().positive(t("amountPositive") || "Amount must be greater than zero"),
    paymentDate: z.coerce.date({
      message: t("invalidDate") || "Invalid payment date",
    }),
    paymentMethod: z.enum(PAYMENT_METHODS).default("bank_transfer"),
    reference: z.string().trim().max(100).optional().default(""),
    notes: z.string().trim().max(500).optional().default(""),
    idempotencyKey: z.string().trim().min(1).max(64),
  });
}

export type RecordPaymentInput = z.infer<ReturnType<typeof recordPaymentSchema>>;
