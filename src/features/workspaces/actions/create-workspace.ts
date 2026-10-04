"use server";

import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { createWorkspaceSchema } from "@/features/workspaces/schemas";
import { createWorkspaceForUser } from "@/features/workspaces/data";
import { assertCanCreateWorkspace } from "@/features/subscriptions/data";
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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const limitError = await assertCanCreateWorkspace(session.user.id);
  if (limitError) {
    return { error: limitError };
  }

  const trimmedName = parsed.data.name.trim();
  const { WorkspaceModel } = await import("@/models/workspace");
  const existingWs = await WorkspaceModel.findOne({
    name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    isArchived: false,
  }).lean();

  if (existingWs) {
    return { error: "اسم مساحة العمل مستخدم بالفعل. يرجى اختيار اسم فريد لمساحتك." };
  }

  const workspaceId = await createWorkspaceForUser(session.user.id, parsed.data);
  await setActiveWorkspaceId(workspaceId);

  return { error: null, redirectTo: "/dashboard" };
}
