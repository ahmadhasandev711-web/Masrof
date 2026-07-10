import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { getPublishedPostBySlug, findAlternatePublishedLocale, listRelatedPosts } from "@/features/blog/data";
import { PostLocaleUnavailable } from "@/features/blog/components/post-locale-unavailable";
import { BlogPostCard } from "@/features/blog/components/blog-post-card";
import { renderPostContent } from "@/features/blog/render";
import { estimateReadingMinutes } from "@/features/blog/utils";
import { AdSlot } from "@/features/marketing/components/ad-slot";
import { NewsletterForm } from "@/features/marketing/components/newsletter-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const [t, common] = await Promise.all([
    getTranslations("pages.blog"),
    getTranslations("common"),
  ]);
  const locale = (await getLocale()) as AppLocale;
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug, locale);

  if (!post) return { title: t("notFound") };

  const imageUrl = post.featuredImage?.url;

  return {
    title: `${post.title} — ${common("appName")}`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      ...(imageUrl ? { images: [{ url: imageUrl, alt: post.featuredImage?.alt ?? post.title }] } : {}),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [tPages, tMarketing, format] = await Promise.all([
    getTranslations("pages.blog"),
    getTranslations("marketing.adSlot"),
    getFormatter(),
  ]);
  const locale = (await getLocale()) as AppLocale;
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug, locale);

  if (!post) {
    const alternateLocale = await findAlternatePublishedLocale(slug, locale);
    if (alternateLocale) {
      return (
        <PostLocaleUnavailable
          alternateLocale={alternateLocale}
          pathname={`/blog/${slug}`}
        />
      );
    }
    notFound();
  }

  const relatedPosts = await listRelatedPosts(slug, locale, post.category);
  const html = renderPostContent(post.content);
  const imageUrl = post.featuredImage?.url;
  const readingMinutes = estimateReadingMinutes(post.content);

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/blog" className="text-sm text-[#1C1B1A]/45 hover:text-[#065F46]">
        {tPages("allPosts")}
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#1C1B1A]/45">
          {post.category && (
            <Link
              href={`/blog?category=${encodeURIComponent(post.category)}`}
              className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[#065F46] hover:bg-[#D1FAE5]"
            >
              {post.category}
            </Link>
          )}
          <time>
            {format.dateTime(new Date(post.publishedAt!), {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          <span>· {readingMinutes} {tPages("readingMinutes")}</span>
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-marketing-display)] text-3xl font-semibold leading-tight text-[#1C1B1A] sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[#1C1B1A]/70">{post.excerpt}</p>
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#E4DFD3] px-2.5 py-0.5 text-xs text-[#1C1B1A]/55"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {imageUrl && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-[#E4DFD3]">
          <Image
            src={imageUrl}
            alt={post.featuredImage?.alt || post.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      <AdSlot placement="inline" />

      <div
        className="prose prose-neutral mt-10 max-w-none prose-headings:font-[family-name:var(--font-marketing-display)] prose-headings:text-[#1C1B1A] prose-p:leading-relaxed prose-p:text-[#1C1B1A]/80 prose-a:text-[#065F46] prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <AdSlot placement="articleEnd" label={tMarketing("articleEnd")} />

      {relatedPosts.length > 0 && (
        <section className="mt-12 border-t border-[#E4DFD3] pt-10">
          <h2 className="font-[family-name:var(--font-marketing-display)] text-xl font-semibold text-[#1C1B1A]">
            {tPages("relatedPosts")}
          </h2>
          <div className="mt-6 flex flex-col gap-6">
            {relatedPosts.map((related, index) => (
              <BlogPostCard key={related.slug} post={related} compact accentIndex={index} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 border-t border-[#E4DFD3] pt-10">
        <NewsletterForm variant="inline" />
      </div>
    </article>
  );
}
