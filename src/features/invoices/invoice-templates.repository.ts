import "server-only";

import {
  InvoiceTemplateModel,
  MAX_INVOICE_TEMPLATES_PER_WORKSPACE,
} from "@/models/invoice-template";
import { connectToDatabase } from "@/lib/db/mongoose";
import type { InvoiceTemplateListItem } from "@/features/invoices/invoice-templates.types";

export class InvoiceTemplatesRepository {
  async countForWorkspace(workspaceId: string) {
    await connectToDatabase();
    return InvoiceTemplateModel.countDocuments({ workspaceId, isArchived: false });
  }

  async listForWorkspace(workspaceId: string): Promise<InvoiceTemplateListItem[]> {
    await connectToDatabase();
    const docs = await InvoiceTemplateModel.find({ workspaceId, isArchived: false })
      .sort({ name: 1 })
      .lean();
    return docs.map((doc) => ({
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
    }));
  }

  async create(input: {
    workspaceId: string;
    name: string;
    items: { description: string; quantity: number; unitPrice: number; amount: number }[];
    taxEnabled: boolean;
    taxRatePercent: number;
  }) {
    await connectToDatabase();
    const created = await InvoiceTemplateModel.create({
      workspaceId: input.workspaceId,
      name: input.name,
      items: input.items,
      taxEnabled: input.taxEnabled,
      taxRatePercent: input.taxRatePercent,
      isArchived: false,
    });
    return {
      id: String(created._id),
      name: created.name,
      items: created.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
      taxEnabled: created.taxEnabled,
      taxRatePercent: created.taxRatePercent ?? 0,
    } satisfies InvoiceTemplateListItem;
  }

  get maxPerWorkspace() {
    return MAX_INVOICE_TEMPLATES_PER_WORKSPACE;
  }
}

export const invoiceTemplatesRepository = new InvoiceTemplatesRepository();
