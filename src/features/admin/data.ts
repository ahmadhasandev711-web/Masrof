import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PostModel } from "@/models/post";
import { SubscriberModel } from "@/models/subscriber";
import { mongoDb } from "@/lib/db/mongo-client";

export async function listAllPosts() {
  await connectToDatabase();
  return PostModel.find({})
    .select("title slug locale excerpt isPublished publishedAt featuredImage createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
}

export async function getPostById(id: string) {
  await connectToDatabase();
  return PostModel.findById(id).lean();
}

import { type PlanId } from "@/features/subscriptions/plans";
import { getPlanConfig } from "@/features/subscriptions/plan-config-data";

export type AdminStats = {
  workspacesTotal: number;
  usersTotal: number;
  proUsersTotal: number;
  invoicesTotal: number;
  mrrEgp: number;
  gtvMinor: number;
  conversionRate: number;
  actionQueue: {
    unverifiedUsers: Array<{
      id: string;
      name: string;
      email: string;
      createdAt?: Date;
    }>;
    expiringSubscriptions: Array<{
      userId: string;
      userName: string;
      userEmail: string;
      plan: PlanId;
      expiresAt: string;
      daysRemaining: number;
    }>;
  };
};

export async function getAdminStats(): Promise<AdminStats> {
  await connectToDatabase();

  const { WorkspaceModel } = await import("@/models/workspace");
  const { InvoiceModel } = await import("@/models/invoice");
  const { UserSubscriptionModel } = await import("@/models/user-subscription");

  const now = new Date();
  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const [
    workspacesTotal,
    usersTotal,
    proUsersTotal,
    invoicesTotal,
    invoiceTotalAgg,
    unverifiedDocs,
    expiringSubDocs,
  ] = await Promise.all([
    WorkspaceModel.countDocuments({ isArchived: false }),
    mongoDb.collection("user").countDocuments({}),
    UserSubscriptionModel.countDocuments({ plan: "pro", status: "active" }),
    InvoiceModel.countDocuments({ isArchived: false }),
    InvoiceModel.aggregate<{ _id: null; totalMinor: number }>([
      { $match: { isArchived: false } },
      { $group: { _id: null, totalMinor: { $sum: "$totalMinor" } } },
    ]),
    mongoDb
      .collection("user")
      .find({ emailVerified: { $ne: true } })
      .project({ name: 1, email: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray(),
    UserSubscriptionModel.find({
      plan: { $ne: "free" },
      status: "active",
      expiresAt: { $gte: now, $lte: in14Days },
    })
      .sort({ expiresAt: 1 })
      .limit(6)
      .lean(),
  ]);

  const gtvMinor = invoiceTotalAgg[0]?.totalMinor ?? 0;
  const proConfig = await getPlanConfig("pro");
  const proYearlyEgp = proConfig.priceYearly ?? 250;
  const mrrEgp = Math.round((proUsersTotal * proYearlyEgp) / 12);
  const conversionRate = usersTotal > 0 ? Math.round((proUsersTotal / usersTotal) * 1000) / 10 : 0;

  const unverifiedUsers = unverifiedDocs.map((u) => ({
    id: String(u._id),
    name: (u.name as string) || "—",
    email: (u.email as string) || "",
    createdAt: u.createdAt as Date | undefined,
  }));

  const expiringUserIds = expiringSubDocs.map((s) => s.userId);
  const expiringObjectIds = expiringUserIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const expiringUserDocs = expiringUserIds.length > 0
    ? await mongoDb
        .collection("user")
        .find({
          $or: [
            { _id: { $in: [...expiringUserIds as any, ...expiringObjectIds as any] } },
            { id: { $in: expiringUserIds } },
          ],
        })
        .project({ name: 1, email: 1 })
        .toArray()
    : [];

  const userMap = new Map<string, { name: string; email: string }>();
  for (const doc of expiringUserDocs) {
    const info = { name: (doc.name as string) || "—", email: (doc.email as string) || "" };
    userMap.set(String(doc._id), info);
    if (doc.id) userMap.set(String(doc.id), info);
  }

  const expiringSubscriptions = expiringSubDocs.map((s) => {
    const userInfo = userMap.get(s.userId) ?? { name: "—", email: "" };
    const expiresDate = s.expiresAt ? new Date(s.expiresAt) : now;
    const daysRemaining = Math.max(0, Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      userId: s.userId,
      userName: userInfo.name,
      userEmail: userInfo.email,
      plan: s.plan as PlanId,
      expiresAt: expiresDate.toISOString(),
      daysRemaining,
    };
  });

  return {
    workspacesTotal,
    usersTotal,
    proUsersTotal,
    invoicesTotal,
    mrrEgp,
    gtvMinor,
    conversionRate,
    actionQueue: {
      unverifiedUsers,
      expiringSubscriptions,
    },
  };
}

export type AppUserWithWorkspaces = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  createdAt?: Date;
  image?: string;
  isOwner: boolean;
  subscription: {
    plan: PlanId;
    status: string;
    expiresAt: string | null;
    isSuspended: boolean;
  };
  workspaces: Array<{
    id: string;
    name: string;
    role: "owner" | "member" | "viewer";
    plan: PlanId;
    planExpiresAt?: string | null;
  }>;
};

export async function listAppUsers(limit = 100): Promise<AppUserWithWorkspaces[]> {
  await connectToDatabase();

  const users = await mongoDb
    .collection("user")
    .find({})
    .project({ name: 1, email: 1, emailVerified: 1, createdAt: 1, image: 1, phoneNumber: 1, phone: 1 })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const mapped = users.map((user) => ({
    id: String(user._id),
    name: (user.name as string | undefined) ?? "—",
    email: user.email as string,
    phone: (user.phoneNumber as string | undefined) || (user.phone as string | undefined) || null,
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt as Date | undefined,
    image: user.image as string | undefined,
  }));

  const userIds = mapped.map((u) => u.id);

  const { getSubscriptionsForUsers } = await import("@/features/subscriptions/data");
  const { WorkspaceMembershipModel } = await import("@/models/workspace-membership");
  const { WorkspaceModel } = await import("@/models/workspace");
  const { UserSettingsModel } = await import("@/models/user-settings");

  const [subscriptions, memberships, userSettingsList] = await Promise.all([
    getSubscriptionsForUsers(userIds),
    WorkspaceMembershipModel.find({
      userId: { $in: userIds },
    }).lean(),
    UserSettingsModel.find({
      userId: { $in: userIds },
    }).lean(),
  ]);

  const userSettingsMap = new Map<string, string>();
  for (const s of userSettingsList) {
    if (s.whatsappPhone) {
      userSettingsMap.set(s.userId, s.whatsappPhone);
    }
  }

  const workspaceIds = Array.from(new Set(memberships.map((m) => m.workspaceId)));
  const workspaces = await WorkspaceModel.find({
    _id: { $in: workspaceIds },
  })
    .select("_id name plan planExpiresAt businessPhone")
    .lean();

  const workspaceMap = new Map(
    workspaces.map((w) => [
      w._id.toString(),
      {
        name: w.name,
        plan: (((w as any).plan === "pro" || (w as any).plan === "plus" ? "pro" : "free") as PlanId),
        planExpiresAt: (w as any).planExpiresAt ? new Date((w as any).planExpiresAt).toISOString() : null,
        businessPhone: (w as any).businessPhone || null,
      },
    ]),
  );

  const userWorkspacesMap = new Map<
    string,
    Array<{ id: string; name: string; role: "owner" | "member" | "viewer"; plan: PlanId; planExpiresAt: string | null }>
  >();

  for (const m of memberships) {
    const uId = m.userId;
    const list = userWorkspacesMap.get(uId) ?? [];
    const wsInfo = workspaceMap.get(m.workspaceId.toString());
    list.push({
      id: m.workspaceId.toString(),
      name: wsInfo?.name ?? "مساحة",
      role: m.role as "owner" | "member" | "viewer",
      plan: wsInfo?.plan ?? "free",
      planExpiresAt: wsInfo?.planExpiresAt ?? null,
    });
    userWorkspacesMap.set(uId, list);
  }

  return mapped.map((user) => {
    const userWorkspaces = userWorkspacesMap.get(user.id) ?? [];
    const isOwner = userWorkspaces.some((ws) => ws.role === "owner");
    const userSub = subscriptions.get(user.id);
    const ownedWs = userWorkspaces.find((ws) => ws.role === "owner");
    const wsObj = ownedWs ? workspaceMap.get(ownedWs.id) : null;

    const resolvedPhone =
      userSettingsMap.get(user.id) ||
      user.phone ||
      wsObj?.businessPhone ||
      null;

    const effectivePlan: PlanId = (ownedWs?.plan === "pro" ? "pro" : "free");
    const effectiveExpiresAt = ownedWs?.planExpiresAt || null;

    return {
      ...user,
      phone: resolvedPhone,
      isOwner,
      subscription: {
        plan: effectivePlan,
        status: userSub?.status ?? "active",
        expiresAt: effectiveExpiresAt,
        isSuspended: userSub?.isSuspended ?? false,
      },
      workspaces: userWorkspaces,
    };
  });
}

export type PlatformWorkspaceItem = {
  id: string;
  name: string;
  type: string;
  currency: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  plan: PlanId;
  planExpiresAt?: string | null;
  membersCount: number;
  invoicesCount: number;
  isArchived: boolean;
  createdAt: Date;
};

export async function listAllWorkspaces(limit = 100): Promise<PlatformWorkspaceItem[]> {
  await connectToDatabase();

  const { WorkspaceModel } = await import("@/models/workspace");
  const { WorkspaceMembershipModel } = await import("@/models/workspace-membership");
  const { InvoiceModel } = await import("@/models/invoice");
  const { getSubscriptionsForUsers } = await import("@/features/subscriptions/data");

  const workspaces = await WorkspaceModel.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  if (workspaces.length === 0) return [];

  const wsIds = workspaces.map((w) => w._id);
  const ownerIds = Array.from(new Set(workspaces.map((w) => w.ownerId)));

  const validOwnerObjectIds = ownerIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const [owners, memberCounts, invoiceCounts, ownerSubs] = await Promise.all([
    mongoDb
      .collection("user")
      .find({
        $or: [
          { _id: { $in: ownerIds as any } },
          { _id: { $in: validOwnerObjectIds as any } },
        ],
      })
      .project({ name: 1, email: 1 })
      .toArray()
      .catch(() => []),
    WorkspaceMembershipModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { workspaceId: { $in: wsIds } } },
      { $group: { _id: "$workspaceId", count: { $sum: 1 } } },
    ]),
    InvoiceModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { workspaceId: { $in: wsIds }, isArchived: false } },
      { $group: { _id: "$workspaceId", count: { $sum: 1 } } },
    ]),
    getSubscriptionsForUsers(ownerIds),
  ]);

  const ownerMap = new Map(
    owners.map((o) => [String(o._id), { name: (o.name as string) || "—", email: (o.email as string) || "—" }]),
  );
  const memberMap = new Map(memberCounts.map((m) => [String(m._id), m.count]));
  const invoiceMap = new Map(invoiceCounts.map((i) => [String(i._id), i.count]));

  return workspaces.map((w) => {
    const owner = ownerMap.get(w.ownerId);
    const rawWs = w as any;
    const plan = ((rawWs.plan === "pro" || rawWs.plan === "plus") ? "pro" : "free") as PlanId;
    const planExpiresAt = rawWs.planExpiresAt
      ? new Date(rawWs.planExpiresAt).toISOString()
      : null;

    return {
      id: w._id.toString(),
      name: w.name,
      type: w.type,
      currency: w.currency,
      ownerId: w.ownerId,
      ownerName: owner?.name || "—",
      ownerEmail: owner?.email || "—",
      plan: (plan === "pro" || (plan as any) === "plus" ? "pro" : "free") as PlanId,
      planExpiresAt,
      membersCount: memberMap.get(w._id.toString()) ?? 1,
      invoicesCount: invoiceMap.get(w._id.toString()) ?? 0,
      isArchived: Boolean(w.isArchived),
      createdAt: w.createdAt,
    };
  });
}

export async function listSubscribers() {
  await connectToDatabase();
  return SubscriberModel.find({}).sort({ createdAt: -1 }).lean();
}
