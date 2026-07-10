import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { SwitchLocaleButton } from "@/features/blog/components/switch-locale-button";

export async function PostLocaleUnavailable({
  alternateLocale,
  pathname,
}: {
  alternateLocale: AppLocale;
  pathname: string;
}) {
  const t = await getTranslations("pages.blog");
  const tLocale = await getTranslations("locale");

  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <p className="text-sm font-medium tracking-wide text-[#065F46]">{t("unavailableEyebrow")}</p>
      <h1 className="mt-3 font-[family-name:var(--font-marketing-display)] text-3xl font-semibold text-[#1C1B1A]">
        {t("unavailableTitle")}
      </h1>
      <p className="mt-4 text-[#1C1B1A]/65">{t("unavailableBody", { locale: tLocale(alternateLocale) })}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <SwitchLocaleButton locale={alternateLocale} pathname={pathname} />
        <Link
          href="/blog"
          className="rounded-lg border border-[#E4DFD3] bg-white px-4 py-2 text-sm font-medium text-[#065F46] hover:bg-[#F3F0E8]"
        >
          {t("allPosts")}
        </Link>
      </div>
    </div>
  );
}
