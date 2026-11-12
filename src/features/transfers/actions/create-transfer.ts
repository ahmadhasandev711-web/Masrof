"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createTransferSchema } from "@/features/transfers/schemas";
import { InvalidTransferError } from "@/features/transfers/transfers.repository";
import { transfersService } from "@/features/transfers/transfers.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateTransferState = { error: string | null };

export async function createTransferAction(
  _prevState: CreateTransferState,
  formData: FormData,
): Promise<CreateTransferState> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createTransferSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
    amount: formData.get("amount"),
    transferDate: formData.get("transferDate"),
    description: formData.get("description") || "",
    notes: formData.get("notes") || "",
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, ({ userId }) =>
    transfersService.create(userId, parsed.data),
  );

  if (!result.ok) {
    if (result.error instanceof InvalidTransferError) {
      return { error: tErrors(result.error.code as Parameters<typeof tErrors>[0]) };
    }
    return { error: result.error.message };
  }

  revalidateTag(CACHE_TAGS.transfers, "max");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { error: null };
}
