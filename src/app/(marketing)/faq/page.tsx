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
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium text-[#065F46]">{t("eyebrow")}</p>
      <h1 className="mt-2 font-[family-name:var(--font-marketing-display)] text-4xl font-semibold text-[#1C1B1A]">
        {t("title")}
      </h1>
      <p className="mt-3 text-lg text-[#1C1B1A]/65">
        {t("contactHint")}{" "}
        <Link href="/support" className="font-medium text-[#065F46] hover:underline">
          {t("contactLink")}
        </Link>
        .
      </p>

      <dl className="mt-10 flex flex-col gap-4">
        {faqItems.map((item) => (
          <div key={item.question} className="rounded-2xl border border-[#E4DFD3] bg-white p-5">
            <dt className="font-semibold text-[#1C1B1A]">{item.question}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-[#1C1B1A]/70">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
