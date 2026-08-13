import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAllLocalizedPlans } from "@/i18n/plans-localized";
import { getPricingPlansOrdered } from "@/features/subscriptions/plan-config-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.pricingPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PricingPage() {
  const [t, plans, planOrder] = await Promise.all([
    getTranslations("marketing.pricingPage"),
    getAllLocalizedPlans(),
    getPricingPlansOrdered(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="max-w-2xl text-center lg:mx-auto">
        <p className="text-sm font-medium text-[#065F46]">{t("eyebrow")}</p>
        <h1 className="mt-2 font-[family-name:var(--font-marketing-display)] text-4xl font-semibold text-[#1C1B1A]">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-[#1C1B1A]/65">{t("subtitle")}</p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:mx-auto lg:max-w-3xl">
        {planOrder.map((planId) => {
          const plan = plans[planId];
          return (
            <article
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-6 ${
                plan.highlighted
                  ? "border-[#065F46] bg-[#ECFDF5]/40 shadow-md shadow-[#065F46]/10"
                  : "border-[#E4DFD3] bg-white"
              }`}
            >
              <h2 className="text-lg font-semibold text-[#1C1B1A]">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold text-[#065F46]">
                {plan.priceDisplay}
                <span className="text-sm font-normal text-[#1C1B1A]/50"> {plan.periodDisplay}</span>
              </p>
              <p className="mt-3 text-sm text-[#1C1B1A]/65">{plan.description}</p>
              <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-[#1C1B1A]/80">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-[#065F46]">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.available ? "/register" : "/support"}
                className={`mt-8 block rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${
                  plan.highlighted
                    ? "bg-[#065F46] text-white hover:bg-[#054d3a]"
                    : "border border-[#065F46]/30 bg-white text-[#065F46] hover:bg-[#ECFDF5]"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          );
        })}
      </div>

      <p className="mt-10 text-center text-sm text-[#1C1B1A]/50">
        {t("upgradeNote")}{" "}
        <Link href="/support" className="font-medium text-[#065F46] hover:underline">
          {t("contactUs")}
        </Link>
        {" "}
        {t("paymentNote")}
      </p>
    </div>
  );
}
