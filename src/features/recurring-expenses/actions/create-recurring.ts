"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createRecurringExpenseSchema } from "@/features/recurring-expenses/schemas";
import { InvalidRecurringExpenseError } from "@/features/recurring-expenses/recurring-expenses.repository";
import { recurringExpensesService } from "@/features/recurring-expenses/recurring-expenses.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateRecurringState = { error: string | null };

export async function createRecurringExpenseAction(
  _prevState: CreateRecurringState,
  formData: FormData,
): Promise<CreateRecurringState> {
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
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, ({ userId }) =>
    recurringExpensesService.create(userId, parsed.data),
  );

  if (!result.ok) {
    if (result.error instanceof InvalidRecurringExpenseError) {
      return { error: tErrors(result.error.code as Parameters<typeof tErrors>[0]) };
    }
    return { error: result.error.message };
  }

  revalidateTag(CACHE_TAGS.recurring, "max");
  revalidatePath("/dashboard/budgets");
  return { error: null };
}
