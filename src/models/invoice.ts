import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const invoiceItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    invoiceNumber: { type: String, required: true, trim: true, maxlength: 40 },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, default: null },
    items: { type: [invoiceItemSchema], required: true, minlength: 1 },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

invoiceSchema.index({ workspaceId: 1, isArchived: 1, issueDate: -1 });
invoiceSchema.index({ workspaceId: 1, invoiceNumber: 1 }, { unique: true });

export type InvoiceDocument = InferSchemaType<typeof invoiceSchema>;

export const InvoiceModel: Model<InvoiceDocument> =
  models.Invoice ?? model<InvoiceDocument>("Invoice", invoiceSchema);
