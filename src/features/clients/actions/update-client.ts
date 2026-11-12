"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { updateClientSchema } from "@/features/clients/schemas";
import { clientsService } from "@/features/clients/clients.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type UpdateClientState = {
  error: string | null;
  success: boolean;
};

export async function updateClientAction(
  _prevState: UpdateClientState,
  formData: FormData,
): Promise<UpdateClientState> {
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

  const result = await runWorkspaceWrite(parsed.data.workspaceId, () =>
    clientsService.update(parsed.data.clientId, parsed.data.workspaceId, {
      name: parsed.data.name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
    }),
  );

  if (!result.ok) {
    return { error: result.error.message || tErrors(result.error.code as "clientNotFound"), success: false };
  }

  revalidatePath("/dashboard/clients");
  revalidateTag(CACHE_TAGS.clients, "max");
  return { error: null, success: true };
}
