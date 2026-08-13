import "server-only";

import { cache } from "react";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserSubscriptionModel } from "@/models/user-subscription";
import { type PlanId, type PlanFeature } from "@/features/subscriptions/plans";
import {
  getPlanConfig,
  getPlanQuantityLimit,
  planAllowsQuantity,
  planAllowsWorkspaces,
  planHasFeature,
} from "@/features/subscriptions/plan-config-data";
import type { PlanQuantityLimitKey } from "@/features/subscriptions/default-plans";
import { isUnlimitedQuantity } from "@/features/subscriptions/default-plans";
import { listWorkspacesForUser } from "@/features/workspaces/data";
import { countOwnedWorkspacesForUser } from "@/features/workspaces/members-data";
import {
  getLocalizedPlan,
  getLocalizedPlanFeatureMessage,
  getLocalizedQuantityLimitMessage,
} from "@/i18n/plans-localized";
import { getTranslations } from "next-intl/server";

export type UserSubscriptionView = {
  plan: PlanId;
  status: "active" | "cancelled" | "suspended";
  expiresAt: string | null;
  isSuspended: boolean;
};

export type WorkspaceSubscriptionContext = UserSubscriptionView & {
  /** True when the user is a member/viewer — features come from the workspace owner's plan. */
  isTeamMember: boolean;
  ownerId: string;
};

export class SubscriptionSuspendedError extends Error {
  constructor() {
    super("accountSuspended");
    this.name = "SubscriptionSuspendedError";
  }
}

function resolveEffectivePlan(
  plan: PlanId,
  status: string,
  expiresAt: Date | null | undefined,
): PlanId {
  if (status === "suspended") {
    return "free";
  }

  if (status === "cancelled") {
    return "free";
  }

  if (expiresAt && expiresAt.getTime() < Date.now()) {
    return "free";
  }

  return plan;
}

export const getUserSubscription = cache(async (userId: string): Promise<UserSubscriptionView> => {
  const fallback: UserSubscriptionView = {
    plan: "free",
    status: "active",
    expiresAt: null,
    isSuspended: false,
  };

  try {
    await connectToDatabase();
    const record = await UserSubscriptionModel.findOne({ userId }).lean();
    if (!record) {
      return fallback;
    }

    const effectivePlan = resolveEffectivePlan(
      record.plan as PlanId,
      record.status,
      record.expiresAt ?? null,
    );

    return {
      plan: effectivePlan,
      status: record.status as UserSubscriptionView["status"],
      expiresAt: record.expiresAt ? new Date(record.expiresAt).toISOString() : null,
      isSuspended: record.status === "suspended",
    };
  } catch (error) {
    console.error("[subscription] failed to load plan, using free:", error);
    return fallback;
  }
});

export async function assertUserNotSuspended(userId: string) {
  const subscription = await getUserSubscription(userId);
  if (subscription.isSuspended) {
    throw new SubscriptionSuspendedError();
  }
}

export async function assertCanCreateWorkspace(userId: string): Promise<string | null> {
  await assertUserNotSuspended(userId);

  const [subscription, ownedCount] = await Promise.all([
    getUserSubscription(userId),
    countOwnedWorkspacesForUser(userId),
  ]);

  if (!(await planAllowsWorkspaces(subscription.plan, ownedCount))) {
    const config = await getPlanConfig(subscription.plan);
    const limit = config.maxWorkspaces === -1 ? "∞" : String(config.maxWorkspaces);
    const [localizedPlan, tPlans] = await Promise.all([
      getLocalizedPlan(subscription.plan),
      getTranslations("plans"),
    ]);
    return tPlans("limitMessage", {
      plan: localizedPlan.name,
      limit,
    });
  }

  return null;
}

export async function assertPlanFeature(
  userId: string,
  feature: PlanFeature,
): Promise<string | null> {
  await assertUserNotSuspended(userId);

  const subscription = await getUserSubscription(userId);
  if (!(await planHasFeature(subscription.plan, feature))) {
    return getLocalizedPlanFeatureMessage(feature);
  }

  return null;
}

/**
 * Workspace-scoped features (reports, OCR, import, team data…) inherit the
 * workspace owner's plan — so a Free member in a Plus workspace gets Plus tools
 * inside that workspace only.
 */
export const getEffectiveSubscriptionForWorkspace = cache(
  async function getEffectiveSubscriptionForWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceSubscriptionContext> {
    const { getWorkspaceAccess } = await import("@/features/workspaces/access");
    const access = await getWorkspaceAccess(userId, workspaceId);
    const ownerId = access.workspace.ownerId;
    const ownerSub = await getUserSubscription(ownerId);

    return {
      ...ownerSub,
      isTeamMember: ownerId !== userId,
      ownerId,
    };
  },
);

export async function assertWorkspacePlanFeature(
  userId: string,
  workspaceId: string,
  feature: PlanFeature,
): Promise<string | null> {
  await assertUserNotSuspended(userId);

  const subscription = await getEffectiveSubscriptionForWorkspace(userId, workspaceId);
  if (!(await planHasFeature(subscription.plan, feature))) {
    return getLocalizedPlanFeatureMessage(feature);
  }

  return null;
}

export async function assertWorkspaceQuantityLimit(
  userId: string,
  workspaceId: string,
  limitKey: PlanQuantityLimitKey,
  currentCount: number,
): Promise<string | null> {
  await assertUserNotSuspended(userId);

  const subscription = await getEffectiveSubscriptionForWorkspace(userId, workspaceId);
  if (await planAllowsQuantity(subscription.plan, limitKey, currentCount)) {
    return null;
  }

  const limit = await getPlanQuantityLimit(subscription.plan, limitKey);
  const displayLimit = isUnlimitedQuantity(limit) ? "∞" : String(limit);
  return getLocalizedQuantityLimitMessage(limitKey, displayLimit);
}

export async function userHasWorkspacePlanFeature(
  userId: string,
  workspaceId: string,
  feature: PlanFeature,
): Promise<boolean> {
  const subscription = await getEffectiveSubscriptionForWorkspace(userId, workspaceId);
  return planHasFeature(subscription.plan, feature);
}

export async function getWorkspacePlanContext(userId: string, workspaceId: string) {
  const subscription = await getEffectiveSubscriptionForWorkspace(userId, workspaceId);
  const plan = await getLocalizedPlan(subscription.plan);
  return { subscription, plan };
}

export async function userHasPlanFeature(userId: string, feature: PlanFeature): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return planHasFeature(subscription.plan, feature);
}

export async function setUserPlan(
  userId: string,
  plan: PlanId,
  options: {
    adminEmail: string;
    expiresAt?: Date | null;
    status?: "active" | "cancelled" | "suspended";
    notes?: string;
  },
) {
  await connectToDatabase();

  const status = options.status ?? "active";
  const expiresAt =
    plan === "free"
      ? null
      : options.expiresAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  await UserSubscriptionModel.findOneAndUpdate(
    { userId },
    {
      userId,
      plan,
      status,
      expiresAt,
      updatedBy: options.adminEmail,
      notes: options.notes ?? null,
    },
    { upsert: true, returnDocument: "after" },
  );
}

export async function cancelUserSubscription(userId: string, adminEmail: string) {
  await setUserPlan(userId, "free", {
    adminEmail,
    status: "cancelled",
    expiresAt: null,
    notes: "ألغى الأدمن الاشتراك",
  });
}

export async function suspendUserAccount(userId: string, adminEmail: string) {
  await connectToDatabase();
  await UserSubscriptionModel.findOneAndUpdate(
    { userId },
    {
      userId,
      plan: "free",
      status: "suspended",
      expiresAt: null,
      updatedBy: adminEmail,
      notes: "حساب معلّق من الأدمن",
    },
    { upsert: true, returnDocument: "after" },
  );
}

export async function reactivateUserAccount(userId: string, adminEmail: string, plan: PlanId = "free") {
  await setUserPlan(userId, plan, {
    adminEmail,
    status: "active",
    notes: "أعاد الأدمن تفعيل الحساب",
  });
}

export async function getSubscriptionsForUsers(userIds: string[]) {
  const empty = new Map<string, UserSubscriptionView>();
  for (const id of userIds) {
    empty.set(id, { plan: "free", status: "active", expiresAt: null, isSuspended: false });
  }

  if (userIds.length === 0) return empty;

  try {
    await connectToDatabase();
    const records = await UserSubscriptionModel.find({ userId: { $in: userIds } }).lean();

    for (const record of records) {
      const userId = String(record.userId);
      empty.set(userId, {
        plan: resolveEffectivePlan(
          record.plan as PlanId,
          record.status,
          record.expiresAt ?? null,
        ),
        status: record.status as UserSubscriptionView["status"],
        expiresAt: record.expiresAt ? new Date(record.expiresAt).toISOString() : null,
        isSuspended: record.status === "suspended",
      });
    }
  } catch (error) {
    console.error("[subscription] failed to load user plans:", error);
  }

  return empty;
}
