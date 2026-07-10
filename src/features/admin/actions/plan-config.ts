"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PlanConfigModel } from "@/models/plan-config";
import { PLAN_CONFIG_TAG } from "@/features/subscriptions/plan-config-data";
import { PLAN_FLAG_KEYS } from "@/features/subscriptions/default-plans";
import { isPlanId, type PlanId } from "@/features/subscriptions/plans";

function parseFeatures(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function createPlanConfigSchema() {
  const flagsShape = Object.fromEntries(
    PLAN_FLAG_KEYS.map((key) => [key, z.coerce.boolean()]),
  ) as Record<(typeof PLAN_FLAG_KEYS)[number], z.ZodBoolean>;

  return z.object({
    planId: z.string().refine(isPlanId, "Invalid plan"),
    priceYearly: z.coerce.number().min(0),
    maxWorkspaces: z.coerce.number().int().min(-1),
    maxMembers: z.coerce.number().int().min(-1),
    highlighted: z.coerce.boolean(),
    available: z.coerce.boolean(),
    sortOrder: z.coerce.number().int().min(0).max(99),
    nameAr: z.string().trim().min(1).max(80),
    nameEn: z.string().trim().min(1).max(80),
    priceDisplayAr: z.string().trim().min(1).max(40),
    priceDisplayEn: z.string().trim().min(1).max(40),
    periodDisplayAr: z.string().trim().min(1).max(40),
    periodDisplayEn: z.string().trim().min(1).max(40),
    descriptionAr: z.string().trim().min(1).max(500),
    descriptionEn: z.string().trim().min(1).max(500),
    featuresAr: z.array(z.string().min(1).max(120)).max(20),
    featuresEn: z.array(z.string().min(1).max(120)).max(20),
    ctaAr: z.string().trim().min(1).max(60),
    ctaEn: z.string().trim().min(1).max(60),
    flags: z.object(flagsShape),
  });
}

export type UpdatePlanConfigState = { error: string | null; success: boolean };

export async function updatePlanConfigAction(
  _prev: UpdatePlanConfigState,
  formData: FormData,
): Promise<UpdatePlanConfigState> {
  const admin = await requireAdmin();
  const tErrors = await getTranslations("admin.errors");

  const flags = Object.fromEntries(
    PLAN_FLAG_KEYS.map((key) => [key, formData.get(`flag_${key}`) === "on"]),
  );

  const schema = createPlanConfigSchema();
  const parsed = schema.safeParse({
    planId: formData.get("planId"),
    priceYearly: formData.get("priceYearly"),
    maxWorkspaces: formData.get("maxWorkspaces"),
    maxMembers: formData.get("maxMembers"),
    highlighted: formData.get("highlighted") === "on",
    available: formData.get("available") === "on",
    sortOrder: formData.get("sortOrder"),
    nameAr: formData.get("nameAr"),
    nameEn: formData.get("nameEn"),
    priceDisplayAr: formData.get("priceDisplayAr"),
    priceDisplayEn: formData.get("priceDisplayEn"),
    periodDisplayAr: formData.get("periodDisplayAr"),
    periodDisplayEn: formData.get("periodDisplayEn"),
    descriptionAr: formData.get("descriptionAr"),
    descriptionEn: formData.get("descriptionEn"),
    featuresAr: parseFeatures(formData.get("featuresAr")),
    featuresEn: parseFeatures(formData.get("featuresEn")),
    ctaAr: formData.get("ctaAr"),
    ctaEn: formData.get("ctaEn"),
    flags,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? tErrors("invalidData"),
      success: false,
    };
  }

  const data = parsed.data;

  try {
    await connectToDatabase();
    await PlanConfigModel.findOneAndUpdate(
      { planId: data.planId },
      {
        ...data,
        updatedBy: admin.user.email,
      },
      { upsert: true, returnDocument: "after" },
    );

    revalidateTag(PLAN_CONFIG_TAG, "max");
    revalidatePath("/admin/plans");
    revalidatePath("/pricing");
    revalidatePath("/dashboard/plan");

    return { error: null, success: true };
  } catch (error) {
    console.error("[admin] update plan config failed:", error);
    return { error: tErrors("saveFailed"), success: false };
  }
}

export async function resetPlanConfigAction(planId: PlanId): Promise<UpdatePlanConfigState> {
  await requireAdmin();
  const tErrors = await getTranslations("admin.errors");

  if (!isPlanId(planId)) {
    return { error: tErrors("invalidData"), success: false };
  }

  try {
    await connectToDatabase();
    await PlanConfigModel.deleteOne({ planId });

    revalidateTag(PLAN_CONFIG_TAG, "max");
    revalidatePath("/admin/plans");
    revalidatePath("/pricing");

    return { error: null, success: true };
  } catch (error) {
    console.error("[admin] reset plan config failed:", error);
    return { error: tErrors("saveFailed"), success: false };
  }
}
