"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { updateWorkspace } from "@/features/workspaces/data";
import { SUPPORTED_CURRENCIES } from "@/models/workspace";

export type UpdateExchangeRatesState = { error: string | null; success: boolean };

export async function updateExchangeRatesAction(
  _prev: UpdateExchangeRatesState,
  formData: FormData,
): Promise<UpdateExchangeRatesState> {
  const session = await requireSession();
  const tErrors = await getTranslations("errors");
  const workspaceId = String(formData.get("workspaceId") ?? "");

  if (!workspaceId) {
    return { error: tErrors("workspaceUnknown"), success: false };
  }

  const workspace = await verifyWorkspaceWriteAccess(session.user.id, workspaceId);
  const featureError = await assertWorkspacePlanFeature(session.user.id, workspaceId, "multiCurrency");
  if (featureError) {
    return { error: featureError, success: false };
  }

  const rates: Record<string, number> = {};
  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency === workspace.currency) continue;
    const raw = String(formData.get(`rate_${currency}`) ?? "").trim();
    if (!raw) continue;
    const numeric = Number(raw);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return { error: tErrors("exchangeRateInvalidFor", { currency }), success: false };
    }
    rates[currency] = numeric;
  }

  await updateWorkspace(workspaceId, { exchangeRates: rates });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  return { error: null, success: true };
}
