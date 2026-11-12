import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const templateItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 200 },
    quantity: { type: Number, required: true, min: 0.0001, default: 1 },
    /** Unit price in minor currency units. */
    unitPrice: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const invoiceTemplateSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    items: { type: [templateItemSchema], required: true, minlength: 1 },
    taxEnabled: { type: Boolean, required: true, default: false },
    taxRatePercent: { type: Number, min: 0, max: 100, default: 0 },
    sortOrder: { type: Number, required: true, default: 0 },
    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

invoiceTemplateSchema.index({ workspaceId: 1, isArchived: 1, sortOrder: 1 });
invoiceTemplateSchema.index({ workspaceId: 1, isArchived: 1, name: 1 });

export type InvoiceTemplateDocument = InferSchemaType<typeof invoiceTemplateSchema>;

export const InvoiceTemplateModel: Model<InvoiceTemplateDocument> =
  models.InvoiceTemplate ??
  model<InvoiceTemplateDocument>("InvoiceTemplate", invoiceTemplateSchema);

export const MAX_INVOICE_TEMPLATES_PER_WORKSPACE = 20;
