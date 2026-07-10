import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Budgets are intentionally simple per the product brief: a monthly
 * spending limit, either workspace-wide (`categoryId: null`) or scoped to
 * one expense category. There is no start/end date bookkeeping — a budget
 * always evaluates against "this calendar month" when read, and no
 * forecasting or rollover logic exists. If that's ever needed, it belongs
 * in a future, deliberate iteration, not bolted on here.
 */
const budgetSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },

    name: { type: String, required: true, trim: true, maxlength: 60 },

    // null = applies to the whole workspace's expenses; otherwise scoped
    // to a single category (e.g. "Monthly Food Budget").
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },

    // Monthly limit, in minor currency units — see lib/money.
    amount: { type: Number, required: true, min: [1, "الميزانية لازم تكون أكبر من صفر"] },

    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

budgetSchema.index({ workspaceId: 1, isArchived: 1 });

export type BudgetDocument = InferSchemaType<typeof budgetSchema>;

export const BudgetModel: Model<BudgetDocument> =
  models.Budget ?? model<BudgetDocument>("Budget", budgetSchema);
