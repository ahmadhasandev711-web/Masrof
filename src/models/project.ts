import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PROJECT_STATUSES } from "@/features/projects/constants";

export type { ProjectStatus } from "@/features/projects/constants";
export { PROJECT_STATUSES } from "@/features/projects/constants";

const projectSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    name: { type: String, required: true, trim: true, maxlength: 140 },
    status: { type: String, enum: PROJECT_STATUSES, required: true, default: "active" },
    expectedAmount: { type: Number, default: null, min: 0 },
    dueDate: { type: Date, default: null },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

projectSchema.index({ workspaceId: 1, isArchived: 1, status: 1 });
projectSchema.index({ workspaceId: 1, clientId: 1, isArchived: 1 });

export type ProjectDocument = InferSchemaType<typeof projectSchema>;

export const ProjectModel: Model<ProjectDocument> =
  models.Project ?? model<ProjectDocument>("Project", projectSchema);
