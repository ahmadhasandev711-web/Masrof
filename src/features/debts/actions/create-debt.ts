"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertPlanFeature } from "@/features/subscriptions/data";
import { createDebtSchema } from "@/features/debts/schemas";
import { createDebt } from "@/features/debts/data";

export type CreateDebtState = {
  success?: boolean;
  error: string | null;
};

export async function createDebtAction(
  _prevState: CreateDebtState,
  formData: FormData,
): Promise<CreateDebtState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const featureError = await assertPlanFeature(session.user.id, "debts");
  if (featureError) {
    return { success: false, error: featureError };
  }

  const parsed = createDebtSchema(tValidation as any).safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    creditor: formData.get("creditor"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate") || null,
    category: formData.get("category") || "",
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
    await createDebt({
      workspaceId: parsed.data.workspaceId,
      name: parsed.data.name,
      creditor: parsed.data.creditor,
      amount: parsed.data.amount,
      dueDate: parsed.data.dueDate,
      category: parsed.data.category,
      notes: parsed.data.notes,
    });

    revalidatePath("/dashboard/debts");
    revalidatePath("/dashboard");

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error("createDebtAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : tErrors("unexpected"),
    };
  }
}
