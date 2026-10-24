import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const writeIdempotencySchema = new Schema(
  {
    scopeType: { type: String, enum: ["workspace", "user"], required: true },
    scopeId: { type: String, required: true, trim: true },
    idempotencyKey: { type: String, required: true, trim: true, maxlength: 64 },
    resourceType: { type: String, required: true, trim: true, maxlength: 40 },
    resourceId: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

writeIdempotencySchema.index({ scopeType: 1, scopeId: 1, idempotencyKey: 1 }, { unique: true });

export type WriteIdempotencyDocument = InferSchemaType<typeof writeIdempotencySchema>;

export const WriteIdempotencyModel: Model<WriteIdempotencyDocument> =
  models.WriteIdempotency ?? model<WriteIdempotencyDocument>("WriteIdempotency", writeIdempotencySchema);
