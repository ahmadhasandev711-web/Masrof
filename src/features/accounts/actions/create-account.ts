"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { createAccountSchema } from "@/features/accounts/schemas";
import { createAccount } from "@/features/accounts/data";
import { resolveAccountCurrency } from "@/lib/currency";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { SupportedCurrency } from "@/models/workspace";

export type CreateAccountState = {
  error: string | null;
};

export async function createAccountAction(
  _prevState: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createAccountSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    type: formData.get("type"),
    openingBalance: formData.get("openingBalance") || 0,
    currency: formData.get("currency") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const workspace = await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);
  const workspaceCurrency = workspace.currency as SupportedCurrency;
  const requestedCurrency = resolveAccountCurrency(parsed.data.currency, workspaceCurrency);

  if (requestedCurrency !== workspaceCurrency) {
    const featureError = await assertWorkspacePlanFeature(session.user.id, parsed.data.workspaceId, "multiCurrency");
    if (featureError) {
      return { error: featureError };
    }
  }

  await createAccount({ ...parsed.data, currency: requestedCurrency }, workspaceCurrency);

  revalidatePath("/dashboard/accounts");
  revalidateTag(CACHE_TAGS.accounts, "max");
  return { error: null };
}
