"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClientSchema } from "@/features/clients/schemas";
import { clientsService } from "@/features/clients/clients.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateClientState = {
  error: string | null;
};

export async function createClientAction(
  _prevState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createClientSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    email: formData.get("email") ?? undefined,
    phone: formData.get("phone") ?? undefined,
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, ({ userId }) =>
    clientsService.create(userId, parsed.data),
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/clients");
  revalidateTag(CACHE_TAGS.clients, "max");
  return { error: null };
}
