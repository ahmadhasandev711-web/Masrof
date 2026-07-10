import { requireSession } from "@/features/auth/session";
import { getCurrentWorkspaceContext } from "@/features/workspaces/current";
import { listCategoriesForWorkspace } from "@/features/categories/data";
import { CreateCategoryForm } from "@/features/categories/components/create-category-form";
import { CategoryList } from "@/features/categories/components/category-list";
import { getTranslations } from "next-intl/server";

export default async function CategoriesPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.categories");
  const { activeWorkspace } = await getCurrentWorkspaceContext(session.user.id);

  const workspaceId = activeWorkspace._id.toString();
  const categories = await listCategoriesForWorkspace(workspaceId);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
      </div>

      <CreateCategoryForm workspaceId={workspaceId} />

      <CategoryList categories={categories} workspaceId={workspaceId} />
    </div>
  );
}
