import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { SUPPORTED_CURRENCIES } from "@/lib/currency/constants";

export const ACCOUNT_TYPES = [
  "cash",
  "bank",
  "mobile_wallet",
  "credit_card",
  "savings",
  "other",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

const accountSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },

    name: { type: String, required: true, trim: true, maxlength: 60 },

    type: {
      type: String,
      enum: ACCOUNT_TYPES,
      required: true,
    },

    currency: {
      type: String,
      enum: SUPPORTED_CURRENCIES,
      default: null,
    },

    // All monetary fields are integers in this account currency's minor unit
    // unit (piastres for EGP, cents for USD...) — see lib/money.
    openingBalance: { type: Number, required: true, default: 0 },

    // BALANCE STRATEGY (hybrid — see features/accounts/data.ts for the
    // authoritative explanation):
    // `cachedBalance` is what every read (dashboard, account list) uses,
    // updated atomically alongside every transaction write. Transactions
    // themselves remain the real source of truth; `recalculateBalance()`
    // recomputes this field from scratch whenever we need a integrity check.
    cachedBalance: { type: Number, required: true, default: 0 },

    isArchived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// "List all accounts in this workspace" is the hot path for this collection.
accountSchema.index({ workspaceId: 1, isArchived: 1, createdAt: 1 });

export type AccountDocument = InferSchemaType<typeof accountSchema>;

export const AccountModel: Model<AccountDocument> =
  models.Account ?? model<AccountDocument>("Account", accountSchema);
