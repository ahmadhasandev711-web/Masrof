"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { isWorkspaceAuthorizationError, verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { archiveCustomCategory } from "@/features/categories/data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveCategoryAction(categoryId: string, workspaceId: string) {
  try {
    const session = await requireSession();
    await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

    await archiveCustomCategory(categoryId, workspaceId);

    revalidatePath("/dashboard/categories");
    revalidateTag(CACHE_TAGS.categories, "max");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
