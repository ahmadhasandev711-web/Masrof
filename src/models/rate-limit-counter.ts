import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const rateLimitCounterSchema = new Schema({
  key: { type: String, required: true },
  windowStart: { type: Date, required: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
});

rateLimitCounterSchema.index({ key: 1, windowStart: 1 }, { unique: true });
rateLimitCounterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitCounterDocument = InferSchemaType<typeof rateLimitCounterSchema>;

export const RateLimitCounterModel: Model<RateLimitCounterDocument> =
  models.RateLimitCounter ??
  model<RateLimitCounterDocument>("RateLimitCounter", rateLimitCounterSchema);
