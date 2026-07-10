import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { INVITABLE_WORKSPACE_ROLES } from "@/models/workspace-membership";

const workspaceInvitationSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    role: { type: String, enum: INVITABLE_WORKSPACE_ROLES, required: true, default: "member" },
    token: { type: String, required: true, unique: true, index: true },
    invitedBy: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

workspaceInvitationSchema.index(
  { workspaceId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { acceptedAt: null, cancelledAt: null },
  },
);

export type WorkspaceInvitationDocument = InferSchemaType<typeof workspaceInvitationSchema>;

export const WorkspaceInvitationModel: Model<WorkspaceInvitationDocument> =
  models.WorkspaceInvitation ??
  model<WorkspaceInvitationDocument>("WorkspaceInvitation", workspaceInvitationSchema);
