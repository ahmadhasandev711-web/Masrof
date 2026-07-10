import "server-only";

import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import {
  getAllPlanConfigs,
  getLocalizedPlanFromConfig,
  type LocalizedPlanView,
} from "@/features/subscriptions/plan-config-data";
import { getTranslations } from "next-intl/server";
import type { PlanFeature, PlanId } from "@/features/subscriptions/plans";

export type LocalizedPlan = LocalizedPlanView;

export async function getLocalizedPlan(planId: PlanId): Promise<LocalizedPlan> {
  const locale = (await getLocale()) as AppLocale;
  return getLocalizedPlanFromConfig(planId, locale === "en" ? "en" : "ar");
}

export async function getLocalizedPlanLabel(planId: PlanId): Promise<string> {
  const plan = await getLocalizedPlan(planId);
  return plan.name;
}

export async function getLocalizedPlanFeatureMessage(feature: PlanFeature): Promise<string> {
  const t = await getTranslations("plans");
  const key = `planFeature.${feature}` as Parameters<typeof t>[0];
  return t(key);
}

export async function getAllLocalizedPlans(): Promise<Record<PlanId, LocalizedPlan>> {
  const configs = await getAllPlanConfigs();
  const locale = (await getLocale()) as AppLocale;
  const lang = locale === "en" ? "en" : "ar";

  const entries = await Promise.all(
    (Object.keys(configs) as PlanId[]).map(async (id) => [
      id,
      await getLocalizedPlanFromConfig(id, lang),
    ] as const),
  );

  return Object.fromEntries(entries) as Record<PlanId, LocalizedPlan>;
}
