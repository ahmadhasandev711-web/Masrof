import { toMinorUnits } from "@/lib/money";

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
export function resolveInvoiceTotals(
  invoice: {
    items: StoredInvoiceLine[];
    subtotal?: number | null;
    taxEnabled?: boolean | null;
    taxRatePercent?: number | null;
    taxAmount?: number | null;
    total?: number | null;
  },
): InvoiceMoneyTotals {
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
      taxRatePercent:
        typeof invoice.taxRatePercent === "number" ? invoice.taxRatePercent : 0,
      taxAmount:
        typeof invoice.taxAmount === "number" ? invoice.taxAmount : derived.taxAmount,
      total: invoice.total,
    };
  }

  return derived;
}
