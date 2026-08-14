"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveProject } from "@/features/projects/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveProjectAction(projectId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await archiveProject(projectId, workspaceId);

  revalidatePath("/dashboard/projects");
  revalidateTag(CACHE_TAGS.projects, "max");
}
