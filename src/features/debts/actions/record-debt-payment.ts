"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertPlanFeature } from "@/features/subscriptions/data";
import { recordDebtPaymentSchema } from "@/features/debts/schemas";
import {
  recordDebtPayment,
  DebtNotFoundError,
  DebtAccountNotFoundError,
  DebtOverpaymentError,
} from "@/features/debts/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type RecordDebtPaymentState = {
  success?: boolean;
  error: string | null;
};

export async function recordDebtPaymentAction(
  _prevState: RecordDebtPaymentState,
  formData: FormData,
): Promise<RecordDebtPaymentState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const featureError = await assertPlanFeature(session.user.id, "debts");
  if (featureError) {
    return { success: false, error: featureError };
  }

  const parsed = recordDebtPaymentSchema(tValidation as any).safeParse({
    workspaceId: formData.get("workspaceId"),
    debtId: formData.get("debtId"),
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    paymentDate: formData.get("paymentDate"),
    reference: formData.get("reference") || "",
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? tErrors("invalidData"),
    };
  }

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  try {
    await recordDebtPayment(
      {
        workspaceId: parsed.data.workspaceId,
        debtId: parsed.data.debtId,
        accountId: parsed.data.accountId,
        amount: parsed.data.amount,
        paymentDate: parsed.data.paymentDate,
        reference: parsed.data.reference,
        notes: parsed.data.notes,
      },
      session.user.id,
    );

    revalidateTag(CACHE_TAGS.accounts, "max");
    revalidatePath("/dashboard/debts");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");

    return { success: true, error: null };
  } catch (err: unknown) {
    if (err instanceof DebtNotFoundError) {
      return { success: false, error: tErrors("debtNotFound") };
    }
    if (err instanceof DebtAccountNotFoundError) {
      return { success: false, error: tErrors("accountNotFound") };
    }
    if (err instanceof DebtOverpaymentError) {
      return {
        success: false,
        error: tErrors("debtOverpayment"),
      };
    }
    console.error("recordDebtPaymentAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : tErrors("unexpected"),
    };
  }
}
