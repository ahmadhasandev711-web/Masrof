import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "card",
  "check",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const invoicePaymentSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", required: true, unique: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true, index: true },

    // Stored as integer minor units (e.g. piastres or cents)
    amount: {
      type: Number,
      required: true,
      min: [1, "المبلغ لازم يكون أكبر من صفر"],
    },

    paymentDate: { type: Date, required: true },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
      default: "bank_transfer",
    },

    reference: { type: String, trim: true, maxlength: 100, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },

    // Ensures client retries do not record duplicate payments or double-charge accounts
    idempotencyKey: { type: String, required: true, trim: true, maxlength: 64 },

    createdBy: { type: String, required: true },

    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// Fast payment lookups per invoice
invoicePaymentSchema.index({ workspaceId: 1, invoiceId: 1, isArchived: 1 });

// Strictly prevents duplicate payment submissions per workspace
invoicePaymentSchema.index({ workspaceId: 1, idempotencyKey: 1 }, { unique: true });

export type InvoicePaymentDocument = InferSchemaType<typeof invoicePaymentSchema>;

export const InvoicePaymentModel: Model<InvoicePaymentDocument> =
  models.InvoicePayment ?? model<InvoicePaymentDocument>("InvoicePayment", invoicePaymentSchema);
