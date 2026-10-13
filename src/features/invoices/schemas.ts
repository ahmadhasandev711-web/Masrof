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
    projectId: z.string().trim().optional().nullable(),
    issueDate: z.coerce.date({ message: t("invoiceIssueDateInvalid") }),
    dueDate: z.coerce.date().optional().nullable(),
    notes: z.string().trim().max(500).optional().default(""),
    items: z.array(invoiceItemSchema).min(1, t("invoiceItemsMin1")),
  });
}

export function updateInvoiceSchema(t: ValidationTranslator) {
  return createInvoiceSchema(t).extend({
    invoiceId: z.string().min(1),
  });
}

export const invoiceFiltersSchema = z.object({
  workspaceId: z.string().min(1),
  status: z.enum(["all", "unpaid", "partially_paid", "paid", "overdue", "cancelled"]).optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  search: z.string().trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateInvoiceInput = z.infer<ReturnType<typeof createInvoiceSchema>>;
export type UpdateInvoiceInput = z.infer<ReturnType<typeof updateInvoiceSchema>>;
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;
