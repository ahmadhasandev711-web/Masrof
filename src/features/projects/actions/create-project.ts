"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createProjectSchema } from "@/features/projects/schemas";
import { projectsService } from "@/features/projects/projects.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type CreateProjectState = {
  error: string | null;
};

export async function createProjectAction(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
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
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, ({ userId }) =>
    projectsService.create(userId, parsed.data),
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/projects");
  revalidateTag(CACHE_TAGS.projects, "max");
  return { error: null };
}
