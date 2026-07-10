import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BLOG_CATEGORIES } from "@/features/blog/categories";

const BLOG_CATEGORY_MESSAGE_KEYS: Record<string, string> = {
  "إدارة مالية": "finance",
  فريلانس: "freelance",
  "مشاريع صغيرة": "smallBusiness",
  "نصائح عامة": "general",
};

export async function BlogCategoryFilter({
  activeCategory,
  categories,
}: {
  activeCategory?: string;
  categories: string[];
}) {
  const t = await getTranslations("marketing.blogCategories");
  const options = categories.length > 0 ? categories : [...BLOG_CATEGORIES];

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        className={`rounded-full px-3 py-1 text-sm transition ${
          !activeCategory
            ? "bg-[#065F46] text-white"
            : "border border-[#E4DFD3] bg-white text-[#1C1B1A]/70 hover:border-[#065F46]/30"
        }`}
      >
        {t("all")}
      </Link>
      {options.map((category) => (
        <Link
          key={category}
          href={`/blog?category=${encodeURIComponent(category)}`}
          className={`rounded-full px-3 py-1 text-sm transition ${
            activeCategory === category
              ? "bg-[#065F46] text-white"
              : "border border-[#E4DFD3] bg-white text-[#1C1B1A]/70 hover:border-[#065F46]/30"
          }`}
        >
          {BLOG_CATEGORY_MESSAGE_KEYS[category]
            ? t(BLOG_CATEGORY_MESSAGE_KEYS[category] as Parameters<typeof t>[0])
            : category}
        </Link>
      ))}
    </div>
  );
}
