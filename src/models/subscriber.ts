import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const subscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      required: true,
      default: "active",
    },
    source: { type: String, trim: true, default: "website" },
  },
  { timestamps: true },
);

subscriberSchema.index({ status: 1, createdAt: -1 });

export type SubscriberDocument = InferSchemaType<typeof subscriberSchema>;

export const SubscriberModel: Model<SubscriberDocument> =
  models.Subscriber ?? model<SubscriberDocument>("Subscriber", subscriberSchema);
