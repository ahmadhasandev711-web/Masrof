import { ArchiveCategoryButton } from "@/features/categories/components/archive-category-button";
import { getTranslations } from "next-intl/server";

type CategoryItem = {
  _id: unknown;
  name: string;
  kind: "income" | "expense";
  icon?: string | null;
  isSystem: boolean;
};

function CategoryGroup({
  title,
  categories,
  workspaceId,
  emptyLabel,
}: {
  title: string;
  categories: CategoryItem[];
  workspaceId: string;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 font-semibold text-neutral-900">{title}</h2>
      {categories.length === 0 ? (
        <p className="text-sm text-neutral-400">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const id = String(category._id);
            return (
              <li
                key={id}
                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm"
              >
                <span>{category.icon ?? "🏷️"}</span>
                <span className="text-neutral-700">{category.name}</span>
                {!category.isSystem && (
                  <ArchiveCategoryButton categoryId={id} workspaceId={workspaceId} />
                )}
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
}: {
  categories: CategoryItem[];
  workspaceId: string;
}) {
  const [tCategory, tEmpty] = await Promise.all([
    getTranslations("forms.category"),
    getTranslations("empty"),
  ]);
  const incomeCategories = categories.filter((c) => c.kind === "income");
  const expenseCategories = categories.filter((c) => c.kind === "expense");

  return (
    <div className="flex flex-col gap-4">
      <CategoryGroup
        title={tCategory("kindIncome")}
        categories={incomeCategories}
        workspaceId={workspaceId}
        emptyLabel={tEmpty("noCategories")}
      />
      <CategoryGroup
        title={tCategory("kindExpense")}
        categories={expenseCategories}
        workspaceId={workspaceId}
        emptyLabel={tEmpty("noCategories")}
      />
    </div>
  );
}
