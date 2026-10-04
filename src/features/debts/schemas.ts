import { z } from "zod";

type ValidationTranslator = (key: string) => string;

export function createDebtSchema(t: ValidationTranslator) {
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
  });
}

export function recordDebtPaymentSchema(t: ValidationTranslator) {
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
  });
}

export type CreateDebtInput = z.infer<ReturnType<typeof createDebtSchema>>;
export type RecordDebtPaymentInput = z.infer<ReturnType<typeof recordDebtPaymentSchema>>;
