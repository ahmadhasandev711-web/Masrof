import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const debtPaymentSchema = new Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    debtId: { type: String, required: true, index: true },
    /** Paid amount in minor units */
    amount: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, required: true, default: Date.now },
    accountId: { type: String, required: true },
    transactionId: { type: String, required: true },
    reference: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    idempotencyKey: { type: String, trim: true, maxlength: 64, default: null },
  },
  { timestamps: true },
);

debtPaymentSchema.index({ workspaceId: 1, debtId: 1, paymentDate: -1 });
debtPaymentSchema.index(
  { workspaceId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);
debtPaymentSchema.index({ workspaceId: 1, transactionId: 1 });

export type DebtPaymentMongoDocument = InferSchemaType<typeof debtPaymentSchema>;

export const DebtPaymentModel: Model<DebtPaymentMongoDocument> =
  models.DebtPayment ?? model<DebtPaymentMongoDocument>("DebtPayment", debtPaymentSchema);
