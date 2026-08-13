import "server-only";

import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PlanConfigModel } from "@/models/plan-config";
import { toPlain } from "@/lib/db/plain";
import {
  DEFAULT_PLAN_CONFIGS,
  PLAN_FLAG_KEYS,
  PLAN_LIMITS_VERSION,
  PLAN_QUANTITY_LIMIT_KEYS,
  isUnlimitedQuantity,
  type PlanConfigDocument,
  type PlanFlags,
  type PlanQuantityLimitKey,
} from "@/features/subscriptions/default-plans";
import {
  PLAN_IDS,
  PRICING_PLANS_ORDER,
  type PlanDefinition,
  type PlanFeature,
  type PlanId,
} from "@/features/subscriptions/plans";

export const PLAN_CONFIG_TAG = "plan-config";

function mergeWithDefaults(doc: Partial<PlanConfigDocument> | null, planId: PlanId): PlanConfigDocument {
  const defaults = DEFAULT_PLAN_CONFIGS[planId];
  if (!doc) return { ...defaults };

  const flags = { ...defaults.flags };
  if (doc.flags) {
    for (const key of PLAN_FLAG_KEYS) {
      if (typeof doc.flags[key] === "boolean") {
        flags[key] = doc.flags[key]!;
      }
    }
  }

  return {
    planId,
    priceYearly: doc.priceYearly ?? defaults.priceYearly,
    maxWorkspaces: doc.maxWorkspaces ?? defaults.maxWorkspaces,
    maxMembers: doc.maxMembers ?? defaults.maxMembers,
    maxInvoicesPerMonth: doc.maxInvoicesPerMonth ?? defaults.maxInvoicesPerMonth,
    maxClients: doc.maxClients ?? defaults.maxClients,
    maxActiveProjects: doc.maxActiveProjects ?? defaults.maxActiveProjects,
    maxSavingsGoals: doc.maxSavingsGoals ?? defaults.maxSavingsGoals,
    maxRecurringExpenses: doc.maxRecurringExpenses ?? defaults.maxRecurringExpenses,
    limitsVersion: doc.limitsVersion ?? defaults.limitsVersion,
    highlighted: doc.highlighted ?? defaults.highlighted,
    available: doc.available ?? defaults.available,
    sortOrder: doc.sortOrder ?? defaults.sortOrder,
    nameAr: doc.nameAr ?? defaults.nameAr,
    nameEn: doc.nameEn ?? defaults.nameEn,
    priceDisplayAr: doc.priceDisplayAr ?? defaults.priceDisplayAr,
    priceDisplayEn: doc.priceDisplayEn ?? defaults.priceDisplayEn,
    periodDisplayAr: doc.periodDisplayAr ?? defaults.periodDisplayAr,
    periodDisplayEn: doc.periodDisplayEn ?? defaults.periodDisplayEn,
    descriptionAr: doc.descriptionAr ?? defaults.descriptionAr,
    descriptionEn: doc.descriptionEn ?? defaults.descriptionEn,
    featuresAr: doc.featuresAr?.length ? doc.featuresAr : defaults.featuresAr,
    featuresEn: doc.featuresEn?.length ? doc.featuresEn : defaults.featuresEn,
    ctaAr: doc.ctaAr ?? defaults.ctaAr,
    ctaEn: doc.ctaEn ?? defaults.ctaEn,
    flags,
    updatedBy: doc.updatedBy ?? null,
  };
}

function docToPlain(doc: Record<string, unknown>, planId: PlanId): PlanConfigDocument {
  return mergeWithDefaults(
    toPlain({
      planId: doc.planId,
      priceYearly: doc.priceYearly,
      maxWorkspaces: doc.maxWorkspaces,
      maxMembers: doc.maxMembers,
      maxInvoicesPerMonth: doc.maxInvoicesPerMonth,
      maxClients: doc.maxClients,
      maxActiveProjects: doc.maxActiveProjects,
      maxSavingsGoals: doc.maxSavingsGoals,
      maxRecurringExpenses: doc.maxRecurringExpenses,
      limitsVersion: doc.limitsVersion,
      highlighted: doc.highlighted,
      available: doc.available,
      sortOrder: doc.sortOrder,
      nameAr: doc.nameAr,
      nameEn: doc.nameEn,
      priceDisplayAr: doc.priceDisplayAr,
      priceDisplayEn: doc.priceDisplayEn,
      periodDisplayAr: doc.periodDisplayAr,
      periodDisplayEn: doc.periodDisplayEn,
      descriptionAr: doc.descriptionAr,
      descriptionEn: doc.descriptionEn,
      featuresAr: doc.featuresAr,
      featuresEn: doc.featuresEn,
      ctaAr: doc.ctaAr,
      ctaEn: doc.ctaEn,
      flags: doc.flags,
      updatedBy: doc.updatedBy,
    }) as Partial<PlanConfigDocument>,
    planId,
  );
}

async function fetchAllPlanConfigs(): Promise<Record<PlanId, PlanConfigDocument>> {
  await ensurePlanConfigsExist();
  await connectToDatabase();

  const docs = await PlanConfigModel.find({ planId: { $in: PLAN_IDS } }).lean();
  const byId = new Map(docs.map((doc) => [String(doc.planId), doc]));

  const result = {} as Record<PlanId, PlanConfigDocument>;
  for (const planId of PLAN_IDS) {
    const doc = byId.get(planId);
    result[planId] = doc ? docToPlain(doc as Record<string, unknown>, planId) : mergeWithDefaults(null, planId);
  }

  return result;
}

/** One-time sync when freemium limits model changes. */
async function migratePlanConfigsToCurrentLimitsVersion() {
  await connectToDatabase();

  for (const planId of PLAN_IDS) {
    const defaults = DEFAULT_PLAN_CONFIGS[planId];
    await PlanConfigModel.updateOne(
      {
        planId,
        $or: [{ limitsVersion: { $exists: false } }, { limitsVersion: { $lt: PLAN_LIMITS_VERSION } }],
      },
      {
        $set: {
          flags: defaults.flags,
          maxWorkspaces: defaults.maxWorkspaces,
          maxMembers: defaults.maxMembers,
          maxInvoicesPerMonth: defaults.maxInvoicesPerMonth,
          maxClients: defaults.maxClients,
          maxActiveProjects: defaults.maxActiveProjects,
          maxSavingsGoals: defaults.maxSavingsGoals,
          maxRecurringExpenses: defaults.maxRecurringExpenses,
          priceYearly: defaults.priceYearly,
          priceDisplayAr: defaults.priceDisplayAr,
          priceDisplayEn: defaults.priceDisplayEn,
          periodDisplayAr: defaults.periodDisplayAr,
          periodDisplayEn: defaults.periodDisplayEn,
          descriptionAr: defaults.descriptionAr,
          descriptionEn: defaults.descriptionEn,
          featuresAr: defaults.featuresAr,
          featuresEn: defaults.featuresEn,
          ctaAr: defaults.ctaAr,
          ctaEn: defaults.ctaEn,
          nameAr: defaults.nameAr,
          nameEn: defaults.nameEn,
          highlighted: defaults.highlighted,
          available: defaults.available,
          sortOrder: defaults.sortOrder,
          limitsVersion: PLAN_LIMITS_VERSION,
          updatedBy: "system-limits-v2",
        },
      },
    );
  }
}

async function ensurePlanConfigsExist() {
  await connectToDatabase();
  const existing = await PlanConfigModel.find({ planId: { $in: PLAN_IDS } }).select("planId").lean();
  const existingIds = new Set(existing.map((row) => String(row.planId)));

  const missing = PLAN_IDS.filter((id) => !existingIds.has(id));
  if (missing.length > 0) {
    await PlanConfigModel.insertMany(
      missing.map((planId) => ({
        ...DEFAULT_PLAN_CONFIGS[planId],
        updatedBy: "system-seed",
      })),
    );
  }

  await migratePlanConfigsToCurrentLimitsVersion();
}

const getCachedPlanConfigs = unstable_cache(fetchAllPlanConfigs, ["plan-config-all"], {
  revalidate: 60,
  tags: [PLAN_CONFIG_TAG],
});

export async function getAllPlanConfigs(): Promise<Record<PlanId, PlanConfigDocument>> {
  try {
    return getCachedPlanConfigs();
  } catch (error) {
    console.error("[plan-config] load failed, using defaults:", error);
    return {
      free: mergeWithDefaults(null, "free"),
      pro: mergeWithDefaults(null, "pro"),
      plus: mergeWithDefaults(null, "plus"),
    };
  }
}

export async function getPlanConfig(planId: PlanId): Promise<PlanConfigDocument> {
  const all = await getAllPlanConfigs();
  return all[planId];
}

export function configToPlanDefinition(config: PlanConfigDocument): PlanDefinition {
  return {
    id: config.planId,
    nameAr: config.nameAr,
    priceYearly: config.priceYearly,
    priceDisplay: config.priceDisplayAr,
    periodDisplay: config.periodDisplayAr,
    description: config.descriptionAr,
    features: config.featuresAr,
    maxWorkspaces: config.maxWorkspaces,
    highlighted: config.highlighted,
    cta: config.ctaAr,
    available: config.available,
    ...config.flags,
  };
}

export type LocalizedPlanView = PlanDefinition & {
  name: string;
  features: string[];
};

export async function getLocalizedPlanFromConfig(
  planId: PlanId,
  locale: "ar" | "en",
): Promise<LocalizedPlanView> {
  const config = await getPlanConfig(planId);
  const isEn = locale === "en";

  return {
    id: config.planId,
    nameAr: config.nameAr,
    name: isEn ? config.nameEn : config.nameAr,
    priceYearly: config.priceYearly,
    priceDisplay: isEn ? config.priceDisplayEn : config.priceDisplayAr,
    periodDisplay: isEn ? config.periodDisplayEn : config.periodDisplayAr,
    description: isEn ? config.descriptionEn : config.descriptionAr,
    features: isEn ? config.featuresEn : config.featuresAr,
    maxWorkspaces: config.maxWorkspaces,
    highlighted: config.highlighted,
    cta: isEn ? config.ctaEn : config.ctaAr,
    available: config.available,
    ...config.flags,
  };
}

export async function getPlanDefinition(planId: PlanId): Promise<PlanDefinition> {
  const config = await getPlanConfig(planId);
  return configToPlanDefinition(config);
}

export async function planAllowsWorkspaces(planId: PlanId, currentCount: number): Promise<boolean> {
  const config = await getPlanConfig(planId);
  if (config.maxWorkspaces === -1) return true;
  return currentCount < config.maxWorkspaces;
}

export async function planAllowsMembers(planId: PlanId, currentCount: number): Promise<boolean> {
  const config = await getPlanConfig(planId);
  if (config.maxMembers === -1) return true;
  return currentCount < config.maxMembers;
}

export async function getMaxMembersForPlan(planId: PlanId): Promise<number> {
  const config = await getPlanConfig(planId);
  return config.maxMembers;
}

export async function getPlanQuantityLimit(
  planId: PlanId,
  limitKey: PlanQuantityLimitKey,
): Promise<number> {
  const config = await getPlanConfig(planId);
  return config[limitKey];
}

export async function planAllowsQuantity(
  planId: PlanId,
  limitKey: PlanQuantityLimitKey,
  currentCount: number,
): Promise<boolean> {
  const limit = await getPlanQuantityLimit(planId, limitKey);
  if (isUnlimitedQuantity(limit)) return true;
  return currentCount < limit;
}

export async function planHasFeature(planId: PlanId, feature: PlanFeature): Promise<boolean> {
  const config = await getPlanConfig(planId);
  return Boolean(config.flags[feature as keyof PlanFlags]);
}

export async function getPricingPlansOrdered(): Promise<PlanId[]> {
  const configs = await getAllPlanConfigs();
  return [...PRICING_PLANS_ORDER]
    .filter((id) => configs[id]?.available)
    .sort((a, b) => (configs[a]?.sortOrder ?? 0) - (configs[b]?.sortOrder ?? 0));
}

export async function getPlanConfigsForAdmin(): Promise<PlanConfigDocument[]> {
  await ensurePlanConfigsExist();
  const configs = await getAllPlanConfigs();
  return PRICING_PLANS_ORDER.map((id) => configs[id]);
}

export { PLAN_QUANTITY_LIMIT_KEYS };
