"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { recordDebtPaymentSchema } from "@/features/debts/schemas";
import { debtsService } from "@/features/debts/debts.service";
import {
  DebtAccountNotFoundError,
  DebtNotFoundError,
  DebtOverpaymentError,
} from "@/features/debts/debts.errors";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type RecordDebtPaymentState = {
  success?: boolean;
  error: string | null;
};

export async function recordDebtPaymentAction(
  _prevState: RecordDebtPaymentState,
  formData: FormData,
): Promise<RecordDebtPaymentState> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = recordDebtPaymentSchema(tValidation as any).safeParse({
    workspaceId: formData.get("workspaceId"),
    debtId: formData.get("debtId"),
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    paymentDate: formData.get("paymentDate"),
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
    debtsService.recordPayment(userId, parsed.data),
  );

  if (!result.ok) {
    if (
      result.error instanceof DebtNotFoundError ||
      result.error instanceof DebtAccountNotFoundError ||
      result.error instanceof DebtOverpaymentError
    ) {
      return {
        success: false,
        error: tErrors(result.error.code as Parameters<typeof tErrors>[0]),
      };
    }
    return { success: false, error: result.error.message };
  }

  revalidateTag(CACHE_TAGS.accounts, "max");
  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");

  return { success: true, error: null };
}
