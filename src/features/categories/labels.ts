import type { AppLocale } from "@/i18n/config";

/** Fields required to pick a user-visible category label. */
export type CategoryLabelFields = {
  name: string;
  nameEn?: string | null;
};

/**
 * Resolves the display name for a category document for the active UI locale.
 * - Arabic (`ar`): `name` (canonical Arabic label in DB).
 * - English (`en`): `nameEn` when set, otherwise falls back to `name`.
 * Custom workspace categories may omit `nameEn`; they show the same `name` everywhere.
 */
export function resolveCategoryLabel(
  category: CategoryLabelFields,
  locale: AppLocale | string,
): string {
  const arName = category.name?.trim() || "";
  if (locale === "en") {
    const en = category.nameEn?.trim();
    return en || arName;
  }
  return arName;
}

export function resolveCategoryLabelFromPopulated(
  category: Partial<CategoryLabelFields> | null | undefined,
  locale: AppLocale | string,
  fallback = "—",
): string {
  if (!category?.name?.trim()) return fallback;
  return resolveCategoryLabel(
    { name: category.name, nameEn: category.nameEn },
    locale,
  );
}
