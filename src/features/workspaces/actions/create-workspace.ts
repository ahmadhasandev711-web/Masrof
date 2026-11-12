"use server";

import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { createWorkspaceSchema } from "@/features/workspaces/schemas";
import { workspacesService } from "@/features/workspaces/workspaces.service";
import { setActiveWorkspaceId } from "@/features/workspaces/active-workspace";

export type CreateWorkspaceState = {
  error: string | null;
  redirectTo?: string | null;
};

export async function createWorkspaceAction(
  _prevState: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createWorkspaceSchema(tValidation).safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    currency: formData.get("currency") || "EGP",
    initialAccountName: formData.get("initialAccountName"),
    initialAccountType: formData.get("initialAccountType"),
    initialAccountBalance: formData.get("initialAccountBalance") || 0,
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await workspacesService.create(session.user.id, parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  await setActiveWorkspaceId(result.value);

  return { error: null, redirectTo: "/dashboard" };
}
