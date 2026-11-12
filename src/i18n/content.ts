import "server-only";

import { getLocale, getTranslations } from "next-intl/server";
import type { HomepageContent, HomepageStep } from "@/features/marketing/content/defaults";
import { getHomepageContent } from "@/features/marketing/content/data";
import { proPricePhrase } from "@/features/subscriptions/pro-pricing";
import type { AppLocale } from "./config";

export async function getLocalizedHomepageContent(): Promise<HomepageContent> {
  const locale = (await getLocale()) as AppLocale;
  if (locale === "ar") {
    return getHomepageContent();
  }

  const t = await getTranslations("homepage");
  const steps = t.raw("steps") as HomepageStep[];

  return {
    heroBadge: t("heroBadge"),
    heroTitle: t("heroTitle"),
    heroSubtitle: t("heroSubtitle"),
    heroCtaPrimary: t("heroCtaPrimary"),
    heroCtaSecondary: t("heroCtaSecondary"),
    stepsTitle: t("stepsTitle"),
    steps,
    blogTitle: t("blogTitle"),
    blogSubtitle: t("blogSubtitle"),
    newsletterTitle: t("newsletterTitle"),
    newsletterSubtitle: t("newsletterSubtitle"),
    finalCtaTitle: t("finalCtaTitle"),
    finalCtaSubtitle: t("finalCtaSubtitle"),
    finalCtaButton: t("finalCtaButton"),
    footerNewsletterTitle: t("footerNewsletterTitle"),
    footerNewsletterSubtitle: t("footerNewsletterSubtitle"),
  };
}

export type FaqItem = { question: string; answer: string };

export async function getLocalizedFaqItems(): Promise<FaqItem[]> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("faq");
  const proPrice = proPricePhrase(locale === "en" ? "en" : "ar");
  const items = t.raw("items") as FaqItem[];
  return items.map((item) => ({
    question: item.question,
    answer: item.answer.replaceAll("{proPrice}", proPrice),
  }));
}
