import { z } from "zod";

type InvoiceValidationKey =
  | "invoiceItemDescription"
  | "amountPositive"
  | "invoiceClientRequired"
  | "invoiceIssueDateInvalid"
  | "invoiceItemsMin1";

type ValidationTranslator = (key: InvoiceValidationKey) => string;

export function createInvoiceSchema(t: ValidationTranslator) {
  const invoiceItemSchema = z.object({
    description: z.string().trim().min(1, t("invoiceItemDescription")).max(200),
    amount: z.coerce.number().positive(t("amountPositive")),
  });

  return z.object({
    workspaceId: z.string().min(1),
    clientId: z.string().min(1, t("invoiceClientRequired")),
    issueDate: z.coerce.date({ message: t("invoiceIssueDateInvalid") }),
    dueDate: z.coerce.date().optional().nullable(),
    notes: z.string().trim().max(500).optional().default(""),
    items: z.array(invoiceItemSchema).min(1, t("invoiceItemsMin1")),
  });
}

export type CreateInvoiceInput = z.infer<ReturnType<typeof createInvoiceSchema>>;
