"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature, assertWorkspaceQuantityLimit } from "@/features/subscriptions/data";
import { createClientSchema } from "@/features/clients/schemas";
import { createClient } from "@/features/clients/data";
import { countClientsForWorkspace } from "@/features/subscriptions/plan-usage";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateClientState = {
  error: string | null;
};

export async function createClientAction(
  _prevState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const session = await requireSession();
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

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  const featureError = await assertWorkspacePlanFeature(session.user.id, parsed.data.workspaceId, "clientsAndProjects");
  if (featureError) {
    return { error: featureError };
  }

  const clientCount = await countClientsForWorkspace(parsed.data.workspaceId);
  const limitError = await assertWorkspaceQuantityLimit(
    session.user.id,
    parsed.data.workspaceId,
    "maxClients",
    clientCount,
  );
  if (limitError) {
    return { error: limitError };
  }

  await createClient(parsed.data);

  revalidatePath("/dashboard/clients");
  revalidateTag(CACHE_TAGS.clients, "max");
  return { error: null };
}
