import "server-only";

import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { toPlain } from "@/lib/db/plain";
import { toMinorUnits } from "@/lib/money";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { InvoiceModel, type InvoiceStatus } from "@/models/invoice";
import { ClientModel } from "@/models/client";
import type { CreateInvoiceInput } from "@/features/invoices/schemas";
import type { InvoiceListItem, InvoicePrintView } from "@/features/invoices/types";
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

  const invoiceNumber = await nextInvoiceNumber(input.workspaceId, input.issueDate);
  const items = input.items.map((item) => ({
    description: item.description,
    amount: toMinorUnits(item.amount),
  }));

  const invoice = await InvoiceModel.create({
    workspaceId: input.workspaceId,
    clientId: input.clientId,
    invoiceNumber,
    issueDate: input.issueDate,
    dueDate: input.dueDate ?? null,
    items,
    notes: input.notes ?? "",
    status: "sent",
    paidAt: null,
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
      .populate("clientId", "name")
      .lean(),
    InvoiceModel.countDocuments({ workspaceId, isArchived: false }),
  ]);

  const items = toPlain(
    invoices.map((invoice): InvoiceListItem => {
      const client = invoice.clientId as { _id?: unknown; name?: string } | null;
      const totalAmount = invoice.items.reduce((sum, item) => sum + item.amount, 0);
      const status = (invoice.status ?? "sent") as InvoiceStatus;

      return {
        _id: String(invoice._id),
        invoiceNumber: invoice.invoiceNumber,
        issueDate: new Date(invoice.issueDate).toISOString(),
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
        total: totalAmount,
        clientName: client?.name ?? "—",
        clientId: client?._id ? String(client._id) : String(invoice.clientId),
        status,
        displayStatus: resolveInvoiceDisplayStatus({
          status,
          dueDate: invoice.dueDate,
        }),
        paidAt: invoice.paidAt ? new Date(invoice.paidAt).toISOString() : null,
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
    .lean();

  if (!invoice) return null;

  const client = invoice.clientId as {
    name?: string;
    email?: string | null;
    phone?: string | null;
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
    workspaceName: branding.name,
    businessName: displayName,
    logoUrl: branding.logoUrl || null,
    taxId: branding.taxId || null,
    businessPhone: branding.businessPhone || null,
    businessAddress: branding.businessAddress || null,
    currency: branding.currency,
  };
}
