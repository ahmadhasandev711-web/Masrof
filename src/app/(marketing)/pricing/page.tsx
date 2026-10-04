import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getAllLocalizedPlans } from "@/i18n/plans-localized";
import { PricingTableClient } from "@/features/marketing/components/pricing-table-client";
import { getSupportConfig } from "@/lib/support";
import type { AppLocale } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("plans.pricing");
  return {
    title: t("metaTitle"),
    description: t("subtitle"),
  };
}

export default async function PricingPage() {
  const locale = (await getLocale()) as AppLocale;
  const isArabic = locale === "ar";
  const [tPricing, plans] = await Promise.all([
    getTranslations("plans.pricing"),
    getAllLocalizedPlans(),
  ]);

  const support = getSupportConfig(
    isArabic
      ? "مرحباً، أود الترقية إلى باقة برو على منصة سندات"
      : "Hi, I would like to upgrade to the Pro plan on Sanadat"
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <div className="max-w-3xl text-center mx-auto mb-12">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
          {tPricing("eyebrow")}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-marketing-display)] text-3xl font-bold text-neutral-900 sm:text-4xl lg:text-5xl">
          {tPricing("title")}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
          {tPricing("subtitle")}
        </p>
      </div>

      <PricingTableClient
        freePlan={plans.free}
        proPlan={plans.pro}
        yearlyPriceDisplay={tPricing("yearlyPriceDisplay")}
        yearlyPeriodDisplay={tPricing("yearlyPeriodDisplay")}
        billingMonthly={tPricing("billingMonthly")}
        billingYearly={tPricing("billingYearly")}
        yearlyDiscountBadge={tPricing("yearlyDiscountBadge")}
        featureMatrixTitle={tPricing("featureMatrixTitle")}
        featureMatrixSubtitle={tPricing("featureMatrixSubtitle")}
        freeForever={tPricing("freeForever")}
        proFullAccess={tPricing("proFullAccess")}
        unlimited={tPricing("unlimited")}
        included={tPricing("included")}
        notIncluded={tPricing("notIncluded")}
        matrix={{
          workspaces: tPricing("matrix.workspaces"),
          workspacesFree: tPricing("matrix.workspacesFree"),
          workspacesPro: tPricing("matrix.workspacesPro"),
          members: tPricing("matrix.members"),
          membersFree: tPricing("matrix.membersFree"),
          membersPro: tPricing("matrix.membersPro"),
          invoices: tPricing("matrix.invoices"),
          invoicesFree: tPricing("matrix.invoicesFree"),
          invoicesPro: tPricing("matrix.invoicesPro"),
          clients: tPricing("matrix.clients"),
          clientsFree: tPricing("matrix.clientsFree"),
          clientsPro: tPricing("matrix.clientsPro"),
          printing: tPricing("matrix.printing"),
          statements: tPricing("matrix.statements"),
          whatsappShare: tPricing("matrix.whatsappShare"),
          cashFlow: tPricing("matrix.cashFlow"),
          ocr: tPricing("matrix.ocr"),
          export: tPricing("matrix.export"),
          backup: tPricing("matrix.backup"),
          debts: tPricing("matrix.debts"),
          ads: tPricing("matrix.ads"),
          adsFree: tPricing("matrix.adsFree"),
          adsPro: tPricing("matrix.adsPro"),
        }}
        whatsappUrl={support.whatsappUrl}
        whatsappCta={isArabic ? "اشترك فوراً عبر واتساب" : "Instant WhatsApp Upgrade"}
        upgradeNote={tPricing("upgradeNote")}
        isArabic={isArabic}
      />
    </div>
  );
}
