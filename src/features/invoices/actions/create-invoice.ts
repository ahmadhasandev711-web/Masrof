"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createInvoiceSchema } from "@/features/invoices/schemas";
import { invoicesService } from "@/features/invoices/invoices.service";
import { InvalidInvoiceReferenceError } from "@/features/invoices/invoices.errors";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateInvoiceState = {
  error: string | null;
  redirectTo?: string | null;
};

function parseItemsFromForm(formData: FormData) {
  const items: {
    description: string;
    quantity: string;
    unitPrice: string;
  }[] = [];
  let index = 0;

  while (formData.has(`itemDescription_${index}`)) {
    const unitPrice =
      String(formData.get(`itemUnitPrice_${index}`) ?? "").trim() ||
      String(formData.get(`itemAmount_${index}`) ?? "");
    items.push({
      description: String(formData.get(`itemDescription_${index}`) ?? ""),
      quantity: String(formData.get(`itemQuantity_${index}`) ?? "1"),
      unitPrice,
    });
    index += 1;
  }

  return items;
}

export async function createInvoiceAction(
  _prevState: CreateInvoiceState,
  formData: FormData,
): Promise<CreateInvoiceState> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const projectIdRaw = String(formData.get("projectId") ?? "").trim();

  const parsed = createInvoiceSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    clientId: formData.get("clientId"),
    projectId: projectIdRaw || null,
    issueDate: formData.get("issueDate"),
    dueDate: dueDateRaw || null,
    notes: formData.get("notes") || "",
    items: parseItemsFromForm(formData),
    taxEnabled: formData.get("taxEnabled"),
    taxRatePercent: formData.get("taxRatePercent") || 0,
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, ({ userId }) =>
    invoicesService.create(userId, parsed.data),
  );

  if (!result.ok) {
    if (result.error instanceof InvalidInvoiceReferenceError) {
      return { error: tErrors(result.error.code as Parameters<typeof tErrors>[0]) };
    }
    return { error: result.error.message };
  }

  revalidateTag(CACHE_TAGS.invoices, "max");
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/clients");
  return {
    error: null,
    redirectTo: `/print/invoice/${String(result.value._id)}?format=a4`,
  };
}
