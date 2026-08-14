import "server-only";

import { cache } from "react";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PostModel } from "@/models/post";
import { toPlain } from "@/lib/db/plain";
import type { AppLocale } from "@/i18n/config";

export type PublicPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
  category: string | null;
  tags: string[];
  locale: AppLocale;
  featuredImage: { url: string; alt: string | null } | null;
  content?: string;
};

export type PublicPostDetail = PublicPostSummary & { content: string };

function mapPostSummary(post: Record<string, unknown>): PublicPostSummary {
  const featured = post.featuredImage as { url?: string; alt?: string | null } | null | undefined;
  const tags = Array.isArray(post.tags) ? post.tags.map(String) : [];

  return {
    slug: String(post.slug),
    title: String(post.title),
    excerpt: String(post.excerpt),
    publishedAt: post.publishedAt ? new Date(post.publishedAt as string).toISOString() : null,
    category: post.category ? String(post.category) : null,
    tags,
    locale: (post.locale === "en" ? "en" : "ar") as AppLocale,
    featuredImage: featured?.url
      ? { url: String(featured.url), alt: featured.alt ? String(featured.alt) : null }
      : null,
    content: post.content ? String(post.content) : undefined,
  };
}

const SUMMARY_FIELDS =
  "slug title excerpt publishedAt featuredImage category tags content locale";

async function fetchPublishedPosts(options: {
  locale: AppLocale;
  limit?: number;
  includeContent?: boolean;
  category?: string;
  tag?: string;
}): Promise<PublicPostSummary[]> {
  const { locale, limit, includeContent = false, category, tag } = options;

  try {
    await connectToDatabase();

    const filter: Record<string, unknown> = { isPublished: true, locale };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;

    const fields = includeContent ? SUMMARY_FIELDS : SUMMARY_FIELDS.replace(" content", "");

    let query = PostModel.find(filter).select(fields).sort({ publishedAt: -1 });

    if (limit) {
      query = query.limit(limit);
    }

    const posts = await query.lean();
    return posts.map((post) => mapPostSummary(toPlain(post) as Record<string, unknown>));
  } catch (error) {
    console.error("[blog] failed to load posts:", error);
    return [];
  }
}

import { unstable_cache } from "next/cache";

export const BLOG_POSTS_TAG = "blog-posts";

export const listPublishedPosts = unstable_cache(
  async (locale: AppLocale, category?: string, tag?: string) =>
    fetchPublishedPosts({ locale, category, tag }),
  ["blog-published-posts"],
  { revalidate: 300, tags: [BLOG_POSTS_TAG] },
);

export const listLatestPublishedPosts = unstable_cache(
  async (locale: AppLocale, limit = 3) =>
    fetchPublishedPosts({ locale, limit }),
  ["blog-latest-posts"],
  { revalidate: 300, tags: [BLOG_POSTS_TAG] },
);

async function fetchPostBySlug(slug: string, locale: AppLocale): Promise<PublicPostDetail | null> {
  try {
    await connectToDatabase();
    const post = await PostModel.findOne({ slug, locale, isPublished: true })
      .select(SUMMARY_FIELDS)
      .lean();
    if (!post) return null;
    const summary = mapPostSummary(toPlain(post) as Record<string, unknown>);
    return { ...summary, content: summary.content ?? "" };
  } catch (error) {
    console.error("[blog] failed to load post:", slug, error);
    return null;
  }
}

export const getPublishedPostBySlug = unstable_cache(
  fetchPostBySlug,
  ["blog-post-by-slug"],
  { revalidate: 300, tags: [BLOG_POSTS_TAG] },
);

/** If `slug` is published in another locale, returns that locale (for language-fallback UI). */
export async function findAlternatePublishedLocale(
  slug: string,
  currentLocale: AppLocale,
): Promise<AppLocale | null> {
  try {
    await connectToDatabase();
    const alternateLocale: AppLocale = currentLocale === "ar" ? "en" : "ar";
    const exists = await PostModel.exists({ slug, locale: alternateLocale, isPublished: true });
    return exists ? alternateLocale : null;
  } catch (error) {
    console.error("[blog] failed to resolve alternate locale:", slug, error);
    return null;
  }
}

async function fetchPublishedCategories(locale: AppLocale): Promise<string[]> {
  try {
    await connectToDatabase();
    const categories = await PostModel.distinct("category", {
      isPublished: true,
      locale,
      category: { $ne: null },
    });
    return categories.filter(Boolean).map(String).sort();
  } catch (error) {
    console.error("[blog] failed to load categories:", error);
    return [];
  }
}

export const listPublishedCategories = unstable_cache(
  fetchPublishedCategories,
  ["blog-categories"],
  { revalidate: 300, tags: [BLOG_POSTS_TAG] },
);

async function fetchRelatedPosts(
  slug: string,
  locale: AppLocale,
  category: string | null,
  limit = 3,
): Promise<PublicPostSummary[]> {
  if (!category) return [];

  try {
    await connectToDatabase();
    const posts = await PostModel.find({
      isPublished: true,
      locale,
      category,
      slug: { $ne: slug },
    })
      .select(SUMMARY_FIELDS.replace(" content", ""))
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    return posts.map((post) => mapPostSummary(toPlain(post) as Record<string, unknown>));
  } catch (error) {
    console.error("[blog] failed to load related posts:", error);
    return [];
  }
}

export const listRelatedPosts = unstable_cache(
  fetchRelatedPosts,
  ["blog-related-posts"],
  { revalidate: 300, tags: [BLOG_POSTS_TAG] },
);

/** All published posts across locales — used by sitemap (no cookie context). */
export async function listAllPublishedPostsForSitemap(): Promise<PublicPostSummary[]> {
  try {
    await connectToDatabase();
    const posts = await PostModel.find({ isPublished: true })
      .select(SUMMARY_FIELDS.replace(" content", ""))
      .sort({ publishedAt: -1 })
      .lean();
    return posts.map((post) => mapPostSummary(toPlain(post) as Record<string, unknown>));
  } catch (error) {
    console.error("[blog] failed to load sitemap posts:", error);
    return [];
  }
}
