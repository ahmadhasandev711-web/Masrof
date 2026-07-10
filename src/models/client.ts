import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const clientSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, maxlength: 120, default: null },
    phone: { type: String, trim: true, maxlength: 30, default: null },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

clientSchema.index({ workspaceId: 1, isArchived: 1, name: 1 });

export type ClientDocument = InferSchemaType<typeof clientSchema>;

export const ClientModel: Model<ClientDocument> =
  models.Client ?? model<ClientDocument>("Client", clientSchema);
