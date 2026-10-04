import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { SUPPORTED_CURRENCIES } from "@/lib/currency/constants";

import { WORKSPACE_TYPES, type WorkspaceType } from "@/features/workspaces/constants";
export { WORKSPACE_TYPES, type WorkspaceType };

export { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/currency/constants";

const workspaceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },

    type: {
      type: String,
      enum: WORKSPACE_TYPES,
      required: true,
    },

    currency: {
      type: String,
      enum: SUPPORTED_CURRENCIES,
      required: true,
      default: "EGP",
    },

    // Manual rates: 1 unit of foreign currency = X units of workspace.currency (major).
    exchangeRates: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },

    // Optional branding shown on invoices / print.
    businessName: { type: String, trim: true, maxlength: 120, default: "" },
    logoUrl: { type: String, trim: true, maxlength: 500, default: "" },
    taxId: { type: String, trim: true, maxlength: 60, default: "" },
    businessPhone: { type: String, trim: true, maxlength: 30, default: "" },
    businessAddress: { type: String, trim: true, maxlength: 240, default: "" },

    // Denormalized owner id (better-auth user id, a plain string — better-auth
    // manages its own `user` collection separately from our Mongoose models).
    // Kept alongside WorkspaceMembership for fast "my workspaces" queries
    // without an extra join; WorkspaceMembership remains the source of
    // truth for access control since it's what supports future multi-member
    // workspaces without a schema change.
    ownerId: { type: String, required: true, index: true },

    // Per-workspace subscription fields
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
      index: true,
    },
    planStatus: {
      type: String,
      enum: ["active", "cancelled", "suspended"],
      default: "active",
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },

    adminNotes: { type: String, trim: true, maxlength: 2000, default: "" },

    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// Every "list my workspaces, newest first, excluding archived" query hits this.
workspaceSchema.index({ ownerId: 1, isArchived: 1, createdAt: -1 });

export type WorkspaceDocument = InferSchemaType<typeof workspaceSchema>;

export const WorkspaceModel: Model<WorkspaceDocument> =
  models.Workspace ?? model<WorkspaceDocument>("Workspace", workspaceSchema);
