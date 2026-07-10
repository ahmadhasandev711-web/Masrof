import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const emailNotificationLogSchema = new Schema(
  {
    dedupeKey: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: null },
    notificationType: { type: String, required: true },
    sentAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false },
);

export type EmailNotificationLogDocument = InferSchemaType<typeof emailNotificationLogSchema>;

export const EmailNotificationLogModel: Model<EmailNotificationLogDocument> =
  models.EmailNotificationLog ??
  model<EmailNotificationLogDocument>("EmailNotificationLog", emailNotificationLogSchema);
