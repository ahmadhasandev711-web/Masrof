import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Moves money between two accounts in the same workspace.
 * Kept separate from Transaction so reports (income/expense) stay clean.
 */
const transferSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    fromAccountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    toAccountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    amount: { type: Number, required: true, min: [1, "المبلغ لازم يكون أكبر من صفر"] },
    transferDate: { type: Date, required: true },
    description: { type: String, trim: true, maxlength: 140, default: "" },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    createdBy: { type: String, required: true },
    idempotencyKey: { type: String, trim: true, maxlength: 64, default: null },
    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

transferSchema.index({ workspaceId: 1, isArchived: 1, transferDate: -1 });
transferSchema.index(
  { workspaceId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);

export type TransferDocument = InferSchemaType<typeof transferSchema>;

export const TransferModel: Model<TransferDocument> =
  models.Transfer ?? model<TransferDocument>("Transfer", transferSchema);
