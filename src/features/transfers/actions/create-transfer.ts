"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { createTransferSchema } from "@/features/transfers/schemas";
import { createTransfer, InvalidTransferError } from "@/features/transfers/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateTransferState = { error: string | null };

export async function createTransferAction(
  _prevState: CreateTransferState,
  formData: FormData,
): Promise<CreateTransferState> {
  const session = await requireSession();
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

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  try {
    await createTransfer(parsed.data, session.user.id);
  } catch (error) {
    if (error instanceof InvalidTransferError) {
      return { error: tErrors(error.code as Parameters<typeof tErrors>[0]) };
    }
    throw error;
  }

  revalidateTag(CACHE_TAGS.transfers, "max");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { error: null };
}
