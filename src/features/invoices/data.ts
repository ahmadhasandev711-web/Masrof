import "server-only";

import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { toPlain } from "@/lib/db/plain";
import { toMinorUnits } from "@/lib/money";
import { CACHE_TAGS } from "@/lib/cache-tags";
import mongoose from "mongoose";
import crypto from "crypto";
import { InvoiceModel, type InvoiceStatus } from "@/models/invoice";
import { InvoicePaymentModel } from "@/models/invoice-payment";
import { ClientModel } from "@/models/client";
import { ProjectModel } from "@/models/project";
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilters,
} from "@/features/invoices/schemas";
import type {
  InvoiceFinancialStatus,
  InvoiceListItem,
  InvoicePrintView,
  InvoiceSummary,
} from "@/features/invoices/types";
import { resolveInvoiceDisplayStatus } from "@/features/invoices/status";
import {
  findWorkspaceIdempotentId,
  registerWorkspaceIdempotentResource,
} from "@/lib/idempotency/workspace-resource";

export class InvalidInvoiceReferenceError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "InvalidInvoiceReferenceError";
  }
}

/** Invoice `paid` must come from {@link recordInvoicePayment}, not a status toggle. */
export class InvoicePaidStatusNotAllowedError extends Error {
  readonly code = "useRecordPayment";
  constructor() {
    super("Invoice paid status must be recorded via a payment allocation");
    this.name = "InvoicePaidStatusNotAllowedError";
  }
}

async function nextInvoiceNumber(workspaceId: string, issueDate: Date): Promise<string> {
  const year = issueDate.getFullYear();
  const prefix = `INV-${year}-`;
  const count = await InvoiceModel.countDocuments({
    workspaceId,
    invoiceNumber: { $regex: `^${prefix}` },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export async function createInvoice(input: CreateInvoiceInput) {
  await connectToDatabase();

  const existingId = await findWorkspaceIdempotentId(input.workspaceId, input.idempotencyKey);
  if (existingId) {
    const existing = await InvoiceModel.findOne({
      _id: existingId,
      workspaceId: input.workspaceId,
    }).lean();
    if (existing) return existing;
  }

  const client = await ClientModel.findOne({
    _id: input.clientId,
    workspaceId: input.workspaceId,
    isArchived: false,
  }).lean();

  if (!client) {
    throw new InvalidInvoiceReferenceError("clientNotFoundShort");
  }

  let validatedProjectId: string | null = null;
  if (input.projectId) {
    const project = await ProjectModel.findOne({
      _id: input.projectId,
      workspaceId: input.workspaceId,
      clientId: input.clientId,
      isArchived: false,
    }).lean();

    if (!project) {
      throw new InvalidInvoiceReferenceError("projectNotFoundShort");
    }
    validatedProjectId = String(project._id);
  }

  const invoiceNumber = await nextInvoiceNumber(input.workspaceId, input.issueDate);
  const items = input.items.map((item) => ({
    description: item.description,
    amount: toMinorUnits(item.amount),
  }));

  const invoice = await InvoiceModel.create({
    workspaceId: input.workspaceId,
    clientId: input.clientId,
    projectId: validatedProjectId,
    invoiceNumber,
    issueDate: input.issueDate,
    dueDate: input.dueDate ?? null,
    items,
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

export async function updateInvoiceStatus(
  invoiceId: string,
  workspaceId: string,
  status: InvoiceStatus,
) {
  if (status === "paid") {
    throw new InvoicePaidStatusNotAllowedError();
  }

  await connectToDatabase();

  return InvoiceModel.findOneAndUpdate(
    { _id: invoiceId, workspaceId, isArchived: false },
    { status },
    { returnDocument: "after" },
  ).lean();
}

export type InvoicesPage = {
  items: InvoiceListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

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

  const paymentAggregates = invoiceIds.length > 0
    ? await InvoicePaymentModel.aggregate<{ _id: mongoose.Types.ObjectId; paidTotal: number }>([
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
    invoices.map((invoice): InvoiceListItem => {
      const client = invoice.clientId as { _id?: unknown; name?: string; phone?: string | null } | null;
      const project = invoice.projectId as { _id?: unknown; name?: string } | null;
      const totalAmount = invoice.items.reduce((sum, item) => sum + item.amount, 0);
      const status = (invoice.status ?? "sent") as InvoiceStatus;
      const paidAmount = paidMap.get(String(invoice._id)) ?? 0;
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
        items: invoice.items.map((it) => ({ description: it.description, amount: it.amount })),
        total: totalAmount,
        paidAmount,
        remainingAmount,
        clientName: client?.name ?? "—",
        clientId: client?._id ? String(client._id) : String(invoice.clientId),
        projectId: project?._id ? String(project._id) : (invoice.projectId ? String(invoice.projectId) : null),
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
    }),
  );

  return { items, total };
}

export const listInvoicesForWorkspace = unstable_cache(
  async (workspaceId: string): Promise<InvoiceListItem[]> => {
    const { items } = await queryInvoicesPage(workspaceId, 0, 1000);
    return items;
  },
  ["invoices-for-workspace"],
  { revalidate: 30, tags: [CACHE_TAGS.invoices] },
);

export async function listInvoicesPaginated(
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

export type WorkspaceBrandingForPrint = {
  name: string;
  businessName?: string | null;
  logoUrl?: string | null;
  taxId?: string | null;
  businessPhone?: string | null;
  businessAddress?: string | null;
  currency: string;
};

export async function getInvoiceForPrint(
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

  const items = invoice.items.map((item) => ({
    description: item.description,
    amount: item.amount,
  }));

  const displayName = (branding.businessName || "").trim() || branding.name;

  return {
    id: String(invoice._id),
    invoiceNumber: invoice.invoiceNumber,
    issueDate: new Date(invoice.issueDate).toISOString(),
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
    items,
    total: items.reduce((sum, item) => sum + item.amount, 0),
    notes: invoice.notes ?? "",
    status: (invoice.status ?? "sent") as InvoiceStatus,
    client: {
      name: client?.name ?? "—",
      email: client?.email ?? null,
      phone: client?.phone ?? null,
    },
    projectId: project?._id ? String(project._id) : (invoice.projectId ? String(invoice.projectId) : null),
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

export async function listInvoicesWithFilters(filters: InvoiceFilters): Promise<{
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

  // 1. Fetch all matching invoices to compute financial statuses and summary accurately
  const matchingInvoices = await InvoiceModel.find(baseMatch)
    .sort({ issueDate: -1, createdAt: -1 })
    .populate("clientId", "name phone")
    .populate("projectId", "name")
    .lean();

  const invoiceIds = matchingInvoices.map((inv) => inv._id);

  // 2. Aggregate payments for these invoices
  const paymentAggregates =
    invoiceIds.length > 0
      ? await InvoicePaymentModel.aggregate<{ _id: mongoose.Types.ObjectId; paidTotal: number }>([
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

  // 3. Map to InvoiceListItem
  const allMappedItems: InvoiceListItem[] = matchingInvoices.map((invoice): InvoiceListItem => {
    const client = invoice.clientId as { _id?: unknown; name?: string; phone?: string | null } | null;
    const project = invoice.projectId as { _id?: unknown; name?: string } | null;
    const totalAmount = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const status = (invoice.status ?? "sent") as InvoiceStatus;
    const paidAmount = paidMap.get(String(invoice._id)) ?? 0;
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

    const isCancelled = status === "cancelled";
    if (!isCancelled) {
      totalInvoiced += totalAmount;
      totalPaid += paidAmount;
      const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < now && remainingAmount > 0;
      if (isOverdue) {
        totalOverdue += remainingAmount;
      }
    }

    return {
      _id: String(invoice._id),
      invoiceNumber: invoice.invoiceNumber,
      issueDate: new Date(invoice.issueDate).toISOString(),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
      items: invoice.items.map((it) => ({ description: it.description, amount: it.amount })),
      total: totalAmount,
      paidAmount,
      remainingAmount,
      clientName: client?.name ?? "—",
      clientId: client?._id ? String(client._id) : String(invoice.clientId),
      projectId: project?._id ? String(project._id) : (invoice.projectId ? String(invoice.projectId) : null),
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
  });

  const totalRemaining = Math.max(0, totalInvoiced - totalPaid);

  const summary: InvoiceSummary = {
    totalInvoiced,
    totalPaid,
    totalRemaining,
    totalOverdue,
    count: matchingInvoices.length,
  };

  // 4. Apply status filter if provided
  let filteredItems = allMappedItems;
  if (filters.status && filters.status !== "all") {
    switch (filters.status) {
      case "unpaid":
        filteredItems = allMappedItems.filter((it) => it.financialStatus === "unpaid" && it.status !== "cancelled");
        break;
      case "partially_paid":
        filteredItems = allMappedItems.filter((it) => it.financialStatus === "partially_paid" && it.status !== "cancelled");
        break;
      case "paid":
        filteredItems = allMappedItems.filter((it) => (it.financialStatus === "paid" || it.financialStatus === "legacy_paid") && it.status !== "cancelled");
        break;
      case "overdue":
        filteredItems = allMappedItems.filter((it) => it.displayStatus === "overdue" && it.status !== "cancelled");
        break;
      case "cancelled":
        filteredItems = allMappedItems.filter((it) => it.status === "cancelled");
        break;
    }
  }

  // 5. Paginate cleanly
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

export async function cancelInvoice(invoiceId: string, workspaceId: string) {
  await connectToDatabase();

  const invoice = await InvoiceModel.findOne({
    _id: invoiceId,
    workspaceId,
    isArchived: false,
  });

  if (!invoice) {
    throw new InvalidInvoiceReferenceError("invoiceNotFound");
  }

  const hasPayments = await InvoicePaymentModel.exists({
    invoiceId,
    workspaceId,
    isArchived: false,
  });

  if (hasPayments) {
    throw new InvalidInvoiceReferenceError("cannotCancelWithRecordedPayments");
  }

  invoice.status = "cancelled";
  invoice.paidAt = null;
  await invoice.save();
  return toPlain(invoice);
}

export async function archiveInvoice(invoiceId: string, workspaceId: string) {
  await connectToDatabase();

  const invoice = await InvoiceModel.findOne({
    _id: invoiceId,
    workspaceId,
    isArchived: false,
  });

  if (!invoice) {
    throw new InvalidInvoiceReferenceError("invoiceNotFound");
  }

  const hasPayments = await InvoicePaymentModel.exists({
    invoiceId,
    workspaceId,
    isArchived: false,
  });

  if (hasPayments) {
    throw new InvalidInvoiceReferenceError("cannotArchiveWithRecordedPayments");
  }

  invoice.isArchived = true;
  await invoice.save();
  return toPlain(invoice);
}

export async function updateInvoice(input: UpdateInvoiceInput) {
  await connectToDatabase();

  const client = await ClientModel.findOne({
    _id: input.clientId,
    workspaceId: input.workspaceId,
    isArchived: false,
  }).lean();

  if (!client) {
    throw new InvalidInvoiceReferenceError("clientNotFoundShort");
  }

  let validatedProjectId: string | null = null;
  if (input.projectId) {
    const project = await ProjectModel.findOne({
      _id: input.projectId,
      workspaceId: input.workspaceId,
      clientId: input.clientId,
      isArchived: false,
    }).lean();

    if (!project) {
      throw new InvalidInvoiceReferenceError("projectNotFoundShort");
    }
    validatedProjectId = String(project._id);
  }

  const invoice = await InvoiceModel.findOne({
    _id: input.invoiceId,
    workspaceId: input.workspaceId,
    isArchived: false,
  });

  if (!invoice) {
    throw new InvalidInvoiceReferenceError("invoiceNotFound");
  }

  const newItems = input.items.map((item) => ({
    description: item.description.trim(),
    amount: toMinorUnits(item.amount),
  }));

  const newTotal = newItems.reduce((sum, item) => sum + item.amount, 0);

  // Check recorded payments
  const paymentAgg = await InvoicePaymentModel.aggregate<{ sum: number }>([
    {
      $match: {
        invoiceId: invoice._id,
        workspaceId: new mongoose.Types.ObjectId(input.workspaceId),
        isArchived: false,
      },
    },
    { $group: { _id: null, sum: { $sum: "$amount" } } },
  ]);
  const existingPaid = paymentAgg[0]?.sum ?? 0;

  if (newTotal < existingPaid) {
    throw new InvalidInvoiceReferenceError("totalLessThanPaid");
  }

  invoice.clientId = new mongoose.Types.ObjectId(input.clientId);
  invoice.projectId = validatedProjectId ? new mongoose.Types.ObjectId(validatedProjectId) : null;
  invoice.issueDate = input.issueDate;
  invoice.dueDate = input.dueDate ?? null;
  invoice.notes = input.notes ?? "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoice.items = newItems as any;

  if (invoice.status === "cancelled") {
    invoice.status = "sent";
  }

  await invoice.save();
  return toPlain(invoice);
}

