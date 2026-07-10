import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function MarketingHeader() {
  const t = await getTranslations("marketing");
  const common = await getTranslations("common");

  return (
    <header className="sticky top-0 z-20 border-b border-[#E4DFD3]/80 bg-[#FBF9F4]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-marketing-display)] text-2xl font-semibold text-[#065F46]"
        >
          {common("appName")}
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-5">
          <Link href="/blog" className="text-[#1C1B1A]/70 transition hover:text-[#065F46]">
            {t("blog")}
          </Link>
          <Link href="/pricing" className="text-[#1C1B1A]/70 transition hover:text-[#065F46]">
            {t("pricing")}
          </Link>
          <Link href="/faq" className="hidden text-[#1C1B1A]/70 transition hover:text-[#065F46] sm:inline">
            {t("faq")}
          </Link>
          <Link href="/support" className="text-[#1C1B1A]/70 transition hover:text-[#065F46]">
            {t("support")}
          </Link>
          <LocaleSwitcher />
          <Link href="/login" className="hidden text-[#1C1B1A]/70 transition hover:text-[#065F46] sm:inline">
            {t("login")}
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-[#065F46] px-4 py-2 font-medium text-white transition hover:bg-[#054d3a]"
          >
            {t("startFree")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
