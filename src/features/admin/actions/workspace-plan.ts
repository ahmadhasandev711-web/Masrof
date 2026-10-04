"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { isPlanId, type PlanId } from "@/features/subscriptions/plans";
import { setWorkspacePlan } from "@/features/subscriptions/data";

export type WorkspacePlanActionState = {
  error: string | null;
  success: boolean;
};

export async function updateAdminWorkspacePlanAction(
  workspaceId: string,
  plan: string,
  options: {
    durationMonths?: number;
    extendDays?: number;
    customDateString?: string;
    extendFromCurrent?: boolean;
  } = {},
): Promise<WorkspacePlanActionState> {
  const session = await requireAdmin();
  const t = await getTranslations("admin.errors");

  if (!isPlanId(plan)) {
    return { error: t("invalidPlan"), success: false };
  }

  const {
    durationMonths = 1,
    extendDays,
    customDateString,
    extendFromCurrent = false,
  } = options;

  try {
    let expiresAt: Date | null = null;
    let notes = `تم التعديل بواسطة الأدمن ${session.user.email}`;

    if (plan !== "free") {
      if (customDateString) {
        expiresAt = new Date(customDateString);
        notes += ` (تاريخ مخصص: ${customDateString})`;
      } else if (extendDays) {
        let baseTime = Date.now();
        if (extendFromCurrent) {
          const { connectToDatabase } = await import("@/lib/db/mongoose");
          const { WorkspaceModel } = await import("@/models/workspace");
          await connectToDatabase();
          const existing = await WorkspaceModel.findById(workspaceId).select("planExpiresAt").lean();
          const currentExp = existing?.planExpiresAt ? new Date(existing.planExpiresAt).getTime() : 0;
          if (currentExp > Date.now()) {
            baseTime = currentExp;
          }
        }
        expiresAt = new Date(baseTime + extendDays * 24 * 60 * 60 * 1000);
        notes += ` (مهلة سماح: ${extendDays} يوم)`;
      } else {
        let baseTime = Date.now();
        if (extendFromCurrent) {
          const { connectToDatabase } = await import("@/lib/db/mongoose");
          const { WorkspaceModel } = await import("@/models/workspace");
          await connectToDatabase();
          const existing = await WorkspaceModel.findById(workspaceId).select("planExpiresAt").lean();
          const currentExp = existing?.planExpiresAt ? new Date(existing.planExpiresAt).getTime() : 0;
          if (currentExp > Date.now()) {
            baseTime = currentExp;
          }
        }
        expiresAt = new Date(baseTime + durationMonths * 30 * 24 * 60 * 60 * 1000);
        notes += ` (مدة: ${durationMonths} شهر)`;
      }
    }

    await setWorkspacePlan(workspaceId, plan as PlanId, {
      adminEmail: session.user.email,
      expiresAt,
      status: "active",
      notes,
    });

    revalidatePath("/admin/workspaces");
    revalidatePath(`/admin/workspaces/${workspaceId}`);
    revalidatePath("/admin/users");
    revalidatePath("/dashboard");
    return { error: null, success: true };
  } catch (error) {
    console.error("[admin] update workspace plan failed:", error);
    return { error: t("updatePlanFailed"), success: false };
  }
}

export async function toggleAdminWorkspaceSuspendAction(
  workspaceId: string,
  suspend: boolean,
): Promise<WorkspacePlanActionState> {
  const session = await requireAdmin();
  const t = await getTranslations("admin.errors");

  try {
    await setWorkspacePlan(workspaceId, suspend ? "free" : "pro", {
      adminEmail: session.user.email,
      status: suspend ? "suspended" : "active",
      notes: suspend ? "تم تعليق المساحة بواسطة الأدمن" : "تم فك التعليق بواسطة الأدمن",
    });

    revalidatePath("/admin/workspaces");
    revalidatePath(`/admin/workspaces/${workspaceId}`);
    revalidatePath("/admin/users");
    revalidatePath("/dashboard");
    return { error: null, success: true };
  } catch {
    return { error: suspend ? t("suspendFailed") : t("reactivateFailed"), success: false };
  }
}
