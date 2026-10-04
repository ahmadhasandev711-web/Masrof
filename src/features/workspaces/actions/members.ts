"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { requireWorkspaceOwner } from "@/features/workspaces/access";
import { createInviteMemberSchema } from "@/features/workspaces/schemas";
import {
  cancelWorkspaceInvitation,
  createWorkspaceInvitation,
  isWorkspaceMemberByEmail,
  removeWorkspaceMember,
  acceptWorkspaceInvitation,
  workspaceHasTeamFeature,
} from "@/features/workspaces/members-data";
import { assertInviteRateLimit } from "@/lib/rate-limit/invite";
import { sendWorkspaceInviteEmail } from "@/features/workspaces/invite-email";

export type MemberActionState = { error: string | null; success?: boolean };

export async function inviteMemberAction(
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const session = await requireSession();
  const t = await getTranslations("workspaceTeam.errors");
  const tValidation = await getTranslations("validation");

  const parsed = createInviteMemberSchema((key) =>
    key === "emailInvalid" ? tValidation("emailInvalid") : t("invalidData"),
  ).safeParse({
    workspaceId: formData.get("workspaceId"),
    email: formData.get("email"),
    role: formData.get("role") ?? "member",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("invalidData") };
  }

  const email = parsed.data.email.toLowerCase().trim();

  if (email === session.user.email.toLowerCase()) {
    return { error: t("selfInvite") };
  }

  try {
    const { workspace } = await requireWorkspaceOwner(session.user.id, parsed.data.workspaceId);

    if (!(await workspaceHasTeamFeature(parsed.data.workspaceId))) {
      return { error: t("teamFeatureRequired") };
    }

    if (await isWorkspaceMemberByEmail(parsed.data.workspaceId, email)) {
      return { error: t("alreadyMember") };
    }

    await assertInviteRateLimit(session.user.id);

    const { token } = await createWorkspaceInvitation({
      workspaceId: parsed.data.workspaceId,
      email,
      invitedBy: session.user.id,
      role: parsed.data.role,
    });

    await sendWorkspaceInviteEmail({
      to: email,
      workspaceName: workspace.name,
      token,
      inviterName: session.user.name ?? session.user.email,
    });

    revalidatePath("/dashboard/workspaces/members");
    return { error: null, success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "inviteRateLimited") {
      return { error: t("inviteRateLimited") };
    }
    if (error instanceof Error && error.message === "memberLimitReached") {
      return { error: t("memberLimitReached") };
    }
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return { error: t("invitePending") };
    }
    console.error("[workspace] invite failed:", error);
    return { error: t("inviteFailed") };
  }
}

export async function cancelInvitationAction(invitationId: string, workspaceId: string) {
  const session = await requireSession();
  const t = await getTranslations("workspaceTeam.errors");

  try {
    await requireWorkspaceOwner(session.user.id, workspaceId);
    await cancelWorkspaceInvitation(invitationId, workspaceId);
    revalidatePath("/dashboard/workspaces/members");
    return { error: null as string | null };
  } catch (error) {
    console.error("[workspace] cancel invite failed:", error);
    return { error: t("cancelFailed") };
  }
}

export async function removeMemberAction(workspaceId: string, memberUserId: string) {
  const session = await requireSession();
  const t = await getTranslations("workspaceTeam.errors");

  if (memberUserId === session.user.id) {
    return { error: t("cannotRemoveSelf") };
  }

  try {
    await requireWorkspaceOwner(session.user.id, workspaceId);
    const result = await removeWorkspaceMember(workspaceId, memberUserId);
    if (result === "lastOwner") {
      return { error: t("lastOwner") };
    }
    revalidatePath("/dashboard/workspaces/members");
    return { error: null as string | null };
  } catch (error) {
    console.error("[workspace] remove member failed:", error);
    return { error: t("removeFailed") };
  }
}

export async function acceptInvitationAction(token: string) {
  const session = await requireSession();
  const t = await getTranslations("workspaceTeam.errors");

  try {
    const workspaceId = await acceptWorkspaceInvitation({
      token,
      userId: session.user.id,
      userEmail: session.user.email,
    });

    const { setActiveWorkspaceId } = await import("@/features/workspaces/active-workspace");
    await setActiveWorkspaceId(workspaceId);

    return { error: null as string | null, workspaceId };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "invitationEmailMismatch") return { error: t("emailMismatch") };
    if (code === "invitationExpired") return { error: t("invitationExpired") };
    if (code === "invitationInvalid") return { error: t("invitationInvalid") };
    if (code === "memberLimitReached") return { error: t("memberLimitReached") };
    console.error("[workspace] accept invite failed:", error);
    return { error: t("acceptFailed") };
  }
}
