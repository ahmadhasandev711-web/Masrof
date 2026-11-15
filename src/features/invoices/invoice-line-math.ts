/** Invoice line/tax math lives in `contracts/shared/invoices` (shared with the mobile app). */
export {
  normalizeInvoiceLine,
  lineFromMajorInput,
  computeInvoiceTotals,
  resolveInvoiceTotals,
  type StoredInvoiceLine,
  type NormalizedInvoiceLine,
  type InvoiceTaxInput,
  type InvoiceMoneyTotals,
} from "@contracts/shared/invoices";
