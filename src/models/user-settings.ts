import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const userSettingsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    whatsappPhone: { type: String, trim: true, maxlength: 30, default: null },
  },
  { timestamps: true },
);

userSettingsSchema.index(
  { whatsappPhone: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { whatsappPhone: { $type: "string", $gt: "" } },
  },
);

export type UserSettingsDocument = InferSchemaType<typeof userSettingsSchema>;

export const UserSettingsModel: Model<UserSettingsDocument> =
  models.UserSettings ?? model<UserSettingsDocument>("UserSettings", userSettingsSchema);
