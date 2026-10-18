import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { getWorkspaceAccess } from "@/features/workspaces/access";
import { canWorkspaceWrite } from "@/features/workspaces/roles";
import { listCategoriesForWorkspace } from "@/features/categories/data";
import { CategoryCreationManager } from "@/features/categories/components/category-creation-manager";
import { CategoryList } from "@/features/categories/components/category-list";
import { getTranslations } from "next-intl/server";

export default async function CategoriesPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.categories");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;

  const workspaceId = activeWorkspace._id.toString();
  const [categories, access] = await Promise.all([
    listCategoriesForWorkspace(workspaceId),
    getWorkspaceAccess(session.user.id, workspaceId),
  ]);

  const canWrite = canWorkspaceWrite(access.membership.role);
  const incomeCount = categories.filter((c) => c.kind === "income").length;
  const expenseCount = categories.filter((c) => c.kind === "expense").length;

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">{t("title")}</h1>
          <p className="text-sm text-neutral-500">{t("subtitle")}</p>
        </div>
        <CategoryCreationManager workspaceId={workspaceId} canWrite={canWrite} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">
            {t("totalCount", { count: categories.length })}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-neutral-900">
            {categories.length}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-emerald-600">
            {t("incomeCount", { count: incomeCount })}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-700">
            {incomeCount}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-amber-600">
            {t("expenseCount", { count: expenseCount })}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-700">
            {expenseCount}
          </p>
        </div>
      </div>

      <CategoryList categories={categories} workspaceId={workspaceId} />
    </div>
  );
}

