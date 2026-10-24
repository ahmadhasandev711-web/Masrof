import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { WORKSPACE_TYPES } from "@/models/workspace";

export const CATEGORY_KINDS = ["income", "expense"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

/**
 * CATEGORY ARCHITECTURE (analyzed before implementation):
 *
 * A single collection serves both:
 *   - System categories: `workspaceId: null`, `isSystem: true`. Shared by
 *     EVERY workspace — never duplicated per workspace. Seeded once via
 *     `scripts/seed-categories.ts`, immutable by users.
 *   - Custom categories: `workspaceId: <id>`, `isSystem: false`. Owned by
 *     exactly one workspace, created/archived by its user.
 *
 * "Which categories can workspace X use?" is always the query
 *   { $or: [{ workspaceId: null }, { workspaceId: X }] }
 * — never a copy-on-create step. This is why creating a workspace doesn't
 * insert any Category documents.
 *
 * `suggestedFor` only applies to system categories: it says which
 * workspace type(s) this category should be highlighted for by default
 * (e.g. "Client Payments" is suggested for freelance workspaces) without
 * preventing a personal workspace from using it too if the user wants to.
 */
const categorySchema = new Schema(
  {
    /** Primary (Arabic) display name — canonical for `ar` locale and exports. */
    name: { type: String, required: true, trim: true, maxlength: 60 },

    /** English display name for system categories and optional bilingual custom categories. */
    nameEn: { type: String, default: null, trim: true, maxlength: 60 },

    kind: {
      type: String,
      enum: CATEGORY_KINDS,
      required: true,
    },

    // null = system category, available to every workspace.
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", default: null },

    isSystem: { type: Boolean, required: true, default: false },

    // Stable key used only by system categories so the seed script can
    // upsert idempotently instead of checking name strings.
    slug: { type: String, default: null },

    suggestedFor: {
      type: [{ type: String, enum: WORKSPACE_TYPES }],
      default: [],
    },

    /** Legacy; UI uses slug-based SVG icons. Kept for API compatibility, cleared on seed. */
    icon: { type: String, default: null },

    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// "Categories usable by this workspace" is the hot path.
categorySchema.index({ workspaceId: 1, kind: 1, isArchived: 1 });
// Seed script upserts by slug for system categories.
categorySchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $type: "string" } } },
);

export type CategoryDocument = InferSchemaType<typeof categorySchema>;

export const CategoryModel: Model<CategoryDocument> =
  models.Category ?? model<CategoryDocument>("Category", categorySchema);
