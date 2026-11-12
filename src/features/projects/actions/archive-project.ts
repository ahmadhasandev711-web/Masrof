"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { projectsService } from "@/features/projects/projects.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveProjectAction(projectId: string, workspaceId: string) {
  try {
    await runWorkspaceWrite(workspaceId, () => projectsService.archive(projectId, workspaceId));
    revalidatePath("/dashboard/projects");
    revalidateTag(CACHE_TAGS.projects, "max");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
