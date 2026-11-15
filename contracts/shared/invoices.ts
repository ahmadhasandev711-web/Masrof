/**
 * Invoice rules shared by the web app, `/api/mobile` and the mobile app:
 * statuses, line/tax math (MinorUnits), display status (overdue), and the
 * create / update / filter / payment schemas.
 */
import { z } from "zod";
import { toMinorUnits } from "./money";
import { idempotencyKeyField } from "./schemas";

// ── Enums ───────────────────────────────────────────────────────────────────

export const INVOICE_STATUSES = ["draft", "sent", "paid", "cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "bank_transfer", "card", "check", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const INVOICE_FILTER_STATUSES = [
  "all",
  "unpaid",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
] as const;
export type InvoiceFilterStatus = (typeof INVOICE_FILTER_STATUSES)[number];

/** Egyptian VAT — the web form's default when tax is switched on. */
export const DEFAULT_INVOICE_TAX_RATE_PERCENT = 14;

// ── Display status ──────────────────────────────────────────────────────────

export type InvoiceDisplayStatus = InvoiceStatus | "overdue";

export function resolveInvoiceDisplayStatus(input: {
  status: InvoiceStatus | string | null | undefined;
  dueDate: Date | string | null | undefined;
  now?: Date;
}): InvoiceDisplayStatus {
  const status = (input.status ?? "sent") as InvoiceStatus;
  if (status === "paid" || status === "cancelled" || status === "draft") {
    return status;
  }

  if (!input.dueDate) return "sent";

  const due = input.dueDate instanceof Date ? input.dueDate : new Date(input.dueDate);
  const now = input.now ?? new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dueDay.getTime() < today.getTime()) {
    return "overdue";
  }

  return "sent";
}

// ── Line & tax math (MinorUnits) ────────────────────────────────────────────

/** Raw line as stored on an invoice document (minor units). */
export type StoredInvoiceLine = {
  description: string;
  amount: number;
  quantity?: number | null;
  unitPrice?: number | null;
};

/** Normalized line for API / UI (minor units). */
export type NormalizedInvoiceLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type InvoiceTaxInput = {
  taxEnabled?: boolean | null;
  taxRatePercent?: number | null;
};

export type InvoiceMoneyTotals = {
  subtotal: number;
  taxEnabled: boolean;
  taxRatePercent: number;
  taxAmount: number;
  total: number;
};

/** Old invoices may omit quantity/unitPrice — treat as qty 1, unitPrice = amount. */
export function normalizeInvoiceLine(item: StoredInvoiceLine): NormalizedInvoiceLine {
  const amount = item.amount;
  const quantity =
    typeof item.quantity === "number" && Number.isFinite(item.quantity) && item.quantity > 0
      ? item.quantity
      : 1;
  const unitPrice =
    typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice) && item.unitPrice > 0
      ? item.unitPrice
      : amount;
  return {
    description: item.description,
    quantity,
    unitPrice,
    amount,
  };
}

/** Build stored line from major-unit form/API input. */
export function lineFromMajorInput(input: {
  description: string;
  quantity?: number;
  unitPrice?: number;
  /** Legacy: amount in major units when unitPrice omitted. */
  amount?: number;
}): NormalizedInvoiceLine {
  const quantity =
    typeof input.quantity === "number" && Number.isFinite(input.quantity) && input.quantity > 0
      ? input.quantity
      : 1;
  const unitPriceMajor =
    typeof input.unitPrice === "number" && Number.isFinite(input.unitPrice) && input.unitPrice > 0
      ? input.unitPrice
      : typeof input.amount === "number"
        ? input.amount
        : 0;
  const unitPrice = toMinorUnits(unitPriceMajor);
  const amount = Math.round(quantity * unitPrice);
  return {
    description: input.description.trim(),
    quantity,
    unitPrice,
    amount: Math.max(1, amount),
  };
}

export function computeInvoiceTotals(
  items: { amount: number }[],
  tax: InvoiceTaxInput = {},
): InvoiceMoneyTotals {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxEnabled = Boolean(tax.taxEnabled);
  const taxRatePercent =
    taxEnabled && typeof tax.taxRatePercent === "number" && Number.isFinite(tax.taxRatePercent)
      ? Math.max(0, tax.taxRatePercent)
      : 0;
  const taxAmount = taxEnabled ? Math.round((subtotal * taxRatePercent) / 100) : 0;
  return {
    subtotal,
    taxEnabled,
    taxRatePercent,
    taxAmount,
    total: subtotal + taxAmount,
  };
}

/** Prefer stored totals when present; otherwise derive from lines (legacy docs). */
export function resolveInvoiceTotals(invoice: {
  items: StoredInvoiceLine[];
  subtotal?: number | null;
  taxEnabled?: boolean | null;
  taxRatePercent?: number | null;
  taxAmount?: number | null;
  total?: number | null;
}): InvoiceMoneyTotals {
  const lines = invoice.items.map(normalizeInvoiceLine);
  const derived = computeInvoiceTotals(lines, {
    taxEnabled: invoice.taxEnabled,
    taxRatePercent: invoice.taxRatePercent,
  });

  if (
    typeof invoice.subtotal === "number" &&
    typeof invoice.total === "number" &&
    Number.isFinite(invoice.subtotal) &&
    Number.isFinite(invoice.total)
  ) {
    return {
      subtotal: invoice.subtotal,
      taxEnabled: Boolean(invoice.taxEnabled),
      taxRatePercent: typeof invoice.taxRatePercent === "number" ? invoice.taxRatePercent : 0,
      taxAmount: typeof invoice.taxAmount === "number" ? invoice.taxAmount : derived.taxAmount,
      total: invoice.total,
    };
  }

  return derived;
}

// ── Schemas ─────────────────────────────────────────────────────────────────

export type InvoiceValidationKey =
  | "invoiceItemDescription"
  | "amountPositive"
  | "invoiceClientRequired"
  | "invoiceIssueDateInvalid"
  | "invoiceItemsMin1";

type InvoiceTranslator = (key: InvoiceValidationKey) => string;

function invoiceItemSchema(t: InvoiceTranslator) {
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

export function createInvoiceSchema(t: InvoiceTranslator) {
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

export function updateInvoiceSchema(t: InvoiceTranslator) {
  return createInvoiceSchema(t).omit({ idempotencyKey: true }).extend({
    invoiceId: z.string().min(1),
  });
}

export const invoiceFiltersSchema = z.object({
  workspaceId: z.string().min(1),
  status: z.enum(INVOICE_FILTER_STATUSES).optional(),
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

export type PaymentValidationKey = "accountRequired" | "amountPositive" | "invalidDate";

export function recordPaymentSchema(t: (key: PaymentValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    invoiceId: z.string().min(1),
    accountId: z.string().min(1, t("accountRequired")),
    categoryId: z.string().trim().optional().nullable(),
    amount: z.coerce.number().positive(t("amountPositive")),
    paymentDate: z.coerce.date({ message: t("invalidDate") }),
    paymentMethod: z.enum(PAYMENT_METHODS).default("bank_transfer"),
    reference: z.string().trim().max(100).optional().default(""),
    notes: z.string().trim().max(500).optional().default(""),
    idempotencyKey: idempotencyKeyField,
  });
}

export type RecordPaymentInput = z.infer<ReturnType<typeof recordPaymentSchema>>;
