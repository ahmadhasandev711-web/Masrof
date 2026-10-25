"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
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

  const parsed = createDebtSchema(tValidation as any).safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    creditor: formData.get("creditor"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate") || null,
    category: formData.get("category") || "",
    notes: formData.get("notes") || "",
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? tErrors("invalidData"),
    };
  }

  const workspace = await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  const featureError = await assertWorkspacePlanFeature(session.user.id, parsed.data.workspaceId, "debts");
  if (featureError) {
    return { success: false, error: featureError };
  }

  try {
    await createDebt({
      ...parsed.data,
      currency: workspace.currency,
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
