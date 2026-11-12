import "server-only";

import crypto from "crypto";
import mongoose from "mongoose";
import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { runInTransaction } from "@/lib/db/transaction";
import { toPlain } from "@/lib/db/plain";
import { toMinorUnits } from "@/lib/money";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { resolveAccountCurrency } from "@/lib/currency";
import {
  findWorkspaceIdempotentId,
  registerWorkspaceIdempotentResource,
} from "@/lib/idempotency/workspace-resource";
import { InvoiceModel, type InvoiceStatus } from "@/models/invoice";
import { InvoicePaymentModel, type PaymentMethod } from "@/models/invoice-payment";
import { ClientModel } from "@/models/client";
import { ProjectModel } from "@/models/project";
import { TransactionModel } from "@/models/transaction";
import { AccountModel } from "@/models/account";
import { CategoryModel } from "@/models/category";
import { WorkspaceModel } from "@/models/workspace";
import { resolveInvoiceDisplayStatus } from "@/features/invoices/status";
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilters,
} from "@/features/invoices/schemas";
import type { RecordPaymentInput } from "@/features/invoices/payment-schemas";
import type {
  InvoiceFinancialStatus,
  InvoiceFinancialSummary,
  InvoiceListItem,
  InvoicePaymentListItem,
  InvoicePrintView,
  InvoiceSummary,
  PublicInvoiceView,
} from "@/features/invoices/types";
import {
  AccountCurrencyMismatchError,
  InvalidPaymentReferenceError,
  InvoiceCancelledError,
  InvoiceOverpaymentError,
} from "@/features/invoices/invoices.errors";
import {
  computeInvoiceTotals,
  lineFromMajorInput,
  normalizeInvoiceLine,
  resolveInvoiceTotals,
} from "@/features/invoices/invoice-line-math";

export type WorkspaceBrandingForPrint = {
  name: string;
  businessName?: string | null;
  logoUrl?: string | null;
  taxId?: string | null;
  businessPhone?: string | null;
  businessAddress?: string | null;
  currency: string;
};

export type InvoicesPage = {
  items: InvoiceListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function mapInvoiceListItem(
  invoice: {
    _id: unknown;
    invoiceNumber: string;
    issueDate: Date | string;
    dueDate?: Date | string | null;
    items: {
      description: string;
      amount: number;
      quantity?: number | null;
      unitPrice?: number | null;
    }[];
    subtotal?: number | null;
    taxEnabled?: boolean | null;
    taxRatePercent?: number | null;
    taxAmount?: number | null;
    total?: number | null;
    clientId: unknown;
    projectId?: unknown;
    notes?: string;
    status?: InvoiceStatus;
    paidAt?: Date | string | null;
    shareToken?: string | null;
    isShareable?: boolean;
    viewedAt?: Date | string | null;
  },
  paidAmount: number,
): InvoiceListItem {
  const client = invoice.clientId as
    | { _id?: unknown; name?: string; phone?: string | null }
    | null;
  const project = invoice.projectId as { _id?: unknown; name?: string } | null;
  const money = resolveInvoiceTotals(invoice);
  const totalAmount = money.total;
  const status = (invoice.status ?? "sent") as InvoiceStatus;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  let financialStatus: InvoiceFinancialStatus;
  if (paidAmount >= totalAmount && totalAmount > 0) {
    financialStatus = "paid";
  } else if (paidAmount > 0) {
    financialStatus = "partially_paid";
  } else if (status === "paid") {
    financialStatus = "legacy_paid";
  } else {
    financialStatus = "unpaid";
  }

  return {
    _id: String(invoice._id),
    invoiceNumber: invoice.invoiceNumber,
    issueDate: new Date(invoice.issueDate).toISOString(),
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
    items: invoice.items.map((it) => normalizeInvoiceLine(it)),
    subtotal: money.subtotal,
    taxEnabled: money.taxEnabled,
    taxRatePercent: money.taxRatePercent,
    taxAmount: money.taxAmount,
    total: totalAmount,
    paidAmount,
    remainingAmount,
    clientName: client?.name ?? "—",
    clientId: client?._id ? String(client._id) : String(invoice.clientId),
    projectId: project?._id
      ? String(project._id)
      : invoice.projectId
        ? String(invoice.projectId)
        : null,
    projectName: project?.name ?? null,
    notes: invoice.notes ?? "",
    status,
    displayStatus: resolveInvoiceDisplayStatus({
      status,
      dueDate: invoice.dueDate,
    }),
    financialStatus,
    paidAt: invoice.paidAt ? new Date(invoice.paidAt).toISOString() : null,
    clientPhone: client?.phone ?? null,
    shareToken: invoice.shareToken ?? null,
    isShareable: invoice.isShareable ?? true,
    viewedAt: invoice.viewedAt ? new Date(invoice.viewedAt).toISOString() : null,
  };
}

export function generateSecureShareToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

async function queryInvoicesPage(workspaceId: string, skip: number, limit: number) {
  await connectToDatabase();

  const [invoices, total] = await Promise.all([
    InvoiceModel.find({ workspaceId, isArchived: false })
      .sort({ issueDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("clientId", "name phone")
      .populate("projectId", "name")
      .lean(),
    InvoiceModel.countDocuments({ workspaceId, isArchived: false }),
  ]);

  const invoiceIds = invoices.map((inv) => inv._id);

  const paymentAggregates =
    invoiceIds.length > 0
      ? await InvoicePaymentModel.aggregate<{
          _id: mongoose.Types.ObjectId;
          paidTotal: number;
        }>([
          {
            $match: {
              workspaceId: new mongoose.Types.ObjectId(workspaceId),
              invoiceId: { $in: invoiceIds },
              isArchived: false,
            },
          },
          {
            $group: {
              _id: "$invoiceId",
              paidTotal: { $sum: "$amount" },
            },
          },
        ])
      : [];

  const paidMap = new Map<string, number>(
    paymentAggregates.map((agg) => [String(agg._id), agg.paidTotal]),
  );

  const items = toPlain(
    invoices.map((invoice) =>
      mapInvoiceListItem(invoice, paidMap.get(String(invoice._id)) ?? 0),
    ),
  );

  return { items, total };
}

export class InvoicesRepository {
  async findByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    await connectToDatabase();
    const existingId = await findWorkspaceIdempotentId(workspaceId, idempotencyKey);
    if (!existingId) return null;
    return InvoiceModel.findOne({ _id: existingId, workspaceId }).lean();
  }

  async findActiveClient(clientId: string, workspaceId: string) {
    await connectToDatabase();
    return ClientModel.findOne({
      _id: clientId,
      workspaceId,
      isArchived: false,
    }).lean();
  }

  async findActiveProjectForClient(
    projectId: string,
    workspaceId: string,
    clientId: string,
  ) {
    await connectToDatabase();
    return ProjectModel.findOne({
      _id: projectId,
      workspaceId,
      clientId,
      isArchived: false,
    }).lean();
  }

  async nextInvoiceNumber(workspaceId: string, issueDate: Date): Promise<string> {
    await connectToDatabase();
    const year = issueDate.getFullYear();
    const prefix = `INV-${year}-`;
    const count = await InvoiceModel.countDocuments({
      workspaceId,
      invoiceNumber: { $regex: `^${prefix}` },
    });
    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  async create(
    input: CreateInvoiceInput,
    validatedProjectId: string | null,
  ) {
    await connectToDatabase();
    const invoiceNumber = await this.nextInvoiceNumber(input.workspaceId, input.issueDate);
    const items = input.items.map((item) => lineFromMajorInput(item));
    const money = computeInvoiceTotals(items, {
      taxEnabled: input.taxEnabled,
      taxRatePercent: input.taxRatePercent,
    });

    const invoice = await InvoiceModel.create({
      workspaceId: input.workspaceId,
      clientId: input.clientId,
      projectId: validatedProjectId,
      invoiceNumber,
      issueDate: input.issueDate,
      dueDate: input.dueDate ?? null,
      items,
      subtotal: money.subtotal,
      taxEnabled: money.taxEnabled,
      taxRatePercent: money.taxRatePercent,
      taxAmount: money.taxAmount,
      total: money.total,
      notes: input.notes ?? "",
      status: "sent",
      paidAt: null,
      shareToken: crypto.randomBytes(16).toString("hex"),
      isShareable: true,
    });

    const invoiceResourceId =
      invoice._id != null ? String(invoice._id) : String(invoice.toObject()._id);
    await registerWorkspaceIdempotentResource(
      input.workspaceId,
      input.idempotencyKey,
      "invoice",
      invoiceResourceId,
    );

    return invoice.toObject();
  }

  async findActiveInvoiceDoc(invoiceId: string, workspaceId: string) {
    await connectToDatabase();
    return InvoiceModel.findOne({
      _id: invoiceId,
      workspaceId,
      isArchived: false,
    });
  }

  async findActiveInvoiceLean(invoiceId: string, workspaceId: string) {
    await connectToDatabase();
    return InvoiceModel.findOne({
      _id: invoiceId,
      workspaceId,
      isArchived: false,
    }).lean();
  }

  async updateStatus(invoiceId: string, workspaceId: string, status: InvoiceStatus) {
    await connectToDatabase();
    return InvoiceModel.findOneAndUpdate(
      { _id: invoiceId, workspaceId, isArchived: false },
      { status },
      { returnDocument: "after" },
    ).lean();
  }

  async paymentExists(invoiceId: string, workspaceId: string) {
    await connectToDatabase();
    return InvoicePaymentModel.exists({
      invoiceId,
      workspaceId,
      isArchived: false,
    });
  }

  async sumPaymentsForInvoice(invoiceId: unknown, workspaceId: string) {
    await connectToDatabase();
    const paymentAgg = await InvoicePaymentModel.aggregate<{ sum: number }>([
      {
        $match: {
          invoiceId:
            invoiceId instanceof mongoose.Types.ObjectId
              ? invoiceId
              : new mongoose.Types.ObjectId(String(invoiceId)),
          workspaceId: new mongoose.Types.ObjectId(workspaceId),
          isArchived: false,
        },
      },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);
    return paymentAgg[0]?.sum ?? 0;
  }

  async cancel(invoiceId: string, workspaceId: string) {
    const invoice = await this.findActiveInvoiceDoc(invoiceId, workspaceId);
    if (!invoice) return null;
    invoice.status = "cancelled";
    invoice.paidAt = null;
    await invoice.save();
    return toPlain(invoice);
  }

  async archive(invoiceId: string, workspaceId: string) {
    const invoice = await this.findActiveInvoiceDoc(invoiceId, workspaceId);
    if (!invoice) return null;
    invoice.isArchived = true;
    await invoice.save();
    return toPlain(invoice);
  }

  async update(
    input: UpdateInvoiceInput,
    validatedProjectId: string | null,
  ) {
    const invoice = await this.findActiveInvoiceDoc(input.invoiceId, input.workspaceId);
    if (!invoice) return null;

    const newItems = input.items.map((item) => lineFromMajorInput(item));
    const money = computeInvoiceTotals(newItems, {
      taxEnabled: input.taxEnabled,
      taxRatePercent: input.taxRatePercent,
    });

    invoice.clientId = new mongoose.Types.ObjectId(input.clientId);
    invoice.projectId = validatedProjectId
      ? new mongoose.Types.ObjectId(validatedProjectId)
      : null;
    invoice.issueDate = input.issueDate;
    invoice.dueDate = input.dueDate ?? null;
    invoice.notes = input.notes ?? "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoice.items = newItems as any;
    invoice.subtotal = money.subtotal;
    invoice.taxEnabled = money.taxEnabled;
    invoice.taxRatePercent = money.taxRatePercent;
    invoice.taxAmount = money.taxAmount;
    invoice.total = money.total;

    if (invoice.status === "cancelled") {
      invoice.status = "sent";
    }

    await invoice.save();
    return toPlain(invoice);
  }

  listForWorkspace = unstable_cache(
    async (workspaceId: string): Promise<InvoiceListItem[]> => {
      const { items } = await queryInvoicesPage(workspaceId, 0, 1000);
      return items;
    },
    ["invoices-for-workspace"],
    { revalidate: 30, tags: [CACHE_TAGS.invoices] },
  );

  async listPaginated(
    workspaceId: string,
    page = 1,
    pageSize = 30,
  ): Promise<InvoicesPage> {
    const skip = (page - 1) * pageSize;
    const { items, total } = await queryInvoicesPage(workspaceId, skip, pageSize);
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getForPrint(
    invoiceId: string,
    workspaceId: string,
    branding: WorkspaceBrandingForPrint,
  ): Promise<InvoicePrintView | null> {
    await connectToDatabase();

    const invoice = await InvoiceModel.findOne({
      _id: invoiceId,
      workspaceId,
      isArchived: false,
    })
      .populate("clientId", "name email phone")
      .populate("projectId", "name")
      .lean();

    if (!invoice) return null;

    const client = invoice.clientId as {
      name?: string;
      email?: string | null;
      phone?: string | null;
    } | null;

    const project = invoice.projectId as {
      _id?: unknown;
      name?: string;
    } | null;

    const items = invoice.items.map((item) => normalizeInvoiceLine(item));
    const money = resolveInvoiceTotals(invoice);
    const totalAmount = money.total;
    const status = (invoice.status ?? "sent") as InvoiceStatus;

    const paymentAgg = await InvoicePaymentModel.aggregate<{ paidTotal: number }>([
      {
        $match: {
          workspaceId: new mongoose.Types.ObjectId(workspaceId),
          invoiceId: invoice._id,
          isArchived: false,
        },
      },
      {
        $group: {
          _id: null,
          paidTotal: { $sum: "$amount" },
        },
      },
    ]);
    const paidAmount = paymentAgg[0]?.paidTotal ?? 0;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    let financialStatus: InvoiceFinancialStatus;
    if (paidAmount >= totalAmount && totalAmount > 0) {
      financialStatus = "paid";
    } else if (paidAmount > 0) {
      financialStatus = "partially_paid";
    } else if (status === "paid") {
      financialStatus = "legacy_paid";
    } else {
      financialStatus = "unpaid";
    }

    const displayName = (branding.businessName || "").trim() || branding.name;

    return {
      id: String(invoice._id),
      invoiceNumber: invoice.invoiceNumber,
      issueDate: new Date(invoice.issueDate).toISOString(),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
      items,
      subtotal: money.subtotal,
      taxEnabled: money.taxEnabled,
      taxRatePercent: money.taxRatePercent,
      taxAmount: money.taxAmount,
      total: totalAmount,
      paidAmount,
      remainingAmount,
      financialStatus,
      notes: invoice.notes ?? "",
      status,
      client: {
        name: client?.name ?? "—",
        email: client?.email ?? null,
        phone: client?.phone ?? null,
      },
      projectId: project?._id
        ? String(project._id)
        : invoice.projectId
          ? String(invoice.projectId)
          : null,
      projectName: project?.name ?? null,
      workspaceName: branding.name,
      businessName: displayName,
      logoUrl: branding.logoUrl || null,
      taxId: branding.taxId || null,
      businessPhone: branding.businessPhone || null,
      businessAddress: branding.businessAddress || null,
      currency: branding.currency,
    };
  }

  async listWithFilters(filters: InvoiceFilters): Promise<{
    items: InvoiceListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: InvoiceSummary;
  }> {
    await connectToDatabase();

    const baseMatch: Record<string, unknown> = {
      workspaceId: new mongoose.Types.ObjectId(filters.workspaceId),
      isArchived: false,
    };

    if (filters.clientId) {
      baseMatch.clientId = new mongoose.Types.ObjectId(filters.clientId);
    }
    if (filters.projectId) {
      baseMatch.projectId = new mongoose.Types.ObjectId(filters.projectId);
    }
    if (filters.search) {
      baseMatch.invoiceNumber = { $regex: filters.search, $options: "i" };
    }
    if (filters.dateFrom || filters.dateTo) {
      const dateToAdjusted = filters.dateTo ? new Date(filters.dateTo) : undefined;
      if (dateToAdjusted && !isNaN(dateToAdjusted.getTime())) {
        dateToAdjusted.setHours(23, 59, 59, 999);
      }
      baseMatch.issueDate = {
        ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}),
        ...(dateToAdjusted ? { $lte: dateToAdjusted } : {}),
      };
    }

    const matchingInvoices = await InvoiceModel.find(baseMatch)
      .sort({ issueDate: -1, createdAt: -1 })
      .populate("clientId", "name phone")
      .populate("projectId", "name")
      .lean();

    const invoiceIds = matchingInvoices.map((inv) => inv._id);

    const paymentAggregates =
      invoiceIds.length > 0
        ? await InvoicePaymentModel.aggregate<{
            _id: mongoose.Types.ObjectId;
            paidTotal: number;
          }>([
            {
              $match: {
                workspaceId: new mongoose.Types.ObjectId(filters.workspaceId),
                invoiceId: { $in: invoiceIds },
                isArchived: false,
              },
            },
            {
              $group: {
                _id: "$invoiceId",
                paidTotal: { $sum: "$amount" },
              },
            },
          ])
        : [];

    const paidMap = new Map<string, number>(
      paymentAggregates.map((agg) => [String(agg._id), agg.paidTotal]),
    );

    const now = new Date();
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOverdue = 0;

    const allMappedItems: InvoiceListItem[] = matchingInvoices.map((invoice) => {
      const mapped = mapInvoiceListItem(invoice, paidMap.get(String(invoice._id)) ?? 0);
      const isCancelled = mapped.status === "cancelled";
      if (!isCancelled) {
        totalInvoiced += mapped.total;
        totalPaid += mapped.paidAmount;
        const isOverdue =
          invoice.dueDate && new Date(invoice.dueDate) < now && mapped.remainingAmount > 0;
        if (isOverdue) {
          totalOverdue += mapped.remainingAmount;
        }
      }
      return mapped;
    });

    const totalRemaining = Math.max(0, totalInvoiced - totalPaid);

    const summary: InvoiceSummary = {
      totalInvoiced,
      totalPaid,
      totalRemaining,
      totalOverdue,
      count: matchingInvoices.length,
    };

    let filteredItems = allMappedItems;
    if (filters.status && filters.status !== "all") {
      switch (filters.status) {
        case "unpaid":
          filteredItems = allMappedItems.filter(
            (it) => it.financialStatus === "unpaid" && it.status !== "cancelled",
          );
          break;
        case "partially_paid":
          filteredItems = allMappedItems.filter(
            (it) => it.financialStatus === "partially_paid" && it.status !== "cancelled",
          );
          break;
        case "paid":
          filteredItems = allMappedItems.filter(
            (it) =>
              (it.financialStatus === "paid" || it.financialStatus === "legacy_paid") &&
              it.status !== "cancelled",
          );
          break;
        case "overdue":
          filteredItems = allMappedItems.filter(
            (it) => it.displayStatus === "overdue" && it.status !== "cancelled",
          );
          break;
        case "cancelled":
          filteredItems = allMappedItems.filter((it) => it.status === "cancelled");
          break;
      }
    }

    const page = filters.page;
    const pageSize = filters.pageSize;
    const total = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const skip = (page - 1) * pageSize;
    const paginatedItems = filteredItems.slice(skip, skip + pageSize);

    return {
      items: toPlain(paginatedItems),
      total,
      page,
      pageSize,
      totalPages,
      summary,
    };
  }

  async getOrCreateShareToken(invoiceId: string, workspaceId: string): Promise<string | null> {
    if (
      !mongoose.Types.ObjectId.isValid(invoiceId) ||
      !mongoose.Types.ObjectId.isValid(workspaceId)
    ) {
      return null;
    }

    const invoice = await this.findActiveInvoiceDoc(invoiceId, workspaceId);
    if (!invoice) return null;

    if (invoice.shareToken) {
      return invoice.shareToken;
    }

    const token = generateSecureShareToken();
    invoice.shareToken = token;
    invoice.isShareable = true;
    await invoice.save();
    return token;
  }

  async regenerateShareToken(invoiceId: string, workspaceId: string): Promise<string | null> {
    if (
      !mongoose.Types.ObjectId.isValid(invoiceId) ||
      !mongoose.Types.ObjectId.isValid(workspaceId)
    ) {
      return null;
    }

    const invoice = await this.findActiveInvoiceDoc(invoiceId, workspaceId);
    if (!invoice) return null;

    const newToken = generateSecureShareToken();
    invoice.shareToken = newToken;
    invoice.isShareable = true;
    invoice.viewedAt = null;
    await invoice.save();
    return newToken;
  }

  async setShareable(
    invoiceId: string,
    workspaceId: string,
    isShareable: boolean,
  ): Promise<boolean> {
    if (
      !mongoose.Types.ObjectId.isValid(invoiceId) ||
      !mongoose.Types.ObjectId.isValid(workspaceId)
    ) {
      return false;
    }

    await connectToDatabase();
    const result = await InvoiceModel.updateOne(
      { _id: invoiceId, workspaceId, isArchived: false },
      { $set: { isShareable } },
    );
    return result.modifiedCount > 0;
  }

  async listPayments(
    invoiceId: string,
    workspaceId: string,
  ): Promise<InvoicePaymentListItem[]> {
    await connectToDatabase();

    const payments = await InvoicePaymentModel.find({
      invoiceId,
      workspaceId,
      isArchived: false,
    })
      .sort({ paymentDate: -1, createdAt: -1 })
      .populate("accountId", "name")
      .lean();

    return toPlain(
      payments.map((p) => {
        const account = p.accountId as { _id?: unknown; name?: string } | null;
        return {
          _id: String(p._id),
          invoiceId: String(p.invoiceId),
          transactionId: String(p.transactionId),
          accountId: account?._id ? String(account._id) : String(p.accountId),
          accountName: account?.name ?? "",
          amount: p.amount,
          paymentDate: new Date(p.paymentDate).toISOString(),
          paymentMethod: p.paymentMethod,
          reference: p.reference ?? "",
          notes: p.notes ?? "",
          createdAt: new Date(p.createdAt).toISOString(),
        };
      }),
    );
  }

  async getFinancialSummary(
    invoiceId: string,
    workspaceId: string,
  ): Promise<InvoiceFinancialSummary | null> {
    await connectToDatabase();

    const invoice = await InvoiceModel.findOne({
      _id: invoiceId,
      workspaceId,
      isArchived: false,
    }).lean();

    if (!invoice) return null;

    const invoiceTotal = resolveInvoiceTotals(invoice).total;

    const payments = await InvoicePaymentModel.find({
      invoiceId,
      workspaceId,
      isArchived: false,
    }).lean();

    const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingTotal = Math.max(0, invoiceTotal - paidTotal);

    let financialStatus: InvoiceFinancialSummary["financialStatus"];
    if (paidTotal >= invoiceTotal && invoiceTotal > 0) {
      financialStatus = "paid";
    } else if (paidTotal > 0) {
      financialStatus = "partially_paid";
    } else if (invoice.status === "paid") {
      financialStatus = "legacy_paid";
    } else {
      financialStatus = "unpaid";
    }

    return {
      invoiceTotal,
      paidTotal,
      remainingTotal,
      financialStatus,
    };
  }

  /**
   * Validates external domain preconditions before acquiring a database transaction.
   */
  async validatePaymentPreconditions(input: RecordPaymentInput) {
    await connectToDatabase();

    const [workspace, invoice, account] = await Promise.all([
      WorkspaceModel.findById(input.workspaceId).lean(),
      InvoiceModel.findOne({
        _id: input.invoiceId,
        workspaceId: input.workspaceId,
        isArchived: false,
      }).lean(),
      AccountModel.findOne({
        _id: input.accountId,
        workspaceId: input.workspaceId,
        isArchived: false,
      }).lean(),
    ]);

    if (!workspace) {
      throw new InvalidPaymentReferenceError("workspaceNotFound");
    }
    if (!invoice) {
      throw new InvalidPaymentReferenceError("invoiceNotFound");
    }
    if (invoice.status === "cancelled") {
      throw new InvoiceCancelledError();
    }
    if (!account) {
      throw new InvalidPaymentReferenceError("accountNotFound");
    }

    const accountCurrency = resolveAccountCurrency(account.currency, workspace.currency);
    if (accountCurrency !== workspace.currency) {
      throw new AccountCurrencyMismatchError();
    }

    let resolvedCategoryId = input.categoryId;
    if (resolvedCategoryId) {
      const category = await CategoryModel.findOne({
        _id: resolvedCategoryId,
        kind: "income",
        isArchived: false,
        $or: [{ workspaceId: null }, { workspaceId: input.workspaceId }],
      }).lean();

      if (!category) {
        throw new InvalidPaymentReferenceError("categoryInvalid");
      }
    } else {
      const defaultCategory = await CategoryModel.findOne({
        kind: "income",
        isArchived: false,
        $or: [{ workspaceId: input.workspaceId }, { workspaceId: null }],
      })
        .sort({ workspaceId: -1, isSystem: 1 })
        .lean();

      if (!defaultCategory) {
        throw new InvalidPaymentReferenceError("categoryNotFound");
      }
      resolvedCategoryId = String(defaultCategory._id);
    }

    return { workspace, invoice, account, resolvedCategoryId };
  }

  /**
   * Records an invoice payment atomically inside a MongoDB transaction.
   */
  async recordPayment(input: RecordPaymentInput, userId: string) {
    const { invoice, resolvedCategoryId } = await this.validatePaymentPreconditions(input);

    const amountMinorUnits = toMinorUnits(input.amount);
    const mongooseInstance = await connectToDatabase();

    const resultPayment = await runInTransaction(mongooseInstance, async (session) => {
      const existingPayment = await InvoicePaymentModel.findOne({
        workspaceId: input.workspaceId,
        idempotencyKey: input.idempotencyKey,
      }).session(session);

      if (existingPayment) {
        return existingPayment.toObject();
      }

      const invoiceTotal = resolveInvoiceTotals({
        items: invoice.items.map((item) => ({
          description: item.description,
          amount: item.amount,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        subtotal: invoice.subtotal,
        taxEnabled: invoice.taxEnabled,
        taxRatePercent: invoice.taxRatePercent,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
      }).total;

      const existingPayments = await InvoicePaymentModel.find({
        workspaceId: input.workspaceId,
        invoiceId: input.invoiceId,
        isArchived: false,
      }).session(session);

      const paidTotal = existingPayments.reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = Math.max(0, invoiceTotal - paidTotal);

      if (amountMinorUnits > remainingBalance) {
        throw new InvoiceOverpaymentError(remainingBalance);
      }

      const [transaction] = await TransactionModel.create(
        [
          {
            workspaceId: input.workspaceId,
            accountId: input.accountId,
            categoryId: resolvedCategoryId,
            type: "income",
            amount: amountMinorUnits,
            transactionDate: input.paymentDate,
            description: `تحصيل فاتورة ${invoice.invoiceNumber}`,
            notes: input.notes || "",
            clientId: invoice.clientId,
            projectId: invoice.projectId ?? null,
            createdBy: userId,
          },
        ],
        { session },
      );

      const [payment] = await InvoicePaymentModel.create(
        [
          {
            workspaceId: input.workspaceId,
            invoiceId: input.invoiceId,
            transactionId: transaction._id,
            accountId: input.accountId,
            amount: amountMinorUnits,
            paymentDate: input.paymentDate,
            paymentMethod: input.paymentMethod as PaymentMethod,
            reference: input.reference || "",
            notes: input.notes || "",
            idempotencyKey: input.idempotencyKey,
            createdBy: userId,
          },
        ],
        { session },
      );

      await AccountModel.findByIdAndUpdate(
        input.accountId,
        { $inc: { cachedBalance: amountMinorUnits } },
        { session },
      );

      const newPaidTotal = paidTotal + amountMinorUnits;
      if (newPaidTotal >= invoiceTotal) {
        await InvoiceModel.findByIdAndUpdate(
          invoice._id,
          { paidAt: input.paymentDate, status: "paid" },
          { session },
        );
      }

      return payment.toObject();
    });

      return toPlain(resultPayment as unknown) as InvoicePaymentListItem;
  }

  /**
   * Retrieves public invoice details for client viewing without authentication.
   * Safely marks the invoice as viewed if not previously viewed.
   */
  async getPublicInvoiceByToken(token: string): Promise<PublicInvoiceView | null> {
    if (!token || typeof token !== "string" || token.length < 16) {
      return null;
    }

    await connectToDatabase();

    const invoice = await InvoiceModel.findOne({
      shareToken: token,
      isShareable: true,
      isArchived: false,
      status: { $ne: "cancelled" },
    })
      .populate("clientId", "name email phone")
      .populate("projectId", "name")
      .populate(
        "workspaceId",
        "name businessName logoUrl taxId businessPhone businessAddress currency",
      )
      .lean();

    if (!invoice) return null;

    if (!invoice.viewedAt) {
      InvoiceModel.updateOne(
        { _id: invoice._id, viewedAt: null },
        { $set: { viewedAt: new Date() } },
      )
        .exec()
        .catch((err) => {
          console.error("[public-invoice] failed to update viewedAt:", err);
        });
    }

    const payments = await InvoicePaymentModel.find({
      invoiceId: invoice._id,
      isArchived: false,
    }).lean();

    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const money = resolveInvoiceTotals(invoice);
    const total = money.total;
    const remainingAmount = Math.max(0, total - paidAmount);

    let financialStatus: InvoiceFinancialStatus;
    if (paidAmount >= total && total > 0) {
      financialStatus = "paid";
    } else if (paidAmount > 0) {
      financialStatus = "partially_paid";
    } else if (invoice.status === "paid") {
      financialStatus = "legacy_paid";
    } else {
      financialStatus = "unpaid";
    }

    const client = invoice.clientId as {
      name?: string;
      email?: string | null;
      phone?: string | null;
    } | null;

    const project = invoice.projectId as {
      name?: string;
    } | null;

    const workspace = invoice.workspaceId as {
      name?: string;
      businessName?: string | null;
      logoUrl?: string | null;
      taxId?: string | null;
      businessPhone?: string | null;
      businessAddress?: string | null;
      currency?: string;
    } | null;

    const displayName = (workspace?.businessName || "").trim() || workspace?.name || "";

    return toPlain({
      id: String(invoice._id),
      shareToken: token,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: new Date(invoice.issueDate).toISOString(),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
      items: invoice.items.map((item) => normalizeInvoiceLine(item)),
      subtotal: money.subtotal,
      taxEnabled: money.taxEnabled,
      taxRatePercent: money.taxRatePercent,
      taxAmount: money.taxAmount,
      total,
      paidAmount,
      remainingAmount,
      notes: invoice.notes || "",
      status: (invoice.status ?? "sent") as InvoiceStatus,
      financialStatus,
      client: {
        name: client?.name || "—",
        email: client?.email ?? null,
        phone: client?.phone ?? null,
      },
      projectName: project?.name ?? null,
      workspaceName: workspace?.name || "",
      businessName: displayName,
      logoUrl: workspace?.logoUrl || null,
      taxId: workspace?.taxId || null,
      businessPhone: workspace?.businessPhone || null,
      businessAddress: workspace?.businessAddress || null,
      currency: workspace?.currency || "EGP",
      viewedAt: invoice.viewedAt
        ? new Date(invoice.viewedAt).toISOString()
        : new Date().toISOString(),
    });
  }
}

export const invoicesRepository = new InvoicesRepository();
