"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { projectsService } from "@/features/projects/projects.service";
import { updateProjectStatusSchema } from "@/features/projects/schemas";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function updateProjectStatusAction(input: {
  workspaceId: string;
  projectId: string;
  status: string;
}): Promise<{ error: string | null }> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = updateProjectStatusSchema(tValidation).safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, ({ userId }) =>
    projectsService.updateStatus(userId, parsed.data),
  );
  if (!result.ok) {
    // Plan-limit errors already carry a localized message; others are error codes.
    const code = result.error.code as Parameters<typeof tErrors>[0];
    try {
      return { error: result.error.code === "planLimitReached" ? result.error.message : tErrors(code) };
    } catch {
      return { error: result.error.message };
    }
  }

  revalidateTag(CACHE_TAGS.projects, "max");
  revalidatePath("/dashboard/projects");
  return { error: null };
}
