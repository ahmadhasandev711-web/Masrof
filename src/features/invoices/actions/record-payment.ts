"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { recordPaymentSchema } from "@/features/invoices/payment-schemas";
import { invoicesService } from "@/features/invoices/invoices.service";
import {
  AccountCurrencyMismatchError,
  InvalidPaymentReferenceError,
  InvoiceCancelledError,
  InvoiceOverpaymentError,
} from "@/features/invoices/invoices.errors";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type RecordPaymentState = {
  success?: boolean;
  error: string | null;
};

export async function recordInvoicePaymentAction(
  _prevState: RecordPaymentState,
  formData: FormData,
): Promise<RecordPaymentState> {
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

  const result = await runWorkspaceWrite(parsed.data.workspaceId, ({ userId }) =>
    invoicesService.recordPayment(userId, parsed.data),
  );

  if (!result.ok) {
    if (
      result.error instanceof InvoiceOverpaymentError ||
      result.error instanceof InvoiceCancelledError ||
      result.error instanceof AccountCurrencyMismatchError ||
      result.error instanceof InvalidPaymentReferenceError
    ) {
      return {
        success: false,
        error: tErrors(result.error.code as Parameters<typeof tErrors>[0]),
      };
    }
    return { success: false, error: result.error.message };
  }

  revalidateTag(CACHE_TAGS.invoices, "max");
  revalidateTag(CACHE_TAGS.accounts, "max");
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");

  return {
    success: true,
    error: null,
  };
}
