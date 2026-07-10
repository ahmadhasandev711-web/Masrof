"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { createProjectSchema } from "@/features/projects/schemas";
import { createProject } from "@/features/projects/data";

export type CreateProjectState = {
  error: string | null;
};

export async function createProjectAction(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const dueDateRaw = formData.get("dueDate");
  const expectedAmountRaw = formData.get("expectedAmount");

  const parsed = createProjectSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    clientId: formData.get("clientId") ?? undefined,
    name: formData.get("name"),
    status: formData.get("status") || "active",
    expectedAmount: expectedAmountRaw ? expectedAmountRaw : null,
    dueDate: dueDateRaw ? dueDateRaw : null,
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);

  const featureError = await assertWorkspacePlanFeature(session.user.id, parsed.data.workspaceId, "clientsAndProjects");
  if (featureError) {
    return { error: featureError };
  }

  await createProject(parsed.data);

  revalidatePath("/dashboard/projects");
  return { error: null };
}
