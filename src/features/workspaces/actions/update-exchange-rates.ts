"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { workspacesService } from "@/features/workspaces/workspaces.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { SUPPORTED_CURRENCIES } from "@/models/workspace";
import type { SupportedCurrency } from "@/models/workspace";

export type UpdateExchangeRatesState = { error: string | null; success: boolean };

export async function updateExchangeRatesAction(
  _prev: UpdateExchangeRatesState,
  formData: FormData,
): Promise<UpdateExchangeRatesState> {
  const tErrors = await getTranslations("errors");
  const workspaceId = String(formData.get("workspaceId") ?? "");

  if (!workspaceId) {
    return { error: tErrors("workspaceUnknown"), success: false };
  }

  const rates: Record<string, number> = {};
  for (const currency of SUPPORTED_CURRENCIES) {
    const raw = String(formData.get(`rate_${currency}`) ?? "").trim();
    if (!raw) continue;
    rates[currency] = Number(raw);
  }

  const result = await runWorkspaceWrite(workspaceId, ({ userId, workspace }) =>
    workspacesService.updateExchangeRates(
      userId,
      workspaceId,
      workspace.currency as SupportedCurrency,
      rates,
    ),
  );

  if (!result.ok) {
    if (result.error.code === "exchangeRateInvalidFor") {
      const currency = String(result.error.details?.currency ?? "");
      return { error: tErrors("exchangeRateInvalidFor", { currency }), success: false };
    }
    return { error: result.error.message, success: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  return { error: null, success: true };
}
