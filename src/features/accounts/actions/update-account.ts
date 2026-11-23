"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createUpdateAccountSchema } from "@/features/accounts/schemas";
import { accountsService } from "@/features/accounts/accounts.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type UpdateAccountState = {
  error: string | null;
  success: boolean;
};

export async function updateAccountAction(
  _prevState: UpdateAccountState,
  formData: FormData,
): Promise<UpdateAccountState> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createUpdateAccountSchema(tValidation).safeParse({
    accountId: formData.get("accountId"),
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    openingBalance: formData.get("openingBalance") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData"), success: false };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, () =>
    accountsService.update(parsed.data.accountId, parsed.data.workspaceId, {
      name: parsed.data.name,
      openingBalance: parsed.data.openingBalance,
    }),
  );
  if (!result.ok) {
    return { error: tErrors("accountNotFound"), success: false };
  }

  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  revalidateTag(CACHE_TAGS.accounts, "max");
  return { error: null, success: true };
}
