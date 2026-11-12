import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const INVOICE_STATUSES = ["draft", "sent", "paid", "cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

const invoiceItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 200 },
    /** Line quantity; omitted on legacy invoices (treated as 1). */
    quantity: { type: Number, min: 0.0001, default: 1 },
    /** Unit price in minor currency units; omitted on legacy invoices (treated as amount). */
    unitPrice: { type: Number, min: 1 },
    /** Line total in minor units (= quantity * unitPrice), kept for payments/reports. */
    amount: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    invoiceNumber: { type: String, required: true, trim: true, maxlength: 40 },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, default: null },
    items: { type: [invoiceItemSchema], required: true, minlength: 1 },
    /** Sum of line amounts (minor). Legacy docs may omit — derived from items. */
    subtotal: { type: Number, min: 0 },
    taxEnabled: { type: Boolean, required: true, default: false },
    taxRatePercent: { type: Number, min: 0, max: 100, default: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
    /** Payable total = subtotal + taxAmount (minor). Legacy: sum of items. */
    total: { type: Number, min: 0 },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      required: true,
      default: "sent",
    },
    paidAt: { type: Date, default: null },
    shareToken: { type: String, trim: true, default: null },
    isShareable: { type: Boolean, required: true, default: true },
    viewedAt: { type: Date, default: null },
    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

invoiceSchema.index({ workspaceId: 1, isArchived: 1, issueDate: -1 });
invoiceSchema.index({ workspaceId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ workspaceId: 1, projectId: 1 });
invoiceSchema.index({ shareToken: 1 }, { unique: true, sparse: true });

export type InvoiceDocument = InferSchemaType<typeof invoiceSchema>;

export const InvoiceModel: Model<InvoiceDocument> =
  models.Invoice ?? model<InvoiceDocument>("Invoice", invoiceSchema);
