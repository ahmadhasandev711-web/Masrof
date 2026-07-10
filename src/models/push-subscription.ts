import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const pushSubscriptionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    subscription: {
      endpoint: { type: String, required: true },
      expirationTime: { type: Number, default: null },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
      },
    },
    userAgent: { type: String, trim: true, maxlength: 300, default: null },
    lastSeenAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

pushSubscriptionSchema.index({ userId: 1, updatedAt: -1 });

export type PushSubscriptionDocument = InferSchemaType<typeof pushSubscriptionSchema>;

export const PushSubscriptionModel: Model<PushSubscriptionDocument> =
  models.PushSubscription ??
  model<PushSubscriptionDocument>("PushSubscription", pushSubscriptionSchema);
