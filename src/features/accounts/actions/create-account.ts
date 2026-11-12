"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createAccountSchema } from "@/features/accounts/schemas";
import { accountsService } from "@/features/accounts/accounts.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { SupportedCurrency } from "@/models/workspace";

export type CreateAccountState = {
  error: string | null;
};

export async function createAccountAction(
  _prevState: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createAccountSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    type: formData.get("type"),
    openingBalance: formData.get("openingBalance") || 0,
    currency: formData.get("currency") || undefined,
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, ({ userId, workspace }) =>
    accountsService.create(
      userId,
      parsed.data,
      workspace.currency as SupportedCurrency,
    ),
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/accounts");
  revalidateTag(CACHE_TAGS.accounts, "max");
  return { error: null };
}
