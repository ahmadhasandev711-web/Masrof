import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { SUPPORTED_CURRENCIES } from "@/lib/currency/constants";

const debtSchema = new Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    creditor: { type: String, required: true, trim: true, maxlength: 120 },
    /** Total amount of debt in minor units (e.g. 10000 = 100.00) */
    totalAmount: { type: Number, required: true, min: 1 },
    /** Total amount paid towards this debt in minor units */
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    currency: {
      type: String,
      enum: SUPPORTED_CURRENCIES,
      required: true,
    },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "paid"],
      default: "active",
      index: true,
    },
    category: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

debtSchema.index({ workspaceId: 1, status: 1, isArchived: 1 });
debtSchema.index({ workspaceId: 1, dueDate: 1 });

export type DebtMongoDocument = InferSchemaType<typeof debtSchema>;

export const DebtModel: Model<DebtMongoDocument> =
  models.Debt ?? model<DebtMongoDocument>("Debt", debtSchema);
