import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PLAN_IDS } from "@/features/subscriptions/plans";
import { PLAN_FLAG_KEYS } from "@/features/subscriptions/default-plans";

const planFlagsSchema = new Schema(
  Object.fromEntries(PLAN_FLAG_KEYS.map((key) => [key, { type: Boolean, required: true }])),
  { _id: false },
);

const planConfigSchema = new Schema(
  {
    planId: { type: String, enum: PLAN_IDS, required: true, unique: true },
    priceYearly: { type: Number, required: true, min: 0 },
    maxWorkspaces: { type: Number, required: true },
    maxMembers: { type: Number, required: true, default: 1 },
    maxInvoicesPerMonth: { type: Number, required: true, default: -1 },
    maxClients: { type: Number, required: true, default: -1 },
    maxActiveProjects: { type: Number, required: true, default: -1 },
    maxSavingsGoals: { type: Number, required: true, default: -1 },
    maxRecurringExpenses: { type: Number, required: true, default: -1 },
    limitsVersion: { type: Number, required: true, default: 2 },
    highlighted: { type: Boolean, required: true, default: false },
    available: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, required: true, default: 0 },
    nameAr: { type: String, required: true, trim: true, maxlength: 80 },
    nameEn: { type: String, required: true, trim: true, maxlength: 80 },
    priceDisplayAr: { type: String, required: true, trim: true, maxlength: 40 },
    priceDisplayEn: { type: String, required: true, trim: true, maxlength: 40 },
    periodDisplayAr: { type: String, required: true, trim: true, maxlength: 40 },
    periodDisplayEn: { type: String, required: true, trim: true, maxlength: 40 },
    descriptionAr: { type: String, required: true, trim: true, maxlength: 500 },
    descriptionEn: { type: String, required: true, trim: true, maxlength: 500 },
    featuresAr: { type: [String], default: [] },
    featuresEn: { type: [String], default: [] },
    ctaAr: { type: String, required: true, trim: true, maxlength: 60 },
    ctaEn: { type: String, required: true, trim: true, maxlength: 60 },
    flags: { type: planFlagsSchema, required: true },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true },
);

export type PlanConfigMongoDocument = InferSchemaType<typeof planConfigSchema>;

export const PlanConfigModel: Model<PlanConfigMongoDocument> =
  models.PlanConfig ?? model<PlanConfigMongoDocument>("PlanConfig", planConfigSchema);
