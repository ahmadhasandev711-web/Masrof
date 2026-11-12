import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/invoices/invoices.service` for writes
 * and `@/features/invoices/invoices.repository` for persistence-only access.
 */
import { invoicesService } from "@/features/invoices/invoices.service";
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilters,
} from "@/features/invoices/schemas";
import type { InvoiceStatus } from "@/models/invoice";
import type { WorkspaceBrandingForPrint } from "@/features/invoices/invoices.repository";

export {
  InvalidInvoiceReferenceError,
  InvoicePaidStatusNotAllowedError,
} from "@/features/invoices/invoices.errors";

export type {
  InvoicesPage,
  WorkspaceBrandingForPrint,
} from "@/features/invoices/invoices.repository";

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: Error }): T {
  if (!result.ok) throw result.error;
  return result.value;
}

export async function createInvoice(input: CreateInvoiceInput) {
  return unwrap(await invoicesService.createValidated(input));
}

export async function updateInvoiceStatus(
  invoiceId: string,
  workspaceId: string,
  status: InvoiceStatus,
) {
  return unwrap(await invoicesService.updateStatus(invoiceId, workspaceId, status));
}

export async function updateInvoice(input: UpdateInvoiceInput) {
  return unwrap(await invoicesService.update(input));
}

export async function cancelInvoice(invoiceId: string, workspaceId: string) {
  return unwrap(await invoicesService.cancel(invoiceId, workspaceId));
}

export async function archiveInvoice(invoiceId: string, workspaceId: string) {
  return unwrap(await invoicesService.archive(invoiceId, workspaceId));
}

export const listInvoicesForWorkspace = (workspaceId: string) =>
  invoicesService.listForWorkspace(workspaceId);

export const listInvoicesPaginated = (
  workspaceId: string,
  page?: number,
  pageSize?: number,
) => invoicesService.listPaginated(workspaceId, page, pageSize);

export const listInvoicesWithFilters = (filters: InvoiceFilters) =>
  invoicesService.listWithFilters(filters);

export const getInvoiceForPrint = (
  invoiceId: string,
  workspaceId: string,
  branding: WorkspaceBrandingForPrint,
) => invoicesService.getForPrint(invoiceId, workspaceId, branding);
