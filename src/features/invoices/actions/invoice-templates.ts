"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { invoiceTemplatesService } from "@/features/invoices/invoice-templates.service";
import { runWorkspaceWrite } from "@/server/kernel";

type TemplateLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

function revalidateTemplates() {
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/invoices/templates");
}

export async function saveInvoiceTemplateAction(input: {
  workspaceId: string;
  name: string;
  items: TemplateLineInput[];
  taxEnabled?: boolean;
  taxRatePercent?: number;
}) {
  const tErrors = await getTranslations("errors");

  if (!input.name.trim() || input.items.length === 0) {
    return { error: tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(input.workspaceId, ({ userId }) =>
    invoiceTemplatesService.create(userId, input),
  );

  if (!result.ok) {
    try {
      return { error: tErrors(result.error.code as Parameters<typeof tErrors>[0]) };
    } catch {
      return { error: result.error.message };
    }
  }

  revalidateTemplates();
  return { error: null };
}

export async function updateInvoiceTemplateAction(input: {
  workspaceId: string;
  templateId: string;
  name: string;
  items: TemplateLineInput[];
  taxEnabled?: boolean;
  taxRatePercent?: number;
}) {
  const tErrors = await getTranslations("errors");

  const result = await runWorkspaceWrite(input.workspaceId, ({ userId }) =>
    invoiceTemplatesService.update(userId, input),
  );

  if (!result.ok) {
    try {
      return { error: tErrors(result.error.code as Parameters<typeof tErrors>[0]) };
    } catch {
      return { error: result.error.message };
    }
  }

  revalidateTemplates();
  return { error: null };
}

export async function archiveInvoiceTemplateAction(input: {
  workspaceId: string;
  templateId: string;
}) {
  const tErrors = await getTranslations("errors");

  const result = await runWorkspaceWrite(input.workspaceId, ({ userId }) =>
    invoiceTemplatesService.archive(userId, input.workspaceId, input.templateId),
  );

  if (!result.ok) {
    try {
      return { error: tErrors(result.error.code as Parameters<typeof tErrors>[0]) };
    } catch {
      return { error: result.error.message };
    }
  }

  revalidateTemplates();
  return { error: null };
}

export async function reorderInvoiceTemplatesAction(input: {
  workspaceId: string;
  orderedIds: string[];
}) {
  const tErrors = await getTranslations("errors");

  const result = await runWorkspaceWrite(input.workspaceId, ({ userId }) =>
    invoiceTemplatesService.reorder(userId, input.workspaceId, input.orderedIds),
  );

  if (!result.ok) {
    try {
      return { error: tErrors(result.error.code as Parameters<typeof tErrors>[0]) };
    } catch {
      return { error: result.error.message };
    }
  }

  revalidateTemplates();
  return { error: null };
}
