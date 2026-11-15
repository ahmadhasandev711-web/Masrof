/**
 * Domain enums shared by the web app (models, forms, services) and the mobile app.
 * Pure data: no mongoose, no Next, no React. Mongoose models re-export these.
 */

export const SUPPORTED_CURRENCIES = ["EGP", "USD", "EUR", "SAR", "AED"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const ACCOUNT_TYPES = [
  "cash",
  "bank",
  "mobile_wallet",
  "credit_card",
  "savings",
  "other",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const CATEGORY_KINDS = ["income", "expense"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** Egyptian wallets offered as one-tap names when the account type is `mobile_wallet`. */
export const MOBILE_WALLET_PRESETS = [
  { key: "vodafone", icon: "" },
  { key: "etisalat", icon: "" },
  { key: "orange", icon: "" },
  { key: "instapay", icon: "" },
  { key: "wePay", icon: "" },
] as const;
export type MobileWalletPresetKey = (typeof MOBILE_WALLET_PRESETS)[number]["key"];

/** Workspace permissions: same rule on the web pages and in the app. */
export function isWorkspaceOwner(role: string): boolean {
  return role === "owner";
}

export function canWorkspaceWrite(role: string): boolean {
  return role !== "viewer";
}
