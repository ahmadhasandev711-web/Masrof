import "server-only";

import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilters,
} from "@/features/invoices/schemas";
import type { RecordPaymentInput } from "@/features/invoices/payment-schemas";
import type { InvoiceStatus } from "@/models/invoice";
import {
  InvoicesRepository,
  invoicesRepository,
  type WorkspaceBrandingForPrint,
} from "@/features/invoices/invoices.repository";
import {
  InvalidInvoiceReferenceError,
  InvoicePaidStatusNotAllowedError,
} from "@/features/invoices/invoices.errors";
import { isAppError } from "@/server/kernel/errors";
import { err, ok, type Result } from "@/server/kernel/result";

export class InvoicesService {
  constructor(private readonly repo: InvoicesRepository = invoicesRepository) {}

  /**
   * Create with plan gates. Prefer this from actions and mobile routes.
   * Plan modules are loaded lazily so unit tests that only exercise
   * createValidated / updates do not need full server env.
   */
  async create(userId: string, input: CreateInvoiceInput) {
    const { requirePlanFeature, requireQuantityLimit } = await import(
      "@/server/kernel/plan-policy"
    );
    const { countInvoicesCreatedThisMonth } = await import(
      "@/features/subscriptions/plan-usage"
    );

    const feature = await requirePlanFeature(userId, input.workspaceId, "clientsAndProjects");
    if (!feature.ok) return feature;

    const invoiceCount = await countInvoicesCreatedThisMonth(input.workspaceId);
    const limit = await requireQuantityLimit(
      userId,
      input.workspaceId,
      "maxInvoicesPerMonth",
      invoiceCount,
    );
    if (!limit.ok) return limit;

    return this.createValidated(input);
  }

  /**
   * Create without plan gates — used by the compatibility barrel / unit tests.
   */
  async createValidated(input: CreateInvoiceInput) {
    const existing = await this.repo.findByIdempotencyKey(
      input.workspaceId,
      input.idempotencyKey,
    );
    if (existing) return ok(existing);

    const client = await this.repo.findActiveClient(input.clientId, input.workspaceId);
    if (!client) {
      return err(new InvalidInvoiceReferenceError("clientNotFoundShort"));
    }

    let validatedProjectId: string | null = null;
    if (input.projectId) {
      const project = await this.repo.findActiveProjectForClient(
        input.projectId,
        input.workspaceId,
        input.clientId,
      );
      if (!project) {
        return err(new InvalidInvoiceReferenceError("projectNotFoundShort"));
      }
      validatedProjectId = String(project._id);
    }

    const created = await this.repo.create(input, validatedProjectId);
    return ok(created);
  }

  async update(input: UpdateInvoiceInput) {
    const client = await this.repo.findActiveClient(input.clientId, input.workspaceId);
    if (!client) {
      return err(new InvalidInvoiceReferenceError("clientNotFoundShort"));
    }

    let validatedProjectId: string | null = null;
    if (input.projectId) {
      const project = await this.repo.findActiveProjectForClient(
        input.projectId,
        input.workspaceId,
        input.clientId,
      );
      if (!project) {
        return err(new InvalidInvoiceReferenceError("projectNotFoundShort"));
      }
      validatedProjectId = String(project._id);
    }

    const invoice = await this.repo.findActiveInvoiceDoc(input.invoiceId, input.workspaceId);
    if (!invoice) {
      return err(new InvalidInvoiceReferenceError("invoiceNotFound"));
    }

    const { computeInvoiceTotals, lineFromMajorInput } = await import(
      "@/features/invoices/invoice-line-math"
    );
    const lines = input.items.map((item) => lineFromMajorInput(item));
    const money = computeInvoiceTotals(lines, {
      taxEnabled: input.taxEnabled,
      taxRatePercent: input.taxRatePercent,
    });
    const existingPaid = await this.repo.sumPaymentsForInvoice(invoice._id, input.workspaceId);
    if (money.total < existingPaid) {
      return err(new InvalidInvoiceReferenceError("totalLessThanPaid"));
    }

    const updated = await this.repo.update(input, validatedProjectId);
    if (!updated) {
      return err(new InvalidInvoiceReferenceError("invoiceNotFound"));
    }
    return ok(updated);
  }

  async updateStatus(invoiceId: string, workspaceId: string, status: InvoiceStatus) {
    if (status === "paid") {
      return err(new InvoicePaidStatusNotAllowedError());
    }
    const updated = await this.repo.updateStatus(invoiceId, workspaceId, status);
    return ok(updated);
  }

  async cancel(invoiceId: string, workspaceId: string) {
    const invoice = await this.repo.findActiveInvoiceDoc(invoiceId, workspaceId);
    if (!invoice) {
      return err(new InvalidInvoiceReferenceError("invoiceNotFound"));
    }

    const hasPayments = await this.repo.paymentExists(invoiceId, workspaceId);
    if (hasPayments) {
      return err(new InvalidInvoiceReferenceError("cannotCancelWithRecordedPayments"));
    }

    const cancelled = await this.repo.cancel(invoiceId, workspaceId);
    if (!cancelled) {
      return err(new InvalidInvoiceReferenceError("invoiceNotFound"));
    }
    return ok(cancelled);
  }

  async archive(invoiceId: string, workspaceId: string) {
    const invoice = await this.repo.findActiveInvoiceDoc(invoiceId, workspaceId);
    if (!invoice) {
      return err(new InvalidInvoiceReferenceError("invoiceNotFound"));
    }

    const hasPayments = await this.repo.paymentExists(invoiceId, workspaceId);
    if (hasPayments) {
      return err(new InvalidInvoiceReferenceError("cannotArchiveWithRecordedPayments"));
    }

    const archived = await this.repo.archive(invoiceId, workspaceId);
    if (!archived) {
      return err(new InvalidInvoiceReferenceError("invoiceNotFound"));
    }
    return ok(archived);
  }

  async getOrCreateShareToken(invoiceId: string, workspaceId: string) {
    const token = await this.repo.getOrCreateShareToken(invoiceId, workspaceId);
    if (!token) return err(new InvalidInvoiceReferenceError("invoiceNotFound"));
    return ok(token);
  }

  async regenerateShareToken(invoiceId: string, workspaceId: string) {
    const token = await this.repo.regenerateShareToken(invoiceId, workspaceId);
    if (!token) return err(new InvalidInvoiceReferenceError("invoiceNotFound"));
    return ok(token);
  }

  async toggleShareable(invoiceId: string, workspaceId: string, isShareable: boolean) {
    const success = await this.repo.setShareable(invoiceId, workspaceId, isShareable);
    return ok(success);
  }

  async recordPayment(userId: string, input: RecordPaymentInput) {
    try {
      const payment = await this.repo.recordPayment(input, userId);
      return ok(payment);
    } catch (error) {
      if (isAppError(error)) return err(error);
      throw error;
    }
  }

  listPayments(invoiceId: string, workspaceId: string) {
    return this.repo.listPayments(invoiceId, workspaceId);
  }

  getFinancialSummary(invoiceId: string, workspaceId: string) {
    return this.repo.getFinancialSummary(invoiceId, workspaceId);
  }

  listForWorkspace(workspaceId: string) {
    return this.repo.listForWorkspace(workspaceId);
  }

  listPaginated(workspaceId: string, page?: number, pageSize?: number) {
    return this.repo.listPaginated(workspaceId, page, pageSize);
  }

  listWithFilters(filters: InvoiceFilters) {
    return this.repo.listWithFilters(filters);
  }

  getForPrint(
    invoiceId: string,
    workspaceId: string,
    branding: WorkspaceBrandingForPrint,
  ) {
    return this.repo.getForPrint(invoiceId, workspaceId, branding);
  }

  getPublicInvoiceByToken(token: string) {
    return this.repo.getPublicInvoiceByToken(token);
  }
}

export const invoicesService = new InvoicesService();
