import type { ReactNode } from "react";
import { ArchiveCategoryButton } from "@/features/categories/components/archive-category-button";
import { CategoryIcon, NavIcon } from "@/components/ui/app-icons";
import { resolveCategoryLabel } from "@/features/categories/labels";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";

type CategoryItem = {
  _id: unknown;
  name: string;
  kind: "income" | "expense";
  icon?: string | null;
  slug?: string | null;
  nameEn?: string | null;
  isSystem: boolean;
};

function CategoryGroup({
  title,
  headerIcon,
  categories,
  workspaceId,
  emptyLabel,
  systemBadgeLabel,
  locale,
  canWrite = true,
}: {
  title: string;
  headerIcon: ReactNode;
  categories: CategoryItem[];
  workspaceId: string;
  emptyLabel: string;
  systemBadgeLabel: string;
  locale: AppLocale;
  canWrite?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
            {headerIcon}
          </span>
          <h2 className="font-semibold text-neutral-900">{title}</h2>
        </div>
        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 font-mono text-xs font-medium tabular-nums text-neutral-600">
          {categories.length}
        </span>
      </div>
      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center">
          <p className="text-sm text-neutral-400">{emptyLabel}</p>
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2.5">
          {categories.map((category) => {
            const id = String(category._id);
            return (
              <li
                key={id}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-1.5 text-sm transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                <CategoryIcon slug={category.slug} kind={category.kind} className="h-4 w-4 shrink-0" />
                <span className="font-medium text-neutral-800">
                  {resolveCategoryLabel(category, locale)}
                </span>
                {category.isSystem ? (
                  <span className="rounded bg-neutral-200/70 px-1.5 py-0.5 text-[10px] text-neutral-500">
                    {systemBadgeLabel}
                  </span>
                ) : canWrite ? (
                  <ArchiveCategoryButton categoryId={id} workspaceId={workspaceId} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export async function CategoryList({
  categories,
  workspaceId,
  canWrite = true,
}: {
  categories: CategoryItem[];
  workspaceId: string;
  canWrite?: boolean;
}) {
  const locale = (await getLocale()) as AppLocale;
  const [tCategory, tEmpty, tPages] = await Promise.all([
    getTranslations("forms.category"),
    getTranslations("empty"),
    getTranslations("pages.categories"),
  ]);
  const incomeCategories = categories.filter((c) => c.kind === "income");
  const expenseCategories = categories.filter((c) => c.kind === "expense");

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <CategoryGroup
        title={tCategory("kindIncome")}
        headerIcon={<NavIcon name="trending-up" className="h-4 w-4 text-emerald-700" />}
        categories={incomeCategories}
        workspaceId={workspaceId}
        emptyLabel={tEmpty("noCategories")}
        systemBadgeLabel={tPages("systemBadge")}
        locale={locale}
        canWrite={canWrite}
      />
      <CategoryGroup
        title={tCategory("kindExpense")}
        headerIcon={<NavIcon name="trending-down" className="h-4 w-4 text-amber-700" />}
        categories={expenseCategories}
        workspaceId={workspaceId}
        emptyLabel={tEmpty("noCategories")}
        systemBadgeLabel={tPages("systemBadge")}
        locale={locale}
        canWrite={canWrite}
      />
    </div>
  );
}
