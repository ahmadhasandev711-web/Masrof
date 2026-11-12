import "server-only";

import {
  InvoiceTemplateModel,
  MAX_INVOICE_TEMPLATES_PER_WORKSPACE,
} from "@/models/invoice-template";
import { connectToDatabase } from "@/lib/db/mongoose";
import type { InvoiceTemplateListItem } from "@/features/invoices/invoice-templates.types";

function mapDoc(doc: {
  _id: unknown;
  name: string;
  items: { description: string; quantity: number; unitPrice: number; amount: number }[];
  taxEnabled?: boolean | null;
  taxRatePercent?: number | null;
  sortOrder?: number | null;
}): InvoiceTemplateListItem {
  return {
    id: String(doc._id),
    name: doc.name,
    items: doc.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    })),
    taxEnabled: Boolean(doc.taxEnabled),
    taxRatePercent: doc.taxRatePercent ?? 0,
    sortOrder: typeof doc.sortOrder === "number" ? doc.sortOrder : 0,
  };
}

export class InvoiceTemplatesRepository {
  async countForWorkspace(workspaceId: string) {
    await connectToDatabase();
    return InvoiceTemplateModel.countDocuments({ workspaceId, isArchived: false });
  }

  async nextSortOrder(workspaceId: string) {
    await connectToDatabase();
    const last = await InvoiceTemplateModel.findOne({ workspaceId, isArchived: false })
      .sort({ sortOrder: -1 })
      .select({ sortOrder: 1 })
      .lean();
    return (typeof last?.sortOrder === "number" ? last.sortOrder : -1) + 1;
  }

  async listForWorkspace(workspaceId: string): Promise<InvoiceTemplateListItem[]> {
    await connectToDatabase();
    const docs = await InvoiceTemplateModel.find({ workspaceId, isArchived: false })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    return docs.map(mapDoc);
  }

  async create(input: {
    workspaceId: string;
    name: string;
    items: { description: string; quantity: number; unitPrice: number; amount: number }[];
    taxEnabled: boolean;
    taxRatePercent: number;
    sortOrder: number;
  }) {
    await connectToDatabase();
    const created = await InvoiceTemplateModel.create({
      workspaceId: input.workspaceId,
      name: input.name,
      items: input.items,
      taxEnabled: input.taxEnabled,
      taxRatePercent: input.taxRatePercent,
      sortOrder: input.sortOrder,
      isArchived: false,
    });
    return mapDoc(created);
  }

  async update(
    templateId: string,
    workspaceId: string,
    input: {
      name: string;
      items: { description: string; quantity: number; unitPrice: number; amount: number }[];
      taxEnabled: boolean;
      taxRatePercent: number;
    },
  ) {
    await connectToDatabase();
    const updated = await InvoiceTemplateModel.findOneAndUpdate(
      { _id: templateId, workspaceId, isArchived: false },
      {
        $set: {
          name: input.name,
          items: input.items,
          taxEnabled: input.taxEnabled,
          taxRatePercent: input.taxRatePercent,
        },
      },
      { returnDocument: "after" },
    ).lean();
    return updated ? mapDoc(updated) : null;
  }

  async archive(templateId: string, workspaceId: string) {
    await connectToDatabase();
    const archived = await InvoiceTemplateModel.findOneAndUpdate(
      { _id: templateId, workspaceId, isArchived: false },
      { $set: { isArchived: true } },
      { returnDocument: "after" },
    ).lean();
    return archived ? mapDoc(archived) : null;
  }

  async reorder(workspaceId: string, orderedIds: string[]) {
    await connectToDatabase();
    const ops = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, workspaceId, isArchived: false },
        update: { $set: { sortOrder: index } },
      },
    }));
    if (ops.length === 0) return true;
    await InvoiceTemplateModel.bulkWrite(ops);
    return true;
  }

  get maxPerWorkspace() {
    return MAX_INVOICE_TEMPLATES_PER_WORKSPACE;
  }
}

export const invoiceTemplatesRepository = new InvoiceTemplatesRepository();
