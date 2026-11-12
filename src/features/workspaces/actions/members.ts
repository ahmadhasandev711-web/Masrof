"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { createInviteMemberSchema } from "@/features/workspaces/schemas";
import { workspacesService } from "@/features/workspaces/workspaces.service";
import { runWorkspaceOwnerWrite } from "@/server/kernel";

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

  try {
    const result = await runWorkspaceOwnerWrite(
      parsed.data.workspaceId,
      ({ userId, workspace }) =>
        workspacesService.inviteMember(
          {
            userId,
            email: session.user.email,
            name: session.user.name,
          },
          parsed.data,
          workspace.name,
        ),
    );

    if (!result.ok) {
      const code = result.error.code;
      if (
        code === "selfInvite" ||
        code === "teamFeatureRequired" ||
        code === "alreadyMember" ||
        code === "inviteRateLimited" ||
        code === "memberLimitReached" ||
        code === "invitePending"
      ) {
        return { error: t(code) };
      }
      return { error: t("inviteFailed") };
    }

    revalidatePath("/dashboard/workspaces/members");
    return { error: null, success: true };
  } catch (error) {
    console.error("[workspace] invite failed:", error);
    return { error: t("inviteFailed") };
  }
}

export async function cancelInvitationAction(invitationId: string, workspaceId: string) {
  const t = await getTranslations("workspaceTeam.errors");

  try {
    await runWorkspaceOwnerWrite(workspaceId, () =>
      workspacesService.cancelInvitation(invitationId, workspaceId),
    );
    revalidatePath("/dashboard/workspaces/members");
    return { error: null as string | null };
  } catch (error) {
    console.error("[workspace] cancel invite failed:", error);
    return { error: t("cancelFailed") };
  }
}

export async function removeMemberAction(workspaceId: string, memberUserId: string) {
  const t = await getTranslations("workspaceTeam.errors");

  try {
    const result = await runWorkspaceOwnerWrite(workspaceId, ({ userId }) =>
      workspacesService.removeMember(workspaceId, memberUserId, userId),
    );

    if (!result.ok) {
      const code = result.error.code;
      if (code === "cannotRemoveSelf" || code === "lastOwner") {
        return { error: t(code) };
      }
      return { error: t("removeFailed") };
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
    const result = await workspacesService.acceptInvitation({
      token,
      userId: session.user.id,
      userEmail: session.user.email,
    });

    if (!result.ok) {
      const code = result.error.code;
      if (code === "invitationEmailMismatch") return { error: t("emailMismatch") };
      if (code === "invitationExpired") return { error: t("invitationExpired") };
      if (code === "invitationInvalid") return { error: t("invitationInvalid") };
      if (code === "memberLimitReached") return { error: t("memberLimitReached") };
      return { error: t("acceptFailed") };
    }

    const { setActiveWorkspaceId } = await import("@/features/workspaces/active-workspace");
    await setActiveWorkspaceId(result.value);

    return { error: null as string | null, workspaceId: result.value };
  } catch (error) {
    console.error("[workspace] accept invite failed:", error);
    return { error: t("acceptFailed") };
  }
}
