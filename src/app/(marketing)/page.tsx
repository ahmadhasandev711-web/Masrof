import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { LedgerCard } from "@/features/marketing/components/ledger-card";
import { BlogPostCard } from "@/features/blog/components/blog-post-card";
import { NewsletterForm } from "@/features/marketing/components/newsletter-form";
import { TestimonialsSection } from "@/features/marketing/components/testimonials-section";
import { listLatestPublishedPosts } from "@/features/blog/data";
import { getLocalizedHomepageContent } from "@/i18n/content";

export const dynamic = "force-dynamic";

export default async function MarketingHomePage() {
  const tPages = await getTranslations("pages");
  const locale = (await getLocale()) as AppLocale;
  const [content, latestPosts] = await Promise.all([
    getLocalizedHomepageContent(),
    listLatestPublishedPosts(locale, 3),
  ]);

  const heroLines = content.heroTitle.split("\n");

  return (
    <>
      <section className="relative overflow-hidden border-b border-[#E4DFD3]/60 bg-gradient-to-bl from-[#ECFDF5]/70 via-[#FBF9F4] to-[#FBF9F4]">
        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#065F46]/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-[#D97706]/5 blur-3xl" />

        <div className="relative mx-auto grid max-w-5xl gap-12 px-6 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 inline-block rounded-full border border-[#065F46]/15 bg-white/70 px-3 py-1 text-sm font-medium text-[#065F46]">
              {content.heroBadge}
            </p>
            <h1 className="font-[family-name:var(--font-marketing-display)] text-4xl leading-[1.15] font-semibold text-[#1C1B1A] sm:text-5xl">
              {heroLines.map((line, index) => (
                <span key={index}>
                  {line}
                  {index < heroLines.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[#1C1B1A]/70">
              {content.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="rounded-lg bg-[#065F46] px-6 py-3 font-medium text-white shadow-sm shadow-[#065F46]/20 transition hover:bg-[#054d3a]"
              >
                {content.heroCtaPrimary}
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-[#1C1B1A]/70 underline decoration-[#E4DFD3] underline-offset-4 transition hover:text-[#065F46]"
              >
                {content.heroCtaSecondary}
              </Link>
            </div>
          </div>

          <LedgerCard />
        </div>
      </section>

      <section className="border-b border-[#E4DFD3]/60 bg-white/50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="font-[family-name:var(--font-marketing-display)] text-2xl font-semibold text-[#1C1B1A] sm:text-3xl">
            {content.stepsTitle}
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {content.steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-[#E4DFD3] bg-white p-5 transition hover:border-[#065F46]/20 hover:shadow-md"
              >
                <span className="font-[family-name:var(--font-mono)] text-sm text-[#065F46]/60">
                  {step.number}
                </span>
                <h3 className="mt-2 font-medium text-[#1C1B1A]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#1C1B1A]/60">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {latestPosts.length > 0 && (
        <section className="border-b border-[#E4DFD3]/60">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-marketing-display)] text-2xl font-semibold text-[#1C1B1A]">
                  {content.blogTitle}
                </h2>
                <p className="mt-2 text-[#1C1B1A]/60">{content.blogSubtitle}</p>
              </div>
              <Link href="/blog" className="text-sm font-medium text-[#065F46] hover:underline">
                {tPages("blog.allPosts")}
              </Link>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {latestPosts.map((post, index) => (
                <BlogPostCard key={post.slug} post={post} compact accentIndex={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-b border-[#E4DFD3]/60 bg-[#F3F0E8]/40">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-marketing-display)] text-2xl font-semibold text-[#1C1B1A]">
              {content.newsletterTitle}
            </h2>
            <p className="mt-3 text-[#1C1B1A]/65">{content.newsletterSubtitle}</p>
          </div>
          <NewsletterForm variant="inline" />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="rounded-3xl border border-[#065F46]/10 bg-gradient-to-b from-[#ECFDF5]/60 to-white px-6 py-12 sm:px-10">
          <h2 className="font-[family-name:var(--font-marketing-display)] text-2xl font-semibold text-[#1C1B1A] sm:text-3xl">
            {content.finalCtaTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[#1C1B1A]/60">{content.finalCtaSubtitle}</p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-lg bg-[#065F46] px-6 py-3 font-medium text-white shadow-sm shadow-[#065F46]/20 transition hover:bg-[#054d3a]"
          >
            {content.finalCtaButton}
          </Link>
        </div>
      </section>
    </>
  );
}
