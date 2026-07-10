"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { isPlanId, type PlanId } from "@/features/subscriptions/plans";
import {
  cancelUserSubscription,
  reactivateUserAccount,
  setUserPlan,
  suspendUserAccount,
} from "@/features/subscriptions/data";

export type UserSubscriptionActionState = {
  error: string | null;
  success: boolean;
};

export async function updateUserPlanAction(
  userId: string,
  plan: string,
): Promise<UserSubscriptionActionState> {
  const session = await requireAdmin();
  const t = await getTranslations("admin.errors");

  if (!isPlanId(plan)) {
    return { error: t("invalidPlan"), success: false };
  }

  if (userId === session.user.id && plan !== "plus") {
    // Admin can downgrade themselves but warn - actually allow it
  }

  try {
    await setUserPlan(userId, plan as PlanId, { adminEmail: session.user.email });
    revalidatePath("/admin/users");
    return { error: null, success: true };
  } catch {
    return { error: t("updatePlanFailed"), success: false };
  }
}

export async function cancelUserSubscriptionAction(
  userId: string,
): Promise<UserSubscriptionActionState> {
  const session = await requireAdmin();
  const t = await getTranslations("admin.errors");

  try {
    await cancelUserSubscription(userId, session.user.email);
    revalidatePath("/admin/users");
    return { error: null, success: true };
  } catch {
    return { error: t("cancelFailed"), success: false };
  }
}

export async function suspendUserAction(userId: string): Promise<UserSubscriptionActionState> {
  const session = await requireAdmin();
  const t = await getTranslations("admin.errors");

  if (userId === session.user.id) {
    return { error: t("cannotSuspendSelf"), success: false };
  }

  try {
    await suspendUserAccount(userId, session.user.email);
    revalidatePath("/admin/users");
    return { error: null, success: true };
  } catch {
    return { error: t("suspendFailed"), success: false };
  }
}

export async function reactivateUserAction(
  userId: string,
  plan: string,
): Promise<UserSubscriptionActionState> {
  const session = await requireAdmin();
  const t = await getTranslations("admin.errors");

  if (!isPlanId(plan)) {
    return { error: t("invalidPlan"), success: false };
  }

  try {
    await reactivateUserAccount(userId, session.user.email, plan as PlanId);
    revalidatePath("/admin/users");
    return { error: null, success: true };
  } catch {
    return { error: t("reactivateFailed"), success: false };
  }
}
