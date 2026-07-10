import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { listPublishedPosts, listPublishedCategories } from "@/features/blog/data";
import { BlogPostCard } from "@/features/blog/components/blog-post-card";
import { BlogCategoryFilter } from "@/features/blog/components/blog-category-filter";
import { AdSlot } from "@/features/marketing/components/ad-slot";
import { NewsletterForm } from "@/features/marketing/components/newsletter-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.blogPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export const dynamic = "force-dynamic";

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [t, tMarketing] = await Promise.all([
    getTranslations("marketing.blogPage"),
    getTranslations("marketing"),
  ]);
  const locale = (await getLocale()) as AppLocale;
  const { category } = await searchParams;
  const [posts, categories] = await Promise.all([
    listPublishedPosts(locale, category),
    listPublishedCategories(locale),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-medium tracking-wide text-[#065F46]">{t("eyebrow")}</p>
        <h1 className="mt-2 font-[family-name:var(--font-marketing-display)] text-4xl font-semibold text-[#1C1B1A]">
          {tMarketing("blog")}
        </h1>
        <p className="mt-3 text-lg text-[#1C1B1A]/65">{t("metaDescription")}</p>
      </div>

      <div className="mt-8">
        <BlogCategoryFilter activeCategory={category} categories={categories} />
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
          {posts.map((post, index) => (
            <BlogPostCard key={post.slug} post={post} priority={index === 0} />
          ))}

          {posts.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#E4DFD3] bg-white/60 px-6 py-12 text-center text-[#1C1B1A]/50">
              {category ? t("emptyCategory") : t("empty")}
            </p>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <AdSlot placement="sidebar" />
          <NewsletterForm />
          <div className="rounded-2xl border border-[#E4DFD3] bg-[#ECFDF5]/50 p-5">
            <p className="text-sm font-medium text-[#065F46]">{t("ctaTitle")}</p>
            <p className="mt-2 text-sm text-[#1C1B1A]/65">{t("ctaBody")}</p>
            <Link
              href="/register"
              className="mt-4 inline-block rounded-lg bg-[#065F46] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d3a]"
            >
              {tMarketing("startFree")}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
