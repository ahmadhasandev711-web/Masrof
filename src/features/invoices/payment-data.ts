import "server-only";

/**
 * Compatibility barrel for payment reads/writes.
 * Prefer `@/features/invoices/invoices.service` for new call sites.
 */
import { invoicesService } from "@/features/invoices/invoices.service";
import type { RecordPaymentInput } from "@/features/invoices/payment-schemas";

export {
  InvalidPaymentReferenceError,
  InvoiceOverpaymentError,
  InvoiceCancelledError,
  AccountCurrencyMismatchError,
} from "@/features/invoices/invoices.errors";

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: Error }): T {
  if (!result.ok) throw result.error;
  return result.value;
}

export async function recordInvoicePayment(input: RecordPaymentInput, userId: string) {
  return unwrap(await invoicesService.recordPayment(userId, input));
}

export async function getInvoicePayments(invoiceId: string, workspaceId: string) {
  return invoicesService.listPayments(invoiceId, workspaceId);
}

export async function getInvoiceFinancialSummary(invoiceId: string, workspaceId: string) {
  return invoicesService.getFinancialSummary(invoiceId, workspaceId);
}
