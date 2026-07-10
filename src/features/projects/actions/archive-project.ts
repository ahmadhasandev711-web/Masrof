"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveProject } from "@/features/projects/data";

export async function archiveProjectAction(projectId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await archiveProject(projectId, workspaceId);

  revalidatePath("/dashboard/projects");
}
