import { describe, expect, it } from "vitest";
import arDashboard from "@/i18n/messages/ar/dashboard";
import arFaq from "@/i18n/messages/ar/faq";
import arForms from "@/i18n/messages/ar/forms";
import arHomepage from "@/i18n/messages/ar/homepage";
import arMarketing from "@/i18n/messages/ar/marketing";
import arPlans from "@/i18n/messages/ar/plans";
import enDashboard from "@/i18n/messages/en/dashboard";
import enFaq from "@/i18n/messages/en/faq";
import enForms from "@/i18n/messages/en/forms";
import enHomepage from "@/i18n/messages/en/homepage";
import enMarketing from "@/i18n/messages/en/marketing";
import enPlans from "@/i18n/messages/en/plans";
import { DEFAULT_PLAN_CONFIGS } from "@/features/subscriptions/default-plans";
import {
  PRO_MONTHLY_EGP,
  PRO_MONTHLY_USD,
  PRO_YEARLY_EGP,
  PRO_YEARLY_USD,
  proHomepageYearlyLine,
  proPricePhrase,
} from "@/features/subscriptions/pro-pricing";

const publishedCopy = [
  arDashboard,
  arFaq,
  arForms,
  arHomepage,
  arMarketing,
  arPlans,
  enDashboard,
  enFaq,
  enForms,
  enHomepage,
  enMarketing,
  enPlans,
];

describe("Pro public price", () => {
  it("bills 250 EGP or $5 per month, collected yearly with two months free", () => {
    expect(PRO_MONTHLY_EGP).toBe(250);
    expect(PRO_YEARLY_EGP).toBe(2_500);
    expect(PRO_MONTHLY_USD).toBe(5);
    expect(PRO_YEARLY_USD).toBe(50);
    expect(DEFAULT_PLAN_CONFIGS.pro.priceYearly).toBe(PRO_YEARLY_EGP);
    expect(DEFAULT_PLAN_CONFIGS.pro.priceDisplayAr).toBe("٢٥٠");
    expect(DEFAULT_PLAN_CONFIGS.pro.priceDisplayEn).toBe("250");
    expect(DEFAULT_PLAN_CONFIGS.pro.periodDisplayAr).toBe("ج.م / شهر");
    expect(DEFAULT_PLAN_CONFIGS.pro.featuresAr.at(-1)).toBe(proPricePhrase("ar"));
    expect(DEFAULT_PLAN_CONFIGS.pro.featuresEn.at(-1)).toBe(proPricePhrase("en"));
    expect(arHomepage.homepage.landing.pricing.pro.yearlyOption).toBe(proHomepageYearlyLine("ar"));
    expect(enHomepage.homepage.landing.pricing.pro.yearlyOption).toBe(proHomepageYearlyLine("en"));
    expect(arHomepage.homepage.landing.pricing.pro.price).toBe("٢٥٠");
    expect(enHomepage.homepage.landing.pricing.pro.price).toBe("250");
  });

  it("keeps retired prices out of the published copy", () => {
    const serialized = JSON.stringify(publishedCopy);
    expect(serialized).not.toContain("$10");
    expect(serialized).not.toContain("$48");
    expect(serialized).not.toContain("500 EGP/year");
    expect(serialized).not.toContain("٥٠٠ ج.م/");
    expect(serialized).not.toContain("٤٨ دولار");
  });
});
