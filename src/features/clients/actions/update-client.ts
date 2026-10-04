"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { updateClientSchema } from "@/features/clients/schemas";
import { updateClient } from "@/features/clients/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type UpdateClientState = {
  error: string | null;
  success: boolean;
};

export async function updateClientAction(
  _prevState: UpdateClientState,
  formData: FormData,
): Promise<UpdateClientState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = updateClientSchema(tValidation).safeParse({
    clientId: formData.get("clientId"),
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    email: formData.get("email") ?? undefined,
    phone: formData.get("phone") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData"), success: false };
  }

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  const updated = await updateClient(parsed.data.clientId, parsed.data.workspaceId, {
    name: parsed.data.name,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
  });

  if (!updated) {
    return { error: tErrors("clientNotFound"), success: false };
  }

  revalidatePath("/dashboard/clients");
  revalidateTag(CACHE_TAGS.clients, "max");
  return { error: null, success: true };
}