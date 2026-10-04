import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { mongoDb } from "@/lib/db/mongo-client";
import { WorkspaceModel } from "@/models/workspace";
import { WorkspaceMembershipModel, type WorkspaceRole } from "@/models/workspace-membership";
import { InvoiceModel } from "@/models/invoice";
import { ClientModel } from "@/models/client";
import { ProjectModel } from "@/models/project";
import { getUserSubscription } from "@/features/subscriptions/data";
import type { PlanId } from "@/features/subscriptions/plans";

export type AdminWorkspaceMember = {
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: Date;
};

export type AdminWorkspaceDetails = {
  workspace: {
    id: string;
    name: string;
    type: string;
    currency: string;
    plan: PlanId;
    planStatus: "active" | "cancelled" | "suspended";
    planExpiresAt: string | null;
    isArchived: boolean;
    createdAt: Date;
    businessName: string;
    businessPhone: string;
    adminNotes: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
  metrics: {
    invoicesCount: number;
    invoicesTotalMinor: number;
    clientsCount: number;
    projectsCount: number;
    invoicesThisMonth: number;
    limits: {
      maxInvoicesPerMonth: number;
      maxClients: number;
      maxMembers: number;
    };
    isLimitReached: boolean;
  };
  members: AdminWorkspaceMember[];
};

export async function getAdminWorkspaceDetails(
  workspaceId: string,
): Promise<AdminWorkspaceDetails | null> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    return null;
  }

  await connectToDatabase();

  const ws = await WorkspaceModel.findById(workspaceId).lean();
  if (!ws) return null;

  const rawWs = ws as any;
  const ownerId = ws.ownerId;

  // Find owner user details
  const ownerObjectIds = mongoose.Types.ObjectId.isValid(ownerId)
    ? [new mongoose.Types.ObjectId(ownerId)]
    : [];

  const [ownerDoc, ownerSub, memberships, invoiceStats, clientsCount, projectsCount] =
    await Promise.all([
      mongoDb
        .collection("user")
        .findOne({
          $or: [
            { _id: { $in: [ownerId as any, ...ownerObjectIds as any] } },
            { id: ownerId },
          ],
        }),
      getUserSubscription(ownerId),
      WorkspaceMembershipModel.find({ workspaceId }).sort({ createdAt: 1 }).lean(),
      InvoiceModel.aggregate<{ _id: null; count: number; totalMinor: number }>([
        { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId), isArchived: false } },
        { $group: { _id: null, count: { $sum: 1 }, totalMinor: { $sum: "$totalMinor" } } },
      ]),
      ClientModel.countDocuments({ workspaceId, isArchived: false }),
      ProjectModel.countDocuments({ workspaceId, isArchived: false }),
    ]);

  // Determine effective workspace plan (with legacy fallback to owner's plan)
  const plan: PlanId =
    (rawWs.plan && rawWs.plan !== "free" ? rawWs.plan : ownerSub?.plan) ?? rawWs.plan ?? "free";
  const planExpiresAt = rawWs.planExpiresAt
    ? new Date(rawWs.planExpiresAt).toISOString()
    : ownerSub?.expiresAt ?? null;
  const planStatus = (rawWs.planStatus ?? "active") as "active" | "cancelled" | "suspended";

  // Fetch users for members
  const memberUserIds = memberships.map((m) => m.userId);
  const memberObjectIds = memberUserIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const memberUsers = await mongoDb
    .collection("user")
    .find({
      $or: [
        { _id: { $in: memberUserIds as any } },
        { _id: { $in: memberObjectIds as any } },
        { id: { $in: memberUserIds } },
      ],
    })
    .project({ _id: 1, id: 1, name: 1, email: 1 })
    .toArray()
    .catch(() => []);

  const memberUserMap = new Map<string, { name: string; email: string }>();
  for (const u of memberUsers) {
    const key1 = String(u._id);
    const val = { name: (u.name as string) || "—", email: (u.email as string) || "—" };
    memberUserMap.set(key1, val);
    if (u.id) memberUserMap.set(String(u.id), val);
  }

  const members: AdminWorkspaceMember[] = memberships.map((m) => {
    const uInfo = memberUserMap.get(m.userId) ?? { name: "—", email: "—" };
    return {
      userId: m.userId,
      name: uInfo.name,
      email: uInfo.email,
      role: m.role as WorkspaceRole,
      joinedAt: m.createdAt,
    };
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const invoicesThisMonth = await InvoiceModel.countDocuments({
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    isArchived: false,
    createdAt: { $gte: startOfMonth },
  });

  const { getPlanConfig } = await import("@/features/subscriptions/plan-config-data");
  const config = await getPlanConfig(plan);

  const invoiceStat = invoiceStats[0] ?? { count: 0, totalMinor: 0 };
  const isLimitReached = plan === "free" && invoicesThisMonth >= config.maxInvoicesPerMonth;

  return {
    workspace: {
      id: ws._id.toString(),
      name: ws.name,
      type: ws.type,
      currency: ws.currency,
      plan,
      planStatus,
      planExpiresAt,
      isArchived: Boolean(ws.isArchived),
      createdAt: ws.createdAt,
      businessName: ws.businessName ?? "",
      businessPhone: ws.businessPhone ?? "",
      adminNotes: (rawWs.adminNotes as string | undefined) ?? "",
    },
    owner: {
      id: ownerId,
      name: (ownerDoc?.name as string) || "—",
      email: (ownerDoc?.email as string) || "—",
    },
    metrics: {
      invoicesCount: invoiceStat.count,
      invoicesTotalMinor: invoiceStat.totalMinor,
      clientsCount,
      projectsCount,
      invoicesThisMonth,
      limits: {
        maxInvoicesPerMonth: config.maxInvoicesPerMonth,
        maxClients: config.maxClients,
        maxMembers: config.maxMembers,
      },
      isLimitReached,
    },
    members,
  };
}
