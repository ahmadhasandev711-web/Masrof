import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { getWorkspaceAccess } from "@/features/workspaces/access";
import { canWorkspaceWrite } from "@/features/workspaces/roles";
import { categoriesService } from "@/features/categories/categories.service";
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
    categoriesService.listForWorkspace(workspaceId),
    getWorkspaceAccess(session.user.id, workspaceId),
  ]);

  const canWrite = canWorkspaceWrite(access.membership.role);
  const incomeCount = categories.filter((c) => c.kind === "income").length;
  const expenseCount = categories.filter((c) => c.kind === "expense").length;

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-[#ECEAE4]">{t("title")}</h1>
          <p className="text-sm text-neutral-500 dark:text-[#9AA39F]">{t("subtitle")}</p>
        </div>
        <CategoryCreationManager workspaceId={workspaceId} canWrite={canWrite} />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center sm:text-start">
        <div className="rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-3 sm:p-4 shadow-xs">
          <p className="text-[11px] sm:text-xs font-medium text-neutral-500 dark:text-[#9AA39F] truncate">
            {t("totalCount", { count: categories.length })}
          </p>
          <p className="mt-1 font-mono text-lg sm:text-2xl font-bold tabular-nums text-neutral-900 dark:text-[#ECEAE4]">
            {categories.length}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-3 sm:p-4 shadow-xs">
          <p className="text-[11px] sm:text-xs font-medium text-emerald-600 dark:text-[#34D399] truncate">
            {t("incomeCount", { count: incomeCount })}
          </p>
          <p className="mt-1 font-mono text-lg sm:text-2xl font-bold tabular-nums text-emerald-700 dark:text-[#34D399]">
            {incomeCount}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-3 sm:p-4 shadow-xs">
          <p className="text-[11px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 truncate">
            {t("expenseCount", { count: expenseCount })}
          </p>
          <p className="mt-1 font-mono text-lg sm:text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
            {expenseCount}
          </p>
        </div>
      </div>

      <CategoryList categories={categories} workspaceId={workspaceId} canWrite={canWrite} />
    </div>
  );
}

