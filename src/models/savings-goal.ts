import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const savingsGoalSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, required: true, default: 0, min: 0 },
    deadline: { type: Date, default: null },
    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

savingsGoalSchema.index({ workspaceId: 1, isArchived: 1 });

export type SavingsGoalDocument = InferSchemaType<typeof savingsGoalSchema>;

export const SavingsGoalModel: Model<SavingsGoalDocument> =
  models.SavingsGoal ?? model<SavingsGoalDocument>("SavingsGoal", savingsGoalSchema);
