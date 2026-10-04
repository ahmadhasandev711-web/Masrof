import "server-only";

import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/db/mongoose";
import { runInTransaction } from "@/lib/db/transaction";
import { mongoDb } from "@/lib/db/mongo-client";
import { WorkspaceMembershipModel } from "@/models/workspace-membership";
import { WorkspaceInvitationModel } from "@/models/workspace-invitation";
import { WorkspaceModel } from "@/models/workspace";
import { planHasFeature } from "@/features/subscriptions/plan-config-data";
import { sanitizeDisplayName } from "@/lib/user-display-name";
import { getUserSubscription, resolveEffectivePlan } from "@/features/subscriptions/data";
import { getMaxMembersForPlan } from "@/features/subscriptions/plan-config-data";
import type { PlanId } from "@/features/subscriptions/plans";
import type { WorkspaceRole, InvitableWorkspaceRole } from "@/models/workspace-membership";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type WorkspaceMemberRow = {
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: Date;
};

export type WorkspaceInvitationRow = {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: Date;
  invitedAt: Date;
};

export async function countOwnedWorkspacesForUser(userId: string): Promise<number> {
  await connectToDatabase();
  return WorkspaceMembershipModel.countDocuments({ userId, role: "owner" });
}

export async function getWorkspaceEffectivePlan(workspaceId: string): Promise<PlanId> {
  await connectToDatabase();
  const ws = await WorkspaceModel.findById(workspaceId).lean();
  if (!ws) return "free";
  if (ws.plan && ws.plan !== "free") {
    return resolveEffectivePlan(
      ws.plan as PlanId,
      ws.planStatus ?? "active",
      ws.planExpiresAt ?? null,
    );
  }
  if (ws.plan === "free") return "free";
  const subscription = await getUserSubscription(ws.ownerId);
  return subscription.plan;
}

export async function workspaceHasTeamFeature(workspaceId: string): Promise<boolean> {
  const plan = await getWorkspaceEffectivePlan(workspaceId);
  return planHasFeature(plan, "teamWorkspace");
}

export async function workspaceOwnerHasTeamFeature(ownerId: string): Promise<boolean> {
  const subscription = await getUserSubscription(ownerId);
  return planHasFeature(subscription.plan, "teamWorkspace");
}

async function lookupUsersByIds(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, { name: string; email: string }>();

  const objectIds = userIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const users = await mongoDb
    .collection("user")
    .find({
      $or: [
        ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
        { id: { $in: userIds } },
      ],
    })
    .project({ name: 1, email: 1, _id: 1, id: 1 })
    .toArray();

  return new Map(
    users.map((user) => {
      const uid = user.id ? String(user.id) : String(user._id);
      return [
        uid,
        {
          name: sanitizeDisplayName(user.name as string | undefined),
          email: String(user.email ?? ""),
        },
      ];
    }),
  );
}

export async function listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberRow[]> {
  await connectToDatabase();

  const memberships = await WorkspaceMembershipModel.find({ workspaceId })
    .sort({ createdAt: 1 })
    .lean();

  const users = await lookupUsersByIds(memberships.map((row) => row.userId));

  return memberships.map((row) => {
    const profile = users.get(row.userId);
    return {
      userId: row.userId,
      name: profile?.name ?? "—",
      email: profile?.email ?? "—",
      role: row.role as WorkspaceRole,
      joinedAt: row.createdAt ?? new Date(),
    };
  });
}

export async function listPendingInvitations(workspaceId: string): Promise<WorkspaceInvitationRow[]> {
  await connectToDatabase();
  const now = new Date();

  const rows = await WorkspaceInvitationModel.find({
    workspaceId,
    acceptedAt: null,
    cancelledAt: null,
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .lean();

  return rows.map((row) => ({
    id: String(row._id),
    email: row.email,
    role: row.role as WorkspaceRole,
    expiresAt: row.expiresAt,
    invitedAt: row.createdAt ?? new Date(),
  }));
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const user = await mongoDb.collection("user").findOne({ email: email.toLowerCase() });
  if (!user) return null;
  if (user.id) return String(user.id);
  return user._id ? String(user._id) : null;
}

export async function isWorkspaceMemberByEmail(
  workspaceId: string,
  email: string,
): Promise<boolean> {
  const userId = await findUserIdByEmail(email);
  if (!userId) return false;

  await connectToDatabase();
  const membership = await WorkspaceMembershipModel.findOne({ workspaceId, userId }).lean();
  return Boolean(membership);
}

export async function countWorkspaceSeats(workspaceId: string): Promise<number> {
  await connectToDatabase();
  const [members, pending] = await Promise.all([
    WorkspaceMembershipModel.countDocuments({ workspaceId }),
    WorkspaceInvitationModel.countDocuments({
      workspaceId,
      acceptedAt: null,
      cancelledAt: null,
      expiresAt: { $gt: new Date() },
    }),
  ]);
  return members + pending;
}

export async function assertWorkspaceMemberCapacity(workspaceId: string, _ownerId?: string): Promise<void> {
  const plan = await getWorkspaceEffectivePlan(workspaceId);
  const hasTeam = await planHasFeature(plan, "teamWorkspace");
  if (!hasTeam) {
    throw new Error("teamFeatureRequired");
  }

  const maxMembers = await getMaxMembersForPlan(plan);
  if (maxMembers === -1) return;

  const seats = await countWorkspaceSeats(workspaceId);
  if (seats >= maxMembers) {
    throw new Error("memberLimitReached");
  }
}

export async function createWorkspaceInvitation(input: {
  workspaceId: string;
  email: string;
  invitedBy: string;
  role?: InvitableWorkspaceRole;
}) {
  await connectToDatabase();

  const workspace = await WorkspaceModel.findOne({ _id: input.workspaceId, isArchived: false }).lean();
  if (!workspace) throw new Error("workspaceNotFound");

  await assertWorkspaceMemberCapacity(input.workspaceId);

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invitation = await WorkspaceInvitationModel.create({
    workspaceId: input.workspaceId,
    email: input.email.toLowerCase().trim(),
    role: input.role ?? "member",
    token,
    invitedBy: input.invitedBy,
    expiresAt,
  });

  return {
    token,
    expiresAt,
    invitationId: invitation._id.toString(),
  };
}

export async function getInvitationByToken(token: string) {
  await connectToDatabase();
  const invitation = await WorkspaceInvitationModel.findOne({ token }).lean();
  if (!invitation) return null;
  if (invitation.cancelledAt || invitation.acceptedAt) return null;
  if (invitation.expiresAt.getTime() < Date.now()) return null;

  const workspace = await WorkspaceModel.findOne({
    _id: invitation.workspaceId,
    isArchived: false,
  })
    .select("name")
    .lean();

  if (!workspace) return null;

  return {
    id: String(invitation._id),
    email: invitation.email,
    role: invitation.role as WorkspaceRole,
    workspaceId: String(invitation.workspaceId),
    workspaceName: workspace.name,
    expiresAt: invitation.expiresAt,
  };
}

export async function acceptWorkspaceInvitation(input: {
  token: string;
  userId: string;
  userEmail: string;
}) {
  const mongooseConn = await connectToDatabase();

  return runInTransaction(mongooseConn, async (session) => {
    const invitation = await WorkspaceInvitationModel.findOne({ token: input.token }).session(
      session,
    );
    if (!invitation || invitation.cancelledAt || invitation.acceptedAt) {
      throw new Error("invitationInvalid");
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new Error("invitationExpired");
    }
    if (invitation.email !== input.userEmail.toLowerCase()) {
      throw new Error("invitationEmailMismatch");
    }

    const existing = await WorkspaceMembershipModel.findOne({
      workspaceId: invitation.workspaceId,
      userId: input.userId,
    }).session(session);
    if (existing) {
      invitation.acceptedAt = new Date();
      await invitation.save({ session });
      return String(invitation.workspaceId);
    }

    const workspace = await WorkspaceModel.findOne({ _id: invitation.workspaceId }).session(session);
    if (!workspace) throw new Error("invitationInvalid");

    const subscription = await getUserSubscription(workspace.ownerId);
    const maxMembers = await getMaxMembersForPlan(subscription.plan);
    if (maxMembers !== -1) {
      const memberCount = await WorkspaceMembershipModel.countDocuments({
        workspaceId: invitation.workspaceId,
      }).session(session);
      if (memberCount >= maxMembers) {
        throw new Error("memberLimitReached");
      }
    }

    await WorkspaceMembershipModel.create(
      [
        {
          workspaceId: invitation.workspaceId,
          userId: input.userId,
          role: invitation.role,
        },
      ],
      { session },
    );

    invitation.acceptedAt = new Date();
    await invitation.save({ session });
    return String(invitation.workspaceId);
  });
}

export async function cancelWorkspaceInvitation(invitationId: string, workspaceId: string) {
  await connectToDatabase();
  return WorkspaceInvitationModel.findOneAndUpdate(
    {
      _id: invitationId,
      workspaceId,
      acceptedAt: null,
      cancelledAt: null,
    },
    { cancelledAt: new Date() },
    { returnDocument: "after" },
  ).lean();
}

export async function removeWorkspaceMember(
  workspaceId: string,
  memberUserId: string,
): Promise<"removed" | "lastOwner"> {
  await connectToDatabase();

  const target = await WorkspaceMembershipModel.findOne({ workspaceId, userId: memberUserId }).lean();
  if (!target) return "removed";

  if (target.role === "owner") {
    const ownerCount = await WorkspaceMembershipModel.countDocuments({ workspaceId, role: "owner" });
    if (ownerCount <= 1) return "lastOwner";
  }

  await WorkspaceMembershipModel.deleteOne({ workspaceId, userId: memberUserId });
  return "removed";
}

export async function getPendingInvitationsForEmail(email: string) {
  await connectToDatabase();
  const now = new Date();

  const rows = await WorkspaceInvitationModel.find({
    email: email.toLowerCase(),
    acceptedAt: null,
    cancelledAt: null,
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (rows.length === 0) return [];

  const workspaceIds = rows.map((row) => row.workspaceId);
  const workspaces = await WorkspaceModel.find({
    _id: { $in: workspaceIds },
    isArchived: false,
  })
    .select("name")
    .lean();

  const names = new Map(workspaces.map((w) => [String(w._id), w.name]));

  return rows
    .filter((row) => names.has(String(row.workspaceId)))
    .map((row) => ({
      token: row.token,
      workspaceName: names.get(String(row.workspaceId)) ?? "—",
      expiresAt: row.expiresAt,
    }));
}
