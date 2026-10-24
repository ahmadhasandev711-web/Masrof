import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MarketingHeader } from "@/features/marketing/components/marketing-header";
import { AdSenseScript } from "@/features/marketing/components/adsense-script";
import "@fontsource/markazi-text/500.css";
import "@fontsource/markazi-text/600.css";
import "@fontsource/markazi-text/700.css";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("marketing");
  const common = await getTranslations("common");

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F4] text-[#1C1B1A]">
      <AdSenseScript />
      <MarketingHeader />

      <main className="flex-1">{children}</main>

      <footer className="mt-auto border-t border-[#E4DFD3] bg-white/70">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Column 1: Brand Info */}
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 font-[family-name:var(--font-marketing-display)] text-2xl font-bold text-[#065F46]"
              >
                <Image
                  src="/icons/brand-logo.png"
                  alt={common("appName")}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain drop-shadow-xs"
                />
                <span>{common("appName")}</span>
              </Link>
              <p className="text-xs leading-relaxed text-neutral-600">
                {t("footerSubtitle")}
              </p>
              <p className="mt-2 text-[11px] text-neutral-400">
                © {new Date().getFullYear()} {common("appName")}. {t("footerCopyright")}
              </p>
            </div>

            {/* Column 2: Platform */}
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                {t("footerPlatform")}
              </h4>
              <Link href="/pricing" prefetch={false} className="text-xs text-neutral-600 transition hover:text-[#065F46]">
                {t("pricing")}
              </Link>
              <Link href="/register" prefetch={false} className="text-xs font-medium text-[#065F46] transition hover:underline">
                {t("startFree")}
              </Link>
              <Link href="/login" prefetch={false} className="text-xs text-neutral-600 transition hover:text-[#065F46]">
                {t("login")}
              </Link>
            </div>

            {/* Column 3: Resources */}
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                {t("footerResources")}
              </h4>
              <Link href="/blog" prefetch={false} className="text-xs text-neutral-600 transition hover:text-[#065F46]">
                {t("blog")}
              </Link>
              <Link href="/faq" prefetch={false} className="text-xs text-neutral-600 transition hover:text-[#065F46]">
                {t("faq")}
              </Link>
              <Link href="/support" prefetch={false} className="text-xs text-neutral-600 transition hover:text-[#065F46]">
                {t("support")}
              </Link>
            </div>

            {/* Column 4: Legal & Trust */}
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                {t("footerLegal")}
              </h4>
              <Link href="/privacy" prefetch={false} className="text-xs text-neutral-600 transition hover:text-[#065F46]">
                {t("privacy")}
              </Link>
              <Link href="/terms" prefetch={false} className="text-xs text-neutral-600 transition hover:text-[#065F46]">
                {t("terms")}
              </Link>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                <span>🛡️</span>
                <span>{t("footerSecurityBadge")}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
