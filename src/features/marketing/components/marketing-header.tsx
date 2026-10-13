import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MarketingMobileNav } from "@/features/marketing/components/marketing-mobile-nav";

export async function MarketingHeader() {
  const t = await getTranslations("marketing");
  const common = await getTranslations("common");
  const nav = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-20 border-b border-[#E4DFD3]/80 bg-[#FBF9F4]/90 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 min-w-0 truncate font-[family-name:var(--font-marketing-display)] text-xl font-semibold text-[#065F46] sm:text-2xl"
        >
          <Image
            src="/icons/brand-logo.png"
            alt={common("appName")}
            width={32}
            height={32}
            className="h-8 w-8 object-contain shrink-0 drop-shadow-sm"
          />
          <span>{common("appName")}</span>
        </Link>
        <MarketingMobileNav
          appName={common("appName")}
          blog={t("blog")}
          pricing={t("pricing")}
          faq={t("faq")}
          support={t("support")}
          login={t("login")}
          startFree={t("startFree")}
          menuLabel={nav("openMenu")}
          closeMenu={nav("closeMenu")}
        />
      </div>
    </header>
  );
}
