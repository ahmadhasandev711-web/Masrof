"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { projectsService } from "@/features/projects/projects.service";
import { createUpdateProjectSchema } from "@/features/projects/schemas";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type UpdateProjectState = {
  error: string | null;
  success: boolean;
};

export async function updateProjectAction(
  _prevState: UpdateProjectState,
  formData: FormData,
): Promise<UpdateProjectState> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const dueDateRaw = formData.get("dueDate");
  const expectedAmountRaw = formData.get("expectedAmount");

  const parsed = createUpdateProjectSchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    projectId: formData.get("projectId"),
    clientId: formData.get("clientId") ?? undefined,
    name: formData.get("name"),
    expectedAmount: expectedAmountRaw ? expectedAmountRaw : null,
    dueDate: dueDateRaw ? dueDateRaw : null,
    description: formData.get("description") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData"), success: false };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, () =>
    projectsService.update(parsed.data),
  );
  if (!result.ok) {
    const code = result.error.code as Parameters<typeof tErrors>[0];
    try {
      return { error: tErrors(code), success: false };
    } catch {
      return { error: result.error.message, success: false };
    }
  }

  revalidateTag(CACHE_TAGS.projects, "max");
  revalidatePath("/dashboard/projects");
  return { error: null, success: true };
}
