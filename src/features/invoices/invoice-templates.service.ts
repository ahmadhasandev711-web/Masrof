import "server-only";

import {
  InvoiceTemplatesRepository,
  invoiceTemplatesRepository,
} from "@/features/invoices/invoice-templates.repository";
import { lineFromMajorInput } from "@/features/invoices/invoice-line-math";
import { PlanLimitError, NotFoundError } from "@/server/kernel/errors";
import { err, ok } from "@/server/kernel/result";
import { requirePlanFeature } from "@/server/kernel/plan-policy";

type TemplateLineMajor = {
  description: string;
  quantity: number;
  unitPrice: number;
};

function normalizeLines(items: TemplateLineMajor[]) {
  return items.map((item) =>
    lineFromMajorInput({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }),
  );
}

function linesValid(
  items: { description: string; amount: number }[],
): boolean {
  return items.length > 0 && items.every((item) => item.description && item.amount >= 1);
}

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
      items: TemplateLineMajor[];
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

    const items = normalizeLines(input.items);
    if (!linesValid(items)) {
      return err(new NotFoundError("invalidInvoiceTemplateItems"));
    }

    const sortOrder = await this.repo.nextSortOrder(input.workspaceId);
    const created = await this.repo.create({
      workspaceId: input.workspaceId,
      name: input.name.trim().slice(0, 80),
      items,
      taxEnabled: Boolean(input.taxEnabled),
      taxRatePercent: input.taxEnabled ? Math.max(0, input.taxRatePercent ?? 0) : 0,
      sortOrder,
    });
    return ok(created);
  }

  async update(
    userId: string,
    input: {
      workspaceId: string;
      templateId: string;
      name: string;
      items: TemplateLineMajor[];
      taxEnabled?: boolean;
      taxRatePercent?: number;
    },
  ) {
    const feature = await requirePlanFeature(userId, input.workspaceId, "clientsAndProjects");
    if (!feature.ok) return feature;

    const items = normalizeLines(input.items);
    if (!linesValid(items)) {
      return err(new NotFoundError("invalidInvoiceTemplateItems"));
    }

    const updated = await this.repo.update(input.templateId, input.workspaceId, {
      name: input.name.trim().slice(0, 80),
      items,
      taxEnabled: Boolean(input.taxEnabled),
      taxRatePercent: input.taxEnabled ? Math.max(0, input.taxRatePercent ?? 0) : 0,
    });
    if (!updated) return err(new NotFoundError("invoiceTemplateNotFound"));
    return ok(updated);
  }

  async archive(userId: string, workspaceId: string, templateId: string) {
    const feature = await requirePlanFeature(userId, workspaceId, "clientsAndProjects");
    if (!feature.ok) return feature;

    const archived = await this.repo.archive(templateId, workspaceId);
    if (!archived) return err(new NotFoundError("invoiceTemplateNotFound"));
    return ok(archived);
  }

  async reorder(userId: string, workspaceId: string, orderedIds: string[]) {
    const feature = await requirePlanFeature(userId, workspaceId, "clientsAndProjects");
    if (!feature.ok) return feature;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return err(new NotFoundError("invalidInvoiceTemplateReorder"));
    }

    await this.repo.reorder(workspaceId, orderedIds);
    return ok(await this.repo.listForWorkspace(workspaceId));
  }
}

export const invoiceTemplatesService = new InvoiceTemplatesService();
