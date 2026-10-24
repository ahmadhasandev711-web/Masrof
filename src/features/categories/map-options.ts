import type { AppLocale } from "@/i18n/config";
import { resolveCategoryLabel, type CategoryLabelFields } from "@/features/categories/labels";

export type CategoryOption = CategoryLabelFields & {
  id: string;
  kind: "income" | "expense";
  slug?: string | null;
  icon?: string | null;
  /** Resolved label for the request locale (convenience for server-rendered selects). */
  displayName: string;
};

type PlainCategory = CategoryLabelFields & {
  _id: unknown;
  kind: "income" | "expense";
  slug?: string | null;
  icon?: string | null;
};

export function mapPlainCategoryToOption(
  category: PlainCategory,
  locale: AppLocale | string,
): CategoryOption {
  return {
    id: String(category._id),
    name: category.name,
    nameEn: category.nameEn ?? null,
    kind: category.kind,
    slug: category.slug ?? null,
    icon: category.icon ?? null,
    displayName: resolveCategoryLabel(category, locale),
  };
}
