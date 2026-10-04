"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { connectToDatabase } from "@/lib/db/mongoose";
import { mongoDb } from "@/lib/db/mongo-client";
import { WorkspaceModel, WORKSPACE_TYPES, SUPPORTED_CURRENCIES } from "@/models/workspace";
import { WorkspaceMembershipModel, type WorkspaceRole } from "@/models/workspace-membership";
import { removeWorkspaceMember } from "@/features/workspaces/members-data";
import { setActiveWorkspaceId } from "@/features/workspaces/active-workspace";

export type AdminActionResult = {
  error: string | null;
  success: boolean;
};

/**
 * Update basic workspace metadata (name, type, currency, business phone).
 */
export async function updateAdminWorkspaceInfoAction(
  workspaceId: string,
  data: {
    name: string;
    type: string;
    currency: string;
    businessPhone?: string;
  },
): Promise<AdminActionResult> {
  await requireAdmin();
  const t = await getTranslations("admin.errors");

  const name = data.name.trim();
  if (!name || name.length > 80) {
    return { error: t("invalidName"), success: false };
  }

  if (!WORKSPACE_TYPES.includes(data.type as any)) {
    return { error: t("invalidType"), success: false };
  }

  if (!SUPPORTED_CURRENCIES.includes(data.currency as any)) {
    return { error: t("invalidCurrency"), success: false };
  }

  try {
    await connectToDatabase();
    await WorkspaceModel.findByIdAndUpdate(workspaceId, {
      name,
      type: data.type,
      currency: data.currency,
      businessPhone: (data.businessPhone ?? "").trim().slice(0, 30),
    });

    revalidatePath("/admin/workspaces");
    revalidatePath(`/admin/workspaces/${workspaceId}`);
    revalidatePath("/dashboard");
    return { error: null, success: true };
  } catch (error) {
    console.error("[admin] update workspace info failed:", error);
    return { error: t("updateWorkspaceFailed"), success: false };
  }
}

/**
 * Toggle workspace archived status.
 */
export async function toggleAdminWorkspaceArchiveAction(
  workspaceId: string,
): Promise<AdminActionResult> {
  await requireAdmin();
  const t = await getTranslations("admin.errors");

  try {
    await connectToDatabase();
    const existing = await WorkspaceModel.findById(workspaceId).select("isArchived").lean();
    if (!existing) {
      return { error: t("workspaceNotFound"), success: false };
    }

    const nextArchived = !existing.isArchived;
    await WorkspaceModel.findByIdAndUpdate(workspaceId, { isArchived: nextArchived });

    revalidatePath("/admin/workspaces");
    revalidatePath(`/admin/workspaces/${workspaceId}`);
    revalidatePath("/dashboard");
    return { error: null, success: true };
  } catch (error) {
    console.error("[admin] toggle archive failed:", error);
    return { error: t("archiveFailed"), success: false };
  }
}

/**
 * Permanently delete workspace and all its memberships.
 */
export async function deleteAdminWorkspaceAction(
  workspaceId: string,
  confirmedName: string,
): Promise<AdminActionResult> {
  await requireAdmin();
  const t = await getTranslations("admin.errors");

  try {
    await connectToDatabase();
    const ws = await WorkspaceModel.findById(workspaceId).select("name").lean();
    if (!ws) {
      return { error: t("workspaceNotFound"), success: false };
    }

    if (ws.name.trim() !== confirmedName.trim()) {
      return { error: t("nameMismatch"), success: false };
    }

    await Promise.all([
      WorkspaceModel.findByIdAndDelete(workspaceId),
      WorkspaceMembershipModel.deleteMany({ workspaceId }),
    ]);

    revalidatePath("/admin/workspaces");
    revalidatePath("/admin/users");
    revalidatePath("/dashboard");
    return { error: null, success: true };
  } catch (error) {
    console.error("[admin] delete workspace failed:", error);
    return { error: t("deleteFailed"), success: false };
  }
}

/**
 * Add a member directly to the workspace by their registered email.
 */
export async function adminAddWorkspaceMemberAction(
  workspaceId: string,
  email: string,
  role: "member" | "viewer",
): Promise<AdminActionResult> {
  await requireAdmin();
  const t = await getTranslations("admin.errors");

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { error: t("invalidEmail"), success: false };
  }

  try {
    await connectToDatabase();

    const user = await mongoDb.collection("user").findOne({ email: cleanEmail });
    if (!user) {
      return { error: t("userNotFoundForEmail"), success: false };
    }

    const userId = String(user.id || user._id);

    const existing = await WorkspaceMembershipModel.findOne({ workspaceId, userId }).lean();
    if (existing) {
      return { error: t("userAlreadyMember"), success: false };
    }

    await WorkspaceMembershipModel.create({
      workspaceId,
      userId,
      role,
    });

    revalidatePath(`/admin/workspaces/${workspaceId}`);
    revalidatePath("/admin/users");
    return { error: null, success: true };
  } catch (error) {
    console.error("[admin] add workspace member failed:", error);
    return { error: t("addMemberFailed"), success: false };
  }
}

/**
 * Remove a member from the workspace.
 */
export async function adminRemoveWorkspaceMemberAction(
  workspaceId: string,
  userId: string,
): Promise<AdminActionResult> {
  await requireAdmin();
  const t = await getTranslations("admin.errors");

  try {
    await connectToDatabase();
    const outcome = await removeWorkspaceMember(workspaceId, userId);
    if (outcome === "lastOwner") {
      return { error: t("cannotRemoveLastOwner"), success: false };
    }

    revalidatePath(`/admin/workspaces/${workspaceId}`);
    revalidatePath("/admin/users");
    return { error: null, success: true };
  } catch (error) {
    console.error("[admin] remove workspace member failed:", error);
    return { error: t("removeMemberFailed"), success: false };
  }
}

/**
 * Change a workspace member's role (owner / member / viewer).
 */
export async function adminChangeMemberRoleAction(
  workspaceId: string,
  userId: string,
  newRole: WorkspaceRole,
): Promise<AdminActionResult> {
  await requireAdmin();
  const t = await getTranslations("admin.errors");

  try {
    await connectToDatabase();

    const target = await WorkspaceMembershipModel.findOne({ workspaceId, userId }).lean();
    if (!target) {
      return { error: t("memberNotFound"), success: false };
    }

    if (target.role === "owner" && newRole !== "owner") {
      const ownerCount = await WorkspaceMembershipModel.countDocuments({ workspaceId, role: "owner" });
      if (ownerCount <= 1) {
        return { error: t("cannotDemoteLastOwner"), success: false };
      }
    }

    await WorkspaceMembershipModel.findOneAndUpdate(
      { workspaceId, userId },
      { role: newRole },
    );

    revalidatePath(`/admin/workspaces/${workspaceId}`);
    revalidatePath("/admin/users");
    return { error: null, success: true };
  } catch (error) {
    console.error("[admin] change member role failed:", error);
    return { error: t("changeRoleFailed"), success: false };
  }
}

/**
 * Transfer workspace ownership to another member.
 */
export async function adminTransferWorkspaceOwnershipAction(
  workspaceId: string,
  targetUserId: string,
): Promise<AdminActionResult> {
  await requireAdmin();
  const t = await getTranslations("admin.errors");

  try {
    await connectToDatabase();

    const targetMembership = await WorkspaceMembershipModel.findOne({
      workspaceId,
      userId: targetUserId,
    }).lean();

    if (!targetMembership) {
      return { error: t("memberNotFound"), success: false };
    }

    // Demote current owner(s) to member and promote target to owner
    await WorkspaceMembershipModel.updateMany(
      { workspaceId, role: "owner" },
      { role: "member" },
    );

    await WorkspaceMembershipModel.findOneAndUpdate(
      { workspaceId, userId: targetUserId },
      { role: "owner" },
    );

    await WorkspaceModel.findByIdAndUpdate(workspaceId, {
      ownerId: targetUserId,
    });

    revalidatePath(`/admin/workspaces/${workspaceId}`);
    revalidatePath("/admin/users");
    revalidatePath("/admin/workspaces");
    return { error: null, success: true };
  } catch (error) {
    console.error("[admin] transfer ownership failed:", error);
    return { error: t("transferOwnershipFailed"), success: false };
  }
}

/**
 * Enter workspace preview as admin for tech support.
 * Adds admin as a viewer (if not already member), sets active workspace cookie, and redirects to dashboard.
 */
export async function adminEnterWorkspacePreviewAction(
  workspaceId: string,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const t = await getTranslations("admin.errors");

  try {
    await connectToDatabase();

    const existing = await WorkspaceMembershipModel.findOne({
      workspaceId,
      userId: session.user.id,
    }).lean();

    if (!existing) {
      await WorkspaceMembershipModel.create({
        workspaceId,
        userId: session.user.id,
        role: "viewer",
      });
    }

    await setActiveWorkspaceId(workspaceId);
    return { error: null, success: true };
  } catch (error) {
    console.error("[admin] enter workspace preview failed:", error);
    return { error: t("previewFailed"), success: false };
  }
}

/**
 * Save confidential administrative notes on a workspace.
 */
export async function updateAdminWorkspaceNotesAction(
  workspaceId: string,
  notes: string,
): Promise<AdminActionResult> {
  await requireAdmin();

  try {
    await connectToDatabase();
    await WorkspaceModel.findByIdAndUpdate(workspaceId, {
      adminNotes: notes.trim().slice(0, 2000),
    });

    revalidatePath(`/admin/workspaces/${workspaceId}`);
    return { error: null, success: true };
  } catch (error) {
    console.error("[admin] update workspace notes failed:", error);
    return { error: "فشل حفظ الملاحظات", success: false };
  }
}

/**
 * Export full workspace backup data as a JSON object for technical support.
 */
export async function adminExportWorkspaceDataAction(workspaceId: string) {
  await requireAdmin();

  try {
    await connectToDatabase();
    const { InvoiceModel } = await import("@/models/invoice");
    const { AccountModel } = await import("@/models/account");
    const { ClientModel } = await import("@/models/client");
    const { ProjectModel } = await import("@/models/project");

    const [workspace, invoices, accounts, clients, projects] = await Promise.all([
      WorkspaceModel.findById(workspaceId).lean(),
      InvoiceModel.find({ workspaceId }).lean(),
      AccountModel.find({ workspaceId }).lean(),
      ClientModel.find({ workspaceId }).lean(),
      ProjectModel.find({ workspaceId }).lean(),
    ]);

    const backupDump = {
      exportedAt: new Date().toISOString(),
      workspace,
      invoices,
      accounts,
      clients,
      projects,
    };

    return { error: null, success: true, json: JSON.stringify(backupDump, null, 2) };
  } catch (error) {
    console.error("[admin] export workspace data failed:", error);
    return { error: "فشل تصدير بيانات المساحة", success: false, json: null };
  }
}

