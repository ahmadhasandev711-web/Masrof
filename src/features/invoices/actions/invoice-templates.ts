"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { invoiceTemplatesService } from "@/features/invoices/invoice-templates.service";
import { runWorkspaceWrite } from "@/server/kernel";

export async function saveInvoiceTemplateAction(input: {
  workspaceId: string;
  name: string;
  items: { description: string; quantity: number; unitPrice: number }[];
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
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/invoices");
  return { error: null };
}
