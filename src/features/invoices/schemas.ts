import { z } from "zod";
import { idempotencyKeyField } from "@/lib/idempotency/fields";

type InvoiceValidationKey =
  | "invoiceItemDescription"
  | "amountPositive"
  | "invoiceClientRequired"
  | "invoiceIssueDateInvalid"
  | "invoiceItemsMin1";

type ValidationTranslator = (key: InvoiceValidationKey) => string;

function invoiceItemSchema(t: ValidationTranslator) {
  return z
    .object({
      description: z.string().trim().min(1, t("invoiceItemDescription")).max(200),
      quantity: z.coerce.number().positive(t("amountPositive")).optional(),
      unitPrice: z.coerce.number().positive(t("amountPositive")).optional(),
      /** Legacy major-unit line total when quantity/unitPrice omitted. */
      amount: z.coerce.number().positive(t("amountPositive")).optional(),
    })
    .superRefine((item, ctx) => {
      if (item.unitPrice == null && item.amount == null) {
        ctx.addIssue({
          code: "custom",
          message: t("amountPositive"),
          path: ["unitPrice"],
        });
      }
    })
    .transform((item) => ({
      description: item.description,
      quantity: item.quantity ?? 1,
      unitPrice: (item.unitPrice ?? item.amount) as number,
    }));
}

export function createInvoiceSchema(t: ValidationTranslator) {
  return z.object({
    workspaceId: z.string().min(1),
    clientId: z.string().min(1, t("invoiceClientRequired")),
    projectId: z.string().trim().optional().nullable(),
    issueDate: z.coerce.date({ message: t("invoiceIssueDateInvalid") }),
    dueDate: z.coerce.date().optional().nullable(),
    notes: z.string().trim().max(500).optional().default(""),
    items: z.array(invoiceItemSchema(t)).min(1, t("invoiceItemsMin1")),
    taxEnabled: z
      .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("on"), z.literal("")])
      .optional()
      .transform((v) => v === true || v === "true" || v === "on"),
    taxRatePercent: z.coerce.number().min(0).max(100).optional().default(0),
    idempotencyKey: idempotencyKeyField,
  });
}

export function updateInvoiceSchema(t: ValidationTranslator) {
  return createInvoiceSchema(t).omit({ idempotencyKey: true }).extend({
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

/** Service/repo input — accepts legacy `amount` or qty/`unitPrice` (major units). */
export type InvoiceLineInput = {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
};

type ParsedCreateInvoice = z.infer<ReturnType<typeof createInvoiceSchema>>;

export type CreateInvoiceInput = Omit<
  ParsedCreateInvoice,
  "items" | "taxEnabled" | "taxRatePercent"
> & {
  items: InvoiceLineInput[];
  taxEnabled?: boolean;
  taxRatePercent?: number;
};

export type UpdateInvoiceInput = Omit<
  z.infer<ReturnType<typeof updateInvoiceSchema>>,
  "items" | "taxEnabled" | "taxRatePercent"
> & {
  items: InvoiceLineInput[];
  taxEnabled?: boolean;
  taxRatePercent?: number;
};

export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;
