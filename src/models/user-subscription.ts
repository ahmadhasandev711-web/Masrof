import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PLAN_IDS, type PlanId } from "@/features/subscriptions/plans";

const userSubscriptionSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    plan: { type: String, enum: PLAN_IDS, required: true, default: "free" },
    status: {
      type: String,
      enum: ["active", "cancelled", "suspended"],
      required: true,
      default: "active",
    },
    expiresAt: { type: Date, default: null },
    updatedBy: { type: String, default: null },
    notes: { type: String, maxlength: 500, default: null },
  },
  { timestamps: true },
);

export type UserSubscriptionDocument = InferSchemaType<typeof userSubscriptionSchema> & {
  plan: PlanId;
};

export const UserSubscriptionModel: Model<UserSubscriptionDocument> =
  models.UserSubscription ??
  model<UserSubscriptionDocument>("UserSubscription", userSubscriptionSchema);
