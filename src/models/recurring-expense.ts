import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const RECURRING_FREQUENCIES = ["monthly", "weekly"] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

const recurringExpenseSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    amount: { type: Number, required: true, min: [1, "المبلغ لازم يكون أكبر من صفر"] },
    description: { type: String, trim: true, maxlength: 140, default: "" },
    frequency: { type: String, enum: RECURRING_FREQUENCIES, required: true },
    // Day of month (1–28) when frequency is monthly.
    dayOfMonth: { type: Number, min: 1, max: 28 },
    // Day of week (0=Sun … 6=Sat) when frequency is weekly.
    dayOfWeek: { type: Number, min: 0, max: 6 },
    nextDueDate: { type: Date, required: true },
    isActive: { type: Boolean, required: true, default: true },
    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

recurringExpenseSchema.index({ workspaceId: 1, isArchived: 1, isActive: 1, nextDueDate: 1 });

export type RecurringExpenseDocument = InferSchemaType<typeof recurringExpenseSchema>;

export const RecurringExpenseModel: Model<RecurringExpenseDocument> =
  models.RecurringExpense ??
  model<RecurringExpenseDocument>("RecurringExpense", recurringExpenseSchema);
