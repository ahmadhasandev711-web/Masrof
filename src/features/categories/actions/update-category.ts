"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createUpdateCategorySchema } from "@/features/categories/schemas";
import { categoriesService } from "@/features/categories/categories.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type UpdateCategoryState = {
  error: string | null;
  success: boolean;
};

export async function updateCategoryAction(
  _prevState: UpdateCategoryState,
  formData: FormData,
): Promise<UpdateCategoryState> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createUpdateCategorySchema(tValidation).safeParse({
    categoryId: formData.get("categoryId"),
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    nameEn: formData.get("nameEn"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData"), success: false };
  }

  const result = await runWorkspaceWrite(parsed.data.workspaceId, () =>
    categoriesService.update(parsed.data.categoryId, parsed.data.workspaceId, {
      name: parsed.data.name,
      nameEn: parsed.data.nameEn,
    }),
  );
  if (!result.ok) {
    return { error: tErrors("categoryNotFound"), success: false };
  }

  revalidatePath("/dashboard/categories");
  revalidateTag(CACHE_TAGS.categories, "max");
  return { error: null, success: true };
}
