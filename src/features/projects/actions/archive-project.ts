"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { projectsService } from "@/features/projects/projects.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveProjectAction(
  projectId: string,
  workspaceId: string,
): Promise<{ error: string | null }> {
  const tErrors = await getTranslations("errors");
  try {
    const result = await runWorkspaceWrite(workspaceId, () =>
      projectsService.archive(projectId, workspaceId),
    );
    if (!result.ok) {
      return {
        error:
          result.error.code === "projectHasOpenInvoices"
            ? tErrors("projectHasOpenInvoices")
            : tErrors("projectNotFound"),
      };
    }
    revalidatePath("/dashboard/projects");
    revalidateTag(CACHE_TAGS.projects, "max");
    return { error: null };
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return { error: tErrors("unauthorized") };
    throw error;
  }
}
