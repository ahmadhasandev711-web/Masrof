import "server-only";

import {
  InvoiceTemplatesRepository,
  invoiceTemplatesRepository,
} from "@/features/invoices/invoice-templates.repository";
import { lineFromMajorInput } from "@/features/invoices/invoice-line-math";
import { PlanLimitError, NotFoundError } from "@/server/kernel/errors";
import { err, ok } from "@/server/kernel/result";
import { requirePlanFeature } from "@/server/kernel/plan-policy";

export class InvoiceTemplatesService {
  constructor(
    private readonly repo: InvoiceTemplatesRepository = invoiceTemplatesRepository,
  ) {}

  listForWorkspace(workspaceId: string) {
    return this.repo.listForWorkspace(workspaceId);
  }

  async create(
    userId: string,
    input: {
      workspaceId: string;
      name: string;
      items: { description: string; quantity: number; unitPrice: number }[];
      taxEnabled?: boolean;
      taxRatePercent?: number;
    },
  ) {
    const feature = await requirePlanFeature(userId, input.workspaceId, "clientsAndProjects");
    if (!feature.ok) return feature;

    const count = await this.repo.countForWorkspace(input.workspaceId);
    if (count >= this.repo.maxPerWorkspace) {
      return err(new PlanLimitError("invoiceTemplateLimitReached"));
    }

    const items = input.items.map((item) =>
      lineFromMajorInput({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }),
    );

    if (items.length === 0 || items.some((item) => !item.description || item.amount < 1)) {
      return err(new NotFoundError("invalidInvoiceTemplateItems"));
    }

    const created = await this.repo.create({
      workspaceId: input.workspaceId,
      name: input.name.trim().slice(0, 80),
      items,
      taxEnabled: Boolean(input.taxEnabled),
      taxRatePercent: input.taxEnabled ? Math.max(0, input.taxRatePercent ?? 0) : 0,
    });
    return ok(created);
  }
}

export const invoiceTemplatesService = new InvoiceTemplatesService();
