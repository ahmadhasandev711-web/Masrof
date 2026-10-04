import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getLocalizedFaqItems } from "@/i18n/content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.faqPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function FaqPage() {
  const [t, faqItems] = await Promise.all([
    getTranslations("marketing.faqPage"),
    getLocalizedFaqItems(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      {/* Header */}
      <div className="max-w-2xl text-center mx-auto mb-12">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-marketing-display)] text-3xl font-bold text-neutral-900 sm:text-4xl lg:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-base text-neutral-600 sm:text-lg">
          {t("contactHint")}{" "}
          <Link href="/support" className="font-semibold text-emerald-800 hover:underline">
            {t("contactLink")}
          </Link>
          .
        </p>
      </div>

      {/* Accordion FAQ Items */}
      <div className="space-y-4 max-w-3xl mx-auto">
        {faqItems.map((item, idx) => (
          <details
            key={idx}
            open={idx === 0}
            className="group rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 transition hover:border-neutral-300 open:border-emerald-700/40 open:shadow-sm"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-bold text-neutral-900 text-base sm:text-lg list-none select-none">
              <span>{item.question}</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition group-open:rotate-180 group-open:bg-emerald-100 group-open:text-emerald-800">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <div className="mt-4 border-t border-neutral-100 pt-4 text-sm leading-relaxed text-neutral-600">
              <p>{item.answer}</p>
            </div>
          </details>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-14 rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center max-w-2xl mx-auto">
        <h3 className="font-bold text-lg text-neutral-900">
          لم تجد إجابة لسؤالك؟
        </h3>
        <p className="mt-2 text-xs text-neutral-600">
          فريق دعم سندات متاح يومياً لمساعدتك والإجابة على أي استفسار فني أو مالي.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            href="/support"
            className="rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-900"
          >
            تواصل مع الدعم الفني
          </Link>
        </div>
      </div>
    </div>
  );
}
