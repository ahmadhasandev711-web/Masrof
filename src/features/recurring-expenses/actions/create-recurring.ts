"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature, assertWorkspaceQuantityLimit } from "@/features/subscriptions/data";
import { createRecurringExpenseSchema } from "@/features/recurring-expenses/schemas";
import {
  createRecurringExpense,
  InvalidRecurringExpenseError,
} from "@/features/recurring-expenses/data";
import { countRecurringExpensesForWorkspace } from "@/features/subscriptions/plan-usage";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateRecurringState = { error: string | null };

export async function createRecurringExpenseAction(
  _prevState: CreateRecurringState,
  formData: FormData,
): Promise<CreateRecurringState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const frequency = formData.get("frequency");

  const parsed = createRecurringExpenseSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    description: formData.get("description") || "",
    frequency,
    dayOfMonth: frequency === "monthly" ? formData.get("dayOfMonth") : undefined,
    dayOfWeek: frequency === "weekly" ? formData.get("dayOfWeek") : undefined,
    nextDueDate: formData.get("nextDueDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  const featureError = await assertWorkspacePlanFeature(session.user.id, parsed.data.workspaceId, "recurringExpenses");
  if (featureError) {
    return { error: featureError };
  }

  const recurringCount = await countRecurringExpensesForWorkspace(parsed.data.workspaceId);
  const limitError = await assertWorkspaceQuantityLimit(
    session.user.id,
    parsed.data.workspaceId,
    "maxRecurringExpenses",
    recurringCount,
  );
  if (limitError) {
    return { error: limitError };
  }

  try {
    await createRecurringExpense(parsed.data);
  } catch (error) {
    if (error instanceof InvalidRecurringExpenseError) {
      return { error: tErrors(error.code as Parameters<typeof tErrors>[0]) };
    }
    throw error;
  }

  revalidateTag(CACHE_TAGS.recurring, "max");
  revalidatePath("/dashboard/budgets");
  return { error: null };
}
