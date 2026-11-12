"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { isWorkspaceAuthorizationError } from "@/features/workspaces/access";
import { categoriesService } from "@/features/categories/categories.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function archiveCategoryAction(categoryId: string, workspaceId: string) {
  try {
    await runWorkspaceWrite(workspaceId, () =>
      categoriesService.archive(categoryId, workspaceId),
    );
    revalidatePath("/dashboard/categories");
    revalidateTag(CACHE_TAGS.categories, "max");
  } catch (error) {
    if (isWorkspaceAuthorizationError(error)) return;
    throw error;
  }
}
