"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { workspacesService } from "@/features/workspaces/workspaces.service";
import { runWorkspaceOwnerWrite } from "@/server/kernel";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/currency/constants";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { z } from "zod";

const schema = z.object({
  workspaceId: z.string().min(1),
  currency: z.enum(SUPPORTED_CURRENCIES),
});

export type UpdateCurrencyState = {
  error: string | null;
  success?: boolean;
};

export async function updateWorkspaceCurrencyAction(
  _prev: UpdateCurrencyState,
  formData: FormData,
): Promise<UpdateCurrencyState> {
  const tErrors = await getTranslations("errors");

  const parsed = schema.safeParse({
    workspaceId: formData.get("workspaceId"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return { error: tErrors("invalidData") };
  }

  const result = await runWorkspaceOwnerWrite(parsed.data.workspaceId, () =>
    workspacesService.updateCurrency(
      parsed.data.workspaceId,
      parsed.data.currency as SupportedCurrency,
    ),
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/budgets");
  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard/reports");

  revalidateTag(CACHE_TAGS.accounts, "max");
  revalidateTag(CACHE_TAGS.invoices, "max");
  revalidateTag(CACHE_TAGS.budgets, "max");
  revalidateTag(CACHE_TAGS.goals, "max");
  revalidateTag(CACHE_TAGS.recurring, "max");
  revalidateTag(CACHE_TAGS.transfers, "max");

  return { error: null, success: true };
}
