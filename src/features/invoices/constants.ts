export const INVOICE_PRINT_FORMATS = ["a4", "pos"] as const;
export type InvoicePrintFormat = (typeof INVOICE_PRINT_FORMATS)[number];

export function parseInvoicePrintFormat(value: string | undefined): InvoicePrintFormat {
  return value === "pos" ? "pos" : "a4";
}
