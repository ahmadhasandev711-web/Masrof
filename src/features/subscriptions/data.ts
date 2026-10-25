import "server-only";

import { cache } from "react";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserSubscriptionModel } from "@/models/user-subscription";
import { resolveEffectivePlan, type PlanId, type PlanFeature } from "@/features/subscriptions/plans";
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
import { countOwnedWorkspacesForUser, isUserActiveTeamMemberOfAnyWorkspace } from "@/features/workspaces/members-data";
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

export { resolveEffectivePlan } from "@/features/subscriptions/plans";

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
    let effectivePlan: PlanId = "free";
    let status = record?.status ?? "active";
    let expiresAt = record?.expiresAt ?? null;

    if (record) {
      effectivePlan = resolveEffectivePlan(
        record.plan as PlanId,
        record.status,
        record.expiresAt ?? null,
      );
    }

    if (effectivePlan !== "pro") {
      const { WorkspaceModel } = await import("@/models/workspace");
      const activeProWs = await WorkspaceModel.findOne({
        ownerId: userId,
        plan: "pro",
        planStatus: "active",
        isArchived: false,
      }).lean();

      if (activeProWs) {
        const wsEffective = resolveEffectivePlan(
          "pro",
          activeProWs.planStatus ?? "active",
          activeProWs.planExpiresAt ?? null,
        );
        if (wsEffective === "pro") {
          effectivePlan = "pro";
          status = (activeProWs.planStatus ?? "active") as UserSubscriptionView["status"];
          expiresAt = activeProWs.planExpiresAt ?? null;
        }
      }
    }

    return {
      plan: effectivePlan,
      status: status as UserSubscriptionView["status"],
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      isSuspended: status === "suspended",
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

  // 1. Team members in an active team workspace cannot create a separate personal workspace
  const isActiveTeamMember = await isUserActiveTeamMemberOfAnyWorkspace(userId);
  if (isActiveTeamMember) {
    const tPlans = await getTranslations("plans");
    return tPlans("teamMemberCannotCreateWorkspace");
  }

  // 2. Dynamic workspace limit (1 workspace on both Free and Pro)
  const subscription = await getUserSubscription(userId);
  const config = await getPlanConfig(subscription.plan);
  const ownedCount = await countOwnedWorkspacesForUser(userId);

  if (config.maxWorkspaces !== -1 && ownedCount >= config.maxWorkspaces) {
    const tPlans = await getTranslations("plans");
    return tPlans("limitMessage", {
      plan: subscription.plan === "pro" ? "برو" : "المجانية",
      limit: config.maxWorkspaces,
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
 * Derives the effective subscription from an ALREADY-AUTHORIZED workspace document.
 * Callers must have obtained `workspace` through a membership-verified path
 * (e.g. `listWorkspacesForUser` / `getWorkspaceAccess`); this performs no access check.
 */
export async function resolveWorkspaceSubscriptionFromDocument(
  userId: string,
  workspace: { ownerId: string; plan?: unknown; planStatus?: unknown; planExpiresAt?: unknown },
): Promise<WorkspaceSubscriptionContext> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ws = workspace as any;

  if (ws.plan && ws.plan !== "free") {
    const effectivePlan = resolveEffectivePlan(
      ws.plan as PlanId,
      ws.planStatus ?? "active",
      ws.planExpiresAt ?? null,
    );
    return {
      plan: effectivePlan,
      status: (ws.planStatus ?? "active") as UserSubscriptionView["status"],
      expiresAt: ws.planExpiresAt ? new Date(ws.planExpiresAt).toISOString() : null,
      isSuspended: ws.planStatus === "suspended",
      isTeamMember: workspace.ownerId !== userId,
      ownerId: workspace.ownerId,
    };
  }

  if (ws.plan === "free") {
    return {
      plan: "free",
      status: (ws.planStatus ?? "active") as UserSubscriptionView["status"],
      expiresAt: null,
      isSuspended: ws.planStatus === "suspended",
      isTeamMember: workspace.ownerId !== userId,
      ownerId: workspace.ownerId,
    };
  }

  return getEffectiveSubscriptionForOwner(userId, workspace.ownerId);
}

/**
 * Workspace-scoped features (reports, OCR, import, team data…) inherit the
 * workspace's dedicated plan, or fallback to the workspace owner's plan for legacy workspaces.
 */
export const getEffectiveSubscriptionForWorkspace = cache(
  async function getEffectiveSubscriptionForWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceSubscriptionContext> {
    const { getWorkspaceAccess } = await import("@/features/workspaces/access");
    const access = await getWorkspaceAccess(userId, workspaceId);
    return resolveWorkspaceSubscriptionFromDocument(userId, access.workspace);
  },
);

export const getEffectiveSubscriptionForOwner = cache(
  async function getEffectiveSubscriptionForOwner(
    userId: string,
    ownerId: string,
  ): Promise<WorkspaceSubscriptionContext> {
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

export async function setWorkspacePlan(
  workspaceId: string,
  plan: PlanId,
  options: {
    adminEmail?: string;
    expiresAt?: Date | null;
    status?: "active" | "cancelled" | "suspended";
    notes?: string;
  } = {},
) {
  await connectToDatabase();
  const { WorkspaceModel } = await import("@/models/workspace");

  const status = options.status ?? "active";
  const expiresAt =
    plan === "free"
      ? null
      : options.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const updatedWs = await WorkspaceModel.findByIdAndUpdate(
    workspaceId,
    {
      plan,
      planStatus: status,
      planExpiresAt: expiresAt,
    },
    { returnDocument: "after" },
  );

  // Synchronize owner's user subscription so it matches the workspace plan
  if (updatedWs?.ownerId) {
    await UserSubscriptionModel.findOneAndUpdate(
      { userId: updatedWs.ownerId },
      {
        userId: updatedWs.ownerId,
        plan,
        status,
        expiresAt,
        updatedBy: options.adminEmail ?? "system",
        notes: options.notes ?? `Synced from workspace ${workspaceId}`,
      },
      { upsert: true },
    );
  }

  return updatedWs;
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
  const { WorkspaceModel } = await import("@/models/workspace");

  const status = options.status ?? "active";
  const expiresAt =
    plan === "free"
      ? null
      : options.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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

  // Synchronize all workspaces owned by this user
  await WorkspaceModel.updateMany(
    { ownerId: userId, isArchived: false },
    {
      plan,
      planStatus: status,
      planExpiresAt: expiresAt,
    },
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
  const { WorkspaceModel } = await import("@/models/workspace");

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

  await WorkspaceModel.updateMany(
    { ownerId: userId },
    {
      planStatus: "suspended",
    },
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
