"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { createCategorySchema } from "@/features/categories/schemas";
import { createCustomCategory } from "@/features/categories/data";

export type CreateCategoryState = {
  error: string | null;
};

export async function createCategoryAction(
  _prevState: CreateCategoryState,
  formData: FormData,
): Promise<CreateCategoryState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const parsed = createCategorySchema(tValidation).safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    kind: formData.get("kind"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  await verifyWorkspaceWriteAccess(session.user.id, parsed.data.workspaceId);
  await createCustomCategory(parsed.data);

  revalidatePath("/dashboard/categories");
  return { error: null };
}
