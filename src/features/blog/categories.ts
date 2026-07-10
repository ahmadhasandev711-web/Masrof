import type { AppLocale } from "@/i18n/config";

export const BLOG_CATEGORIES_AR = [
  "إدارة مالية",
  "فريلانس",
  "مشاريع صغيرة",
  "نصائح عامة",
] as const;

export const BLOG_CATEGORIES_EN = [
  "Personal finance",
  "Freelance",
  "Small business",
  "General tips",
] as const;

/** @deprecated Use getBlogCategories(locale) */
export const BLOG_CATEGORIES = BLOG_CATEGORIES_AR;

export type BlogCategoryAr = (typeof BLOG_CATEGORIES_AR)[number];
export type BlogCategoryEn = (typeof BLOG_CATEGORIES_EN)[number];

export function getBlogCategories(locale: AppLocale): readonly string[] {
  return locale === "en" ? BLOG_CATEGORIES_EN : BLOG_CATEGORIES_AR;
}

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export function formatTagsForInput(tags: string[] | undefined): string {
  return (tags ?? []).join("، ");
}
