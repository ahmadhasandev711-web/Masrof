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
import type { CreateInvoiceInput } from "@/features/invoices/schemas";
import type {
  InvoiceFinancialStatus,
  InvoiceListItem,
  InvoicePrintView,
} from "@/features/invoices/types";
import { resolveInvoiceDisplayStatus } from "@/features/invoices/status";

export class InvalidInvoiceReferenceError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "InvalidInvoiceReferenceError";
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

  return invoice.toObject();
}

export async function updateInvoiceStatus(
  invoiceId: string,
  workspaceId: string,
  status: InvoiceStatus,
) {
  await connectToDatabase();

  const updates: { status: InvoiceStatus; paidAt: Date | null } = {
    status,
    paidAt: status === "paid" ? new Date() : null,
  };

  return InvoiceModel.findOneAndUpdate(
    { _id: invoiceId, workspaceId, isArchived: false },
    updates,
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
        total: totalAmount,
        paidAmount,
        remainingAmount,
        clientName: client?.name ?? "—",
        clientId: client?._id ? String(client._id) : String(invoice.clientId),
        projectId: project?._id ? String(project._id) : (invoice.projectId ? String(invoice.projectId) : null),
        projectName: project?.name ?? null,
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
