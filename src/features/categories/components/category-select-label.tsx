"use client";

import { useLocale } from "next-intl";
import type { CategoryLabelFields } from "@/features/categories/labels";
import { resolveCategoryLabel } from "@/features/categories/labels";
import type { AppLocale } from "@/i18n/config";

export function CategorySelectLabel({ category }: { category: CategoryLabelFields }) {
  const locale = useLocale() as AppLocale;
  return <>{resolveCategoryLabel(category, locale)}</>;
}
