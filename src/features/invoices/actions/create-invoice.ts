"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature, assertWorkspaceQuantityLimit } from "@/features/subscriptions/data";
import { createInvoiceSchema } from "@/features/invoices/schemas";
import { createInvoice, InvalidInvoiceReferenceError } from "@/features/invoices/data";
import { countInvoicesCreatedThisMonth } from "@/features/subscriptions/plan-usage";

export type CreateInvoiceState = {
  error: string | null;
  redirectTo?: string | null;
};

function parseItemsFromForm(formData: FormData) {
  const items: { description: string; amount: string }[] = [];
  let index = 0;

  while (formData.has(`itemDescription_${index}`)) {
    items.push({
      description: String(formData.get(`itemDescription_${index}`) ?? ""),
      amount: String(formData.get(`itemAmount_${index}`) ?? ""),
    });
    index += 1;
  }

  return items;
}

export async function createInvoiceAction(
  _prevState: CreateInvoiceState,
  formData: FormData,
): Promise<CreateInvoiceState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();

  const parsed = createInvoiceSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    clientId: formData.get("clientId"),
    issueDate: formData.get("issueDate"),
    dueDate: dueDateRaw || null,
    notes: formData.get("notes") || "",
    items: parseItemsFromForm(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  const featureError = await assertWorkspacePlanFeature(session.user.id, parsed.data.workspaceId, "clientsAndProjects");
  if (featureError) {
    return { error: featureError };
  }

  const invoiceCount = await countInvoicesCreatedThisMonth(parsed.data.workspaceId);
  const limitError = await assertWorkspaceQuantityLimit(
    session.user.id,
    parsed.data.workspaceId,
    "maxInvoicesPerMonth",
    invoiceCount,
  );
  if (limitError) {
    return { error: limitError };
  }

  try {
    const invoice = await createInvoice(parsed.data);
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/clients");
    return {
      error: null,
      redirectTo: `/print/invoice/${String(invoice._id)}?format=a4`,
    };
  } catch (error) {
    if (error instanceof InvalidInvoiceReferenceError) {
      return { error: tErrors(error.code as Parameters<typeof tErrors>[0]) };
    }
    throw error;
  }
}
