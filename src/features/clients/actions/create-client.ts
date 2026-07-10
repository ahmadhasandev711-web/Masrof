"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { createClientSchema } from "@/features/clients/schemas";
import { createClient } from "@/features/clients/data";

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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  const featureError = await assertWorkspacePlanFeature(session.user.id, parsed.data.workspaceId, "clientsAndProjects");
  if (featureError) {
    return { error: featureError };
  }

  await createClient(parsed.data);

  revalidatePath("/dashboard/clients");
  return { error: null };
}
