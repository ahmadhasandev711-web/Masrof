import "server-only";

import type { CreateWorkspaceInput, InviteMemberInput } from "@/features/workspaces/schemas";
import type { UpdateWorkspaceBrandingInput } from "@/features/workspaces/branding-schema";
import type { SupportedCurrency } from "@/models/workspace";
import { SUPPORTED_CURRENCIES } from "@/models/workspace";
import {
  WorkspacesRepository,
  workspacesRepository,
} from "@/features/workspaces/workspaces.repository";
import {
  acceptWorkspaceInvitation,
  cancelWorkspaceInvitation,
  createWorkspaceInvitation,
  isWorkspaceMemberByEmail,
  listPendingInvitations,
  listWorkspaceMembers,
  removeWorkspaceMember,
  workspaceHasTeamFeature,
} from "@/features/workspaces/members-data";
import { sendWorkspaceInviteEmail } from "@/features/workspaces/invite-email";
import { assertInviteRateLimit } from "@/lib/rate-limit/invite";
import { assertCanCreateWorkspace } from "@/features/subscriptions/data";
import { AppError, NotFoundError, PlanLimitError } from "@/server/kernel/errors";
import { err, ok, type Result } from "@/server/kernel/result";
import { requirePlanFeature } from "@/server/kernel/plan-policy";

export class WorkspacesService {
  constructor(private readonly repo: WorkspacesRepository = workspacesRepository) {}

  async create(userId: string, input: CreateWorkspaceInput): Promise<Result<string>> {
    const limitError = await assertCanCreateWorkspace(userId);
    if (limitError) return err(new PlanLimitError(limitError));

    const existingId = await this.repo.findIdempotentWorkspaceId(userId, input.idempotencyKey);
    if (existingId) return ok(existingId);

    const workspaceId = await this.repo.createWithOwnerAndAccount(userId, input);
    return ok(workspaceId);
  }

  /** Lists every non-archived workspace the user can access, newest first. */
  async listForUser(userId: string) {
    const results = await this.repo.listMembershipWorkspaces(userId);
    if (results.length === 0) return [];

    const checks = await Promise.all(
      results.map(async (item) => {
        if (item.role === "owner") return true;
        return workspaceHasTeamFeature(item.workspace._id.toString());
      }),
    );

    return results.filter((_, index) => checks[index]).map((item) => item.workspace);
  }

  async userHasAnyWorkspace(userId: string): Promise<boolean> {
    const workspaces = await this.listForUser(userId);
    return workspaces.length > 0;
  }

  async listForUserWithRoles(userId: string) {
    const workspaces = await this.listForUser(userId);
    const memberships = await this.repo.findMembershipRoles(
      userId,
      workspaces.map((w) => w._id),
    );
    const roleMap = new Map(memberships.map((m) => [String(m.workspaceId), m.role]));

    return workspaces.map((ws) => ({
      id: String(ws._id),
      name: ws.name,
      type: ws.type,
      currency: ws.currency,
      businessName: ws.businessName ?? null,
      role: (roleMap.get(String(ws._id)) ?? "owner") as
        | "owner"
        | "admin"
        | "member"
        | "viewer",
    }));
  }

  getBranding(workspace: {
    businessName?: string | null;
    logoUrl?: string | null;
    taxId?: string | null;
    businessPhone?: string | null;
    businessAddress?: string | null;
  }) {
    return {
      businessName: workspace.businessName ?? "",
      logoUrl: workspace.logoUrl ?? "",
      taxId: workspace.taxId ?? "",
      businessPhone: workspace.businessPhone ?? "",
      businessAddress: workspace.businessAddress ?? "",
    };
  }

  async updateBranding(input: UpdateWorkspaceBrandingInput) {
    const updated = await this.repo.update(input.workspaceId, {
      businessName: input.businessName ?? "",
      logoUrl: input.logoUrl ?? "",
      taxId: input.taxId ?? "",
      businessPhone: input.businessPhone ?? "",
      businessAddress: input.businessAddress ?? "",
    });
    if (!updated) return err(new NotFoundError("workspaceNotFound"));
    return ok(updated);
  }

  async updateCurrency(workspaceId: string, currency: SupportedCurrency) {
    const updated = await this.repo.updateBaseCurrency(workspaceId, currency);
    if (!updated) return err(new NotFoundError("workspaceNotFound"));
    return ok(updated);
  }

  async updateExchangeRates(
    userId: string,
    workspaceId: string,
    baseCurrency: SupportedCurrency,
    rates: Record<string, number>,
  ) {
    const feature = await requirePlanFeature(userId, workspaceId, "multiCurrency");
    if (!feature.ok) return feature;

    for (const [currency, numeric] of Object.entries(rates)) {
      if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(currency)) {
        return err(new AppError("exchangeRateInvalid", "exchangeRateInvalid", 400, { currency }));
      }
      if (currency === baseCurrency) continue;
      if (!Number.isFinite(numeric) || numeric <= 0) {
        return err(
          new AppError("exchangeRateInvalidFor", "exchangeRateInvalidFor", 400, { currency }),
        );
      }
    }

    const cleaned: Record<string, number> = {};
    for (const currency of SUPPORTED_CURRENCIES) {
      if (currency === baseCurrency) continue;
      const value = rates[currency];
      if (value === undefined) continue;
      cleaned[currency] = value;
    }

    const updated = await this.repo.update(workspaceId, { exchangeRates: cleaned });
    if (!updated) return err(new NotFoundError("workspaceNotFound"));
    return ok(updated);
  }

  async listTeam(workspaceId: string) {
    const [members, invitations] = await Promise.all([
      listWorkspaceMembers(workspaceId),
      listPendingInvitations(workspaceId),
    ]);
    return { members, invitations };
  }

  async inviteMember(
    inviter: { userId: string; email: string; name?: string | null },
    input: InviteMemberInput,
    workspaceName: string,
  ): Promise<Result<{ token: string }>> {
    const email = input.email.toLowerCase().trim();

    if (email === inviter.email.toLowerCase()) {
      return err(new AppError("selfInvite", "selfInvite", 400));
    }

    if (!(await workspaceHasTeamFeature(input.workspaceId))) {
      return err(new AppError("teamFeatureRequired", "teamFeatureRequired", 403));
    }

    if (await isWorkspaceMemberByEmail(input.workspaceId, email)) {
      return err(new AppError("alreadyMember", "alreadyMember", 400));
    }

    try {
      await assertInviteRateLimit(inviter.userId);
    } catch (error) {
      if (error instanceof Error && error.message === "inviteRateLimited") {
        return err(new AppError("inviteRateLimited", "inviteRateLimited", 429));
      }
      throw error;
    }

    try {
      const { token } = await createWorkspaceInvitation({
        workspaceId: input.workspaceId,
        email,
        invitedBy: inviter.userId,
        role: input.role,
      });

      await sendWorkspaceInviteEmail({
        to: email,
        workspaceName,
        token,
        inviterName: inviter.name ?? inviter.email,
      });

      return ok({ token });
    } catch (error) {
      if (error instanceof Error && error.message === "memberLimitReached") {
        return err(new AppError("memberLimitReached", "memberLimitReached", 403));
      }
      if (error instanceof Error && error.message === "teamFeatureRequired") {
        return err(new AppError("teamFeatureRequired", "teamFeatureRequired", 403));
      }
      if (error instanceof Error && error.message.includes("duplicate key")) {
        return err(new AppError("invitePending", "invitePending", 400));
      }
      if (error instanceof Error && error.message === "workspaceNotFound") {
        return err(new NotFoundError("workspaceNotFound"));
      }
      throw error;
    }
  }

  async cancelInvitation(invitationId: string, workspaceId: string) {
    await cancelWorkspaceInvitation(invitationId, workspaceId);
    return ok(undefined);
  }

  async removeMember(
    workspaceId: string,
    memberUserId: string,
    actorUserId: string,
  ): Promise<Result<void>> {
    if (memberUserId === actorUserId) {
      return err(new AppError("cannotRemoveSelf", "cannotRemoveSelf", 400));
    }

    const result = await removeWorkspaceMember(workspaceId, memberUserId);
    if (result === "lastOwner") {
      return err(new AppError("lastOwner", "lastOwner", 400));
    }
    return ok(undefined);
  }

  async acceptInvitation(input: {
    token: string;
    userId: string;
    userEmail: string;
  }): Promise<Result<string>> {
    try {
      const workspaceId = await acceptWorkspaceInvitation(input);
      return ok(workspaceId);
    } catch (error) {
      const code = error instanceof Error ? error.message : "acceptFailed";
      if (
        code === "invitationEmailMismatch" ||
        code === "invitationExpired" ||
        code === "invitationInvalid" ||
        code === "memberLimitReached"
      ) {
        const status = code === "memberLimitReached" ? 403 : 400;
        return err(new AppError(code, code, status));
      }
      throw error;
    }
  }

  /** Compatibility: direct field update used by legacy callers / admin. */
  update(workspaceId: string, updates: Parameters<WorkspacesRepository["update"]>[1]) {
    return this.repo.update(workspaceId, updates);
  }

  archive(workspaceId: string) {
    return this.repo.archive(workspaceId);
  }
}

export const workspacesService = new WorkspacesService();