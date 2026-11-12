"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createDebtSchema } from "@/features/debts/schemas";
import { debtsService } from "@/features/debts/debts.service";
import { runWorkspaceWrite } from "@/server/kernel";

export type CreateDebtState = {
  success?: boolean;
  error: string | null;
};

export async function createDebtAction(
  _prevState: CreateDebtState,
  formData: FormData,
): Promise<CreateDebtState> {
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

  const result = await runWorkspaceWrite(parsed.data.workspaceId, ({ userId, workspace }) =>
    debtsService.create(userId, {
      ...parsed.data,
      currency: workspace.currency,
    }),
  );

  if (!result.ok) {
    return { success: false, error: result.error.message };
  }

  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard");

  return { success: true, error: null };
}
