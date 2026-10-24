import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/**
 * `amount` is ALWAYS stored as a positive integer in minor currency units.
 * `type` (income/expense) determines the sign of its effect on the
 * account's balance — never store a negative amount for an expense.
 * This keeps every aggregation (`$sum: "$amount"` grouped by type) simple
 * and unambiguous, instead of having to branch on sign everywhere.
 */
const transactionSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },

    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [1, "المبلغ لازم يكون أكبر من صفر"],
    },

    transactionDate: { type: Date, required: true },

    description: { type: String, trim: true, maxlength: 140, default: "" },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },

    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    attachmentUrl: { type: String, trim: true, default: null },
    attachmentName: { type: String, trim: true, maxlength: 120, default: null },

    // better-auth user id of whoever recorded this entry.
    createdBy: { type: String, required: true },

    idempotencyKey: { type: String, trim: true, maxlength: 64, default: null },

    // Soft-deleted rather than hard-deleted, so historical reports stay
    // reconstructible and an accidental delete is always recoverable.
    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// The list/filter/report screen is the single hottest query path in the
// whole app: "this workspace's transactions, newest first" with optional
// filters layered on top of that same prefix.
transactionSchema.index({
  workspaceId: 1,
  isArchived: 1,
  transactionDate: -1,
  createdAt: -1,
});
// Dashboard summaries and reports filter by transaction kind before scanning
// a date range, so keep that equality field ahead of the range field.
transactionSchema.index({
  workspaceId: 1,
  isArchived: 1,
  type: 1,
  transactionDate: -1,
});
transactionSchema.index({ workspaceId: 1, accountId: 1, isArchived: 1 });
transactionSchema.index({ workspaceId: 1, categoryId: 1, isArchived: 1 });
transactionSchema.index({ workspaceId: 1, clientId: 1, isArchived: 1 });
transactionSchema.index({ workspaceId: 1, projectId: 1, isArchived: 1 });
// Helps prefix/anchored description search; kept as a plain index so
// substring `$regex` behaviour is unchanged (a `$text` index would only
// match whole words and change search UX).
transactionSchema.index({ workspaceId: 1, description: 1 });
transactionSchema.index(
  { workspaceId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);

export type TransactionDocument = InferSchemaType<typeof transactionSchema>;

export const TransactionModel: Model<TransactionDocument> =
  models.Transaction ?? model<TransactionDocument>("Transaction", transactionSchema);
