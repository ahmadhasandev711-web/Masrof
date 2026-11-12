import { z } from "zod";
import { mobilePageSchema } from "./common";

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
});

export type MobileInvoice = z.infer<typeof mobileInvoiceSchema>;

export const mobileInvoicesPageResponseSchema = mobilePageSchema(mobileInvoiceSchema).passthrough();

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
});

export type MobileInvoiceTemplate = z.infer<typeof mobileInvoiceTemplateSchema>;
