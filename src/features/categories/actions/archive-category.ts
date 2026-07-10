"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveCustomCategory } from "@/features/categories/data";

export async function archiveCategoryAction(categoryId: string, workspaceId: string) {
  const session = await requireSession();
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  await archiveCustomCategory(categoryId, workspaceId);

  revalidatePath("/dashboard/categories");
}
