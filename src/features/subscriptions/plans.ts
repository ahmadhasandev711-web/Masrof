export const PLAN_IDS = ["free", "pro"] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export type PlanDefinition = {
  id: PlanId;
  nameAr: string;
  priceYearly: number;
  priceDisplay: string;
  periodDisplay: string;
  description: string;
  features: string[];
  maxWorkspaces: number;
  csvExport: boolean;
  pdfExport: boolean;
  recurringExpenses: boolean;
  clientsAndProjects: boolean;
  savingsGoals: boolean;
  bankImport: boolean;
  advancedReports: boolean;
  workspaceBackup: boolean;
  pushNotifications: boolean;
  multiCurrency: boolean;
  whatsappReminders: boolean;
  noAds: boolean;
  teamWorkspace: boolean;
  ocrReceipts: boolean;
  aiCategory: boolean;
  debts: boolean;
  budgets: boolean;
  highlighted: boolean;
  cta: string;
  available: boolean;
};

export const PRICING_PLANS_ORDER: PlanId[] = ["free", "pro"];

export type PlanFeature =
  | "csvExport"
  | "pdfExport"
  | "recurringExpenses"
  | "clientsAndProjects"
  | "savingsGoals"
  | "bankImport"
  | "advancedReports"
  | "workspaceBackup"
  | "pushNotifications"
  | "multiCurrency"
  | "whatsappReminders"
  | "noAds"
  | "teamWorkspace"
  | "ocrReceipts"
  | "aiCategory"
  | "debts"
  | "budgets";

export function isPlanId(value: string): value is PlanId {
  return PLAN_IDS.includes(value as PlanId);
}
