"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { recordPaymentSchema } from "@/features/invoices/payment-schemas";
import {
  recordInvoicePayment,
  InvoiceOverpaymentError,
  InvoiceCancelledError,
  AccountCurrencyMismatchError,
  InvalidPaymentReferenceError,
} from "@/features/invoices/payment-data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type RecordPaymentState = {
  success?: boolean;
  error: string | null;
};

export async function recordInvoicePaymentAction(
  _prevState: RecordPaymentState,
  formData: FormData,
): Promise<RecordPaymentState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = recordPaymentSchema(tValidation as any).safeParse({
    workspaceId: formData.get("workspaceId"),
    invoiceId: formData.get("invoiceId"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId") || null,
    amount: formData.get("amount"),
    paymentDate: formData.get("paymentDate"),
    paymentMethod: formData.get("paymentMethod") || "bank_transfer",
    reference: formData.get("reference") || "",
    notes: formData.get("notes") || "",
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? tErrors("invalidData"),
    };
  }

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  try {
    await recordInvoicePayment(parsed.data, session.user.id);

    revalidateTag(CACHE_TAGS.invoices, "max");
    revalidateTag(CACHE_TAGS.accounts, "max");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    if (
      error instanceof InvoiceOverpaymentError ||
      error instanceof InvoiceCancelledError ||
      error instanceof AccountCurrencyMismatchError ||
      error instanceof InvalidPaymentReferenceError
    ) {
      const code = error.code as Parameters<typeof tErrors>[0];
      return {
        success: false,
        error: tErrors(code),
      };
    }
    throw error;
  }
}
