import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NewsletterForm } from "@/features/marketing/components/newsletter-form";
import { MarketingHeader } from "@/features/marketing/components/marketing-header";
import { getLocalizedHomepageContent } from "@/i18n/content";
import { AdSenseScript } from "@/features/marketing/components/adsense-script";
import "@fontsource/markazi-text/500.css";
import "@fontsource/markazi-text/600.css";
import "@fontsource/markazi-text/700.css";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const content = await getLocalizedHomepageContent();
  const t = await getTranslations("marketing");
  const common = await getTranslations("common");

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F4] text-[#1C1B1A]">
      <AdSenseScript />
      <MarketingHeader />

      <main className="flex-1">{children}</main>

      <footer className="mt-auto border-t border-[#E4DFD3] bg-[#F3F0E8]/30">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <section className="rounded-2xl border border-[#E4DFD3] bg-white p-6 sm:p-8">
            <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-10">
              <div>
                <p className="text-sm font-medium text-[#065F46]">{t("newsletterEyebrow")}</p>
                <h2 className="mt-1 font-[family-name:var(--font-marketing-display)] text-xl font-semibold text-[#1C1B1A] sm:text-2xl">
                  {content.footerNewsletterTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#1C1B1A]/60">
                  {content.footerNewsletterSubtitle}
                </p>
              </div>
              <NewsletterForm variant="inline" />
            </div>
          </section>

          <div className="mt-8 flex flex-col gap-4 border-t border-[#E4DFD3]/80 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className="font-[family-name:var(--font-marketing-display)] text-lg font-semibold text-[#065F46]"
              >
                {common("appName")}
              </Link>
              <p className="text-sm text-[#1C1B1A]/55">
                © {new Date().getFullYear()} {common("appName")}
              </p>
            </div>

            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#1C1B1A]/65">
              <Link href="/blog" prefetch={false} className="transition hover:text-[#065F46]">
                {t("blog")}
              </Link>
              <Link href="/pricing" prefetch={false} className="transition hover:text-[#065F46]">
                {t("pricing")}
              </Link>
              <Link href="/faq" prefetch={false} className="transition hover:text-[#065F46]">
                {t("faq")}
              </Link>
              <Link href="/support" prefetch={false} className="transition hover:text-[#065F46]">
                {t("support")}
              </Link>
              <Link href="/privacy" prefetch={false} className="transition hover:text-[#065F46]">
                {t("privacy")}
              </Link>
              <Link href="/terms" prefetch={false} className="transition hover:text-[#065F46]">
                {t("terms")}
              </Link>
              <Link href="/login" prefetch={false} className="transition hover:text-[#065F46]">
                {t("login")}
              </Link>
              <Link
                href="/register"
                prefetch={false}
                className="font-medium text-[#065F46] transition hover:underline"
              >
                {t("startFree")}
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
