"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { recurringExpensesService } from "@/features/recurring-expenses/recurring-expenses.service";
import type { AppLocale } from "@/i18n/config";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

async function translatedError(
  code: string,
  fallback: string,
  tErrors: Awaited<ReturnType<typeof getTranslations>>,
): Promise<string> {
  try {
    return tErrors(code as Parameters<typeof tErrors>[0]);
  } catch {
    return fallback;
  }
}

export async function recordRecurringExpenseAction(
  recurringId: string,
  workspaceId: string,
): Promise<{ error: string | null }> {
  const tErrors = await getTranslations("errors");
  try {
    const locale = (await getLocale()) as AppLocale;
    const result = await runWorkspaceWrite(workspaceId, ({ userId }) =>
      recurringExpensesService.record(recurringId, workspaceId, userId, locale),
    );
    if (!result.ok) {
      return { error: await translatedError(result.error.code, result.error.message, tErrors) };
    }

    revalidateTag(CACHE_TAGS.recurring, "max");
    revalidateTag(CACHE_TAGS.budgets, "max");
    revalidateTag(CACHE_TAGS.accounts, "max");
    revalidatePath("/dashboard/budgets");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
    return { error: null };
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return { error: tErrors("unauthorized") };
    throw error;
  }
}

export async function archiveRecurringExpenseAction(
  recurringId: string,
  workspaceId: string,
): Promise<{ error: string | null }> {
  const tErrors = await getTranslations("errors");
  try {
    const result = await runWorkspaceWrite(workspaceId, ({ userId }) =>
      recurringExpensesService.archive(userId, recurringId, workspaceId),
    );
    if (!result.ok) {
      return { error: await translatedError(result.error.code, result.error.message, tErrors) };
    }

    revalidateTag(CACHE_TAGS.recurring, "max");
    revalidatePath("/dashboard/budgets");
    return { error: null };
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return { error: tErrors("unauthorized") };
    throw error;
  }
}
