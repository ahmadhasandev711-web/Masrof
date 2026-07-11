import Image from "next/image";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { PublicPostSummary } from "@/features/blog/data";
import { estimateReadingMinutes } from "@/features/blog/utils";

type PostCardData = PublicPostSummary;

const ACCENT_GRADIENTS = [
  "from-[#ECFDF5] to-[#D1FAE5]",
  "from-[#EFF6FF] to-[#DBEAFE]",
  "from-[#FFF7ED] to-[#FFEDD5]",
] as const;

export async function BlogPostCard({
  post,
  compact = false,
  accentIndex = 0,
  priority = false,
}: {
  post: PostCardData;
  compact?: boolean;
  accentIndex?: number;
  priority?: boolean;
}) {
  const [t, format] = await Promise.all([getTranslations("pages.blog"), getFormatter()]);
  const imageUrl = post.featuredImage?.url;
  const readingMinutes = post.content ? estimateReadingMinutes(post.content) : null;

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-[#E4DFD3] bg-white transition hover:border-[#065F46]/30 hover:shadow-md ${
        compact ? "" : "flex flex-col sm:flex-row"
      }`}
    >
      <Link
        href={`/blog/${post.slug}`}
        className={`relative block shrink-0 overflow-hidden bg-[#F3F0E8] ${
          compact ? "aspect-[16/9] w-full" : "aspect-[16/10] w-full sm:w-56"
        }`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={post.featuredImage?.alt || post.title}
            fill
            unoptimized={imageUrl.startsWith("/uploads/")}
            priority={priority}
            sizes={
              compact
                ? "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 320px"
                : "(max-width: 640px) 100vw, 224px"
            }
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className={`flex h-full flex-col items-center justify-center bg-gradient-to-br ${ACCENT_GRADIENTS[accentIndex % ACCENT_GRADIENTS.length]} p-6`}
          >
            <span className="font-[family-name:var(--font-marketing-display)] text-5xl font-semibold text-[#065F46]/25">
              {post.title.trim().charAt(0) || "M"}
            </span>
          </div>
        )}
      </Link>

      <div className={`flex flex-1 flex-col ${compact ? "p-5" : "p-5 sm:p-6"}`}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#1C1B1A]/45">
          {post.category && (
            <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[#065F46]">{post.category}</span>
          )}
          {post.publishedAt && (
            <time>
              {format.dateTime(new Date(post.publishedAt), {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          )}
          {readingMinutes && <span>· {readingMinutes} {t("readingMinutes")}</span>}
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h2
            className={`mt-2 font-[family-name:var(--font-marketing-display)] font-semibold text-[#1C1B1A] transition group-hover:text-[#065F46] ${
              compact ? "text-lg leading-snug" : "text-xl"
            }`}
          >
            {post.title}
          </h2>
        </Link>

        <p className={`mt-2 leading-relaxed text-[#1C1B1A]/70 ${compact ? "line-clamp-2 text-sm" : "line-clamp-3"}`}>
          {post.excerpt}
        </p>

        <Link
          href={`/blog/${post.slug}`}
          className="mt-auto pt-4 text-sm font-medium text-[#065F46] hover:underline"
        >
          {t("readArticle")}
        </Link>
      </div>
    </article>
  );
}
