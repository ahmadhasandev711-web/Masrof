import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * WorkspaceMembership is the single source of truth for "can this user
 * touch this workspace's data?" Every feature that reads/writes anything
 * scoped to a workspace (accounts, transactions, categories, budgets...)
 * must resolve through this collection — never trust a workspaceId that
 * arrives from the client without checking membership first.
 *
 * Only "owner" exists today (the MVP has no team features), but modeling
 * membership as its own collection now means adding "member"/"viewer"
 * roles later is an additive change, not a schema migration.
 */
export const WORKSPACE_ROLES = ["owner", "member", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const INVITABLE_WORKSPACE_ROLES = ["member", "viewer"] as const;
export type InvitableWorkspaceRole = (typeof INVITABLE_WORKSPACE_ROLES)[number];

const workspaceMembershipSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },

    // better-auth user id (string, not a Mongoose ObjectId — better-auth
    // owns its own user/session collections independently).
    userId: { type: String, required: true },

    role: {
      type: String,
      enum: WORKSPACE_ROLES,
      required: true,
      default: "owner",
    },
  },
  { timestamps: true },
);

// A user can only belong to a given workspace once.
workspaceMembershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
// "Which workspaces does this user belong to?" — the other hot query path.
workspaceMembershipSchema.index({ userId: 1 });

export type WorkspaceMembershipDocument = InferSchemaType<typeof workspaceMembershipSchema>;

export const WorkspaceMembershipModel: Model<WorkspaceMembershipDocument> =
  models.WorkspaceMembership ??
  model<WorkspaceMembershipDocument>("WorkspaceMembership", workspaceMembershipSchema);
