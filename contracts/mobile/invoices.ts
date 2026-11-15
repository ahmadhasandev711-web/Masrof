import { z } from "zod";
import { mobileListSchema, mobilePageSchema } from "./common";

export const mobileInvoiceLineSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  amount: z.number(),
});

export const mobileInvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  issueDate: z.string(),
  dueDate: z.string().nullable().optional(),
  items: z.array(mobileInvoiceLineSchema).optional(),
  subtotal: z.number().optional(),
  taxEnabled: z.boolean().optional(),
  taxRatePercent: z.number().optional(),
  taxAmount: z.number().optional(),
  total: z.number(),
  paidAmount: z.number().optional(),
  remainingAmount: z.number().optional(),
  clientName: z.string().optional(),
  clientId: z.string().optional(),
  status: z.string().optional(),
  financialStatus: z.string().optional(),
  projectId: z.string().nullable().optional(),
  projectName: z.string().nullable().optional(),
  /** `overdue` is derived from the due date (contracts/shared resolveInvoiceDisplayStatus). */
  displayStatus: z.string().optional(),
  notes: z.string().optional(),
  clientPhone: z.string().nullable().optional(),
  shareToken: z.string().nullable().optional(),
  isShareable: z.boolean().optional(),
});

export type MobileInvoice = z.infer<typeof mobileInvoiceSchema>;

export const mobileInvoiceSummarySchema = z.object({
  totalInvoiced: z.number(),
  totalPaid: z.number(),
  totalRemaining: z.number(),
  totalOverdue: z.number(),
  count: z.number(),
});

/** Same shape as the web's QuantityUsage (plan meter). */
export const mobileQuantityUsageSchema = z.object({
  used: z.number(),
  limit: z.number(),
  unlimited: z.boolean(),
  atLimit: z.boolean(),
});

export const mobileInvoicesPageResponseSchema = mobilePageSchema(mobileInvoiceSchema)
  .extend({
    summary: mobileInvoiceSummarySchema.optional(),
    usage: mobileQuantityUsageSchema.optional(),
  })
  .passthrough();
export type MobileInvoicesPageResponse = z.infer<typeof mobileInvoicesPageResponseSchema>;

export const mobileInvoicePaymentSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  accountName: z.string(),
  amount: z.number(),
  paymentDate: z.string(),
  paymentMethod: z.string(),
  reference: z.string(),
  notes: z.string(),
});
export type MobileInvoicePayment = z.infer<typeof mobileInvoicePaymentSchema>;

/** GET /api/mobile/invoices/[id] */
export const mobileInvoiceDetailResponseSchema = z.object({
  invoice: mobileInvoiceSchema,
  payments: z.array(mobileInvoicePaymentSchema),
});
export type MobileInvoiceDetailResponse = z.infer<typeof mobileInvoiceDetailResponseSchema>;

const invoiceLineBody = z.object({
  description: z.string(),
  quantity: z.coerce.number().optional(),
  unitPrice: z.coerce.number().optional(),
  amount: z.coerce.number().optional(),
});

/**
 * PATCH /api/mobile/invoices — every action goes through the same service
 * method the web uses (update / cancel / archive / share). There is no free
 * status setter: `paid` comes from payments, `cancelled` from `cancel`.
 */
export const mobileInvoicePatchBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    workspaceId: z.string().min(1),
    invoiceId: z.string().min(1),
    clientId: z.string(),
    projectId: z.string().nullable().optional(),
    issueDate: z.string(),
    dueDate: z.string().nullable().optional(),
    notes: z.string().optional(),
    items: z.array(invoiceLineBody),
    taxEnabled: z.boolean().optional(),
    taxRatePercent: z.coerce.number().optional(),
  }),
  z.object({ action: z.literal("cancel"), workspaceId: z.string().min(1), invoiceId: z.string().min(1) }),
  z.object({ action: z.literal("archive"), workspaceId: z.string().min(1), invoiceId: z.string().min(1) }),
  z.object({
    action: z.literal("share"),
    workspaceId: z.string().min(1),
    invoiceId: z.string().min(1),
    mode: z.enum(["get", "regenerate", "enable", "disable"]),
  }),
]);
export type MobileInvoicePatchBody = z.infer<typeof mobileInvoicePatchBodySchema>;

export const mobileInvoiceShareResponseSchema = z.object({
  token: z.string().nullable(),
  isShareable: z.boolean(),
});
export type MobileInvoiceShareResponse = z.infer<typeof mobileInvoiceShareResponseSchema>;

export const mobileInvoiceCreatedSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
});

export const mobileInvoicePaymentCreatedSchema = z.object({
  paymentId: z.string(),
});

export const mobileInvoiceTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(mobileInvoiceLineSchema),
  taxEnabled: z.boolean(),
  taxRatePercent: z.number(),
  sortOrder: z.number().optional(),
});

export type MobileInvoiceTemplate = z.infer<typeof mobileInvoiceTemplateSchema>;

export const mobileInvoiceTemplatesListResponseSchema = mobileListSchema(
  mobileInvoiceTemplateSchema,
).passthrough();

export const mobileInvoiceTemplateCreatedSchema = mobileInvoiceTemplateSchema;
