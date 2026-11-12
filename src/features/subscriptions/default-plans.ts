import { PLAN_IDS, type PlanId } from "@/features/subscriptions/plans";
import {
  PRO_MONTHLY_EGP,
  PRO_YEARLY_EGP,
  formatBillingAmount,
  proMonthlyPeriod,
} from "@/features/subscriptions/pro-pricing";

export type PlanFlags = {
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
};

/** Quantity caps. Use -1 for unlimited. */
export type PlanQuantityLimits = {
  maxInvoicesPerMonth: number;
  maxClients: number;
  maxActiveProjects: number;
  maxSavingsGoals: number;
  maxRecurringExpenses: number;
};

export type PlanConfigDocument = {
  planId: PlanId;
  priceYearly: number;
  maxWorkspaces: number;
  maxMembers: number;
  maxInvoicesPerMonth: number;
  maxClients: number;
  maxActiveProjects: number;
  maxSavingsGoals: number;
  maxRecurringExpenses: number;
  /** Bumps when product pricing model changes — used to sync Mongo once. */
  limitsVersion: number;
  highlighted: boolean;
  available: boolean;
  sortOrder: number;
  nameAr: string;
  nameEn: string;
  priceDisplayAr: string;
  priceDisplayEn: string;
  periodDisplayAr: string;
  periodDisplayEn: string;
  descriptionAr: string;
  descriptionEn: string;
  featuresAr: string[];
  featuresEn: string[];
  ctaAr: string;
  ctaEn: string;
  flags: PlanFlags;
  updatedBy?: string | null;
};

/** Freemium model v11: Free is 2 invoices, 3 clients, and 1 active project. Pro shows 250 EGP/month. */
export const PLAN_LIMITS_VERSION = 11;

export const PLAN_FLAG_KEYS = [
  "csvExport",
  "pdfExport",
  "recurringExpenses",
  "clientsAndProjects",
  "savingsGoals",
  "bankImport",
  "advancedReports",
  "workspaceBackup",
  "pushNotifications",
  "multiCurrency",
  "whatsappReminders",
  "noAds",
  "teamWorkspace",
  "ocrReceipts",
  "aiCategory",
  "debts",
  "budgets",
] as const satisfies readonly (keyof PlanFlags)[];

export const PLAN_QUANTITY_LIMIT_KEYS = [
  "maxInvoicesPerMonth",
  "maxClients",
  "maxActiveProjects",
  "maxSavingsGoals",
  "maxRecurringExpenses",
] as const satisfies readonly (keyof PlanQuantityLimits)[];

export type PlanFlagKey = (typeof PLAN_FLAG_KEYS)[number];
export type PlanQuantityLimitKey = (typeof PLAN_QUANTITY_LIMIT_KEYS)[number];

const FREE_FLAGS: PlanFlags = {
  csvExport: false,
  pdfExport: false,
  recurringExpenses: false,
  clientsAndProjects: true,
  savingsGoals: false,
  bankImport: false,
  advancedReports: false,
  workspaceBackup: false,
  pushNotifications: false,
  multiCurrency: false,
  whatsappReminders: false,
  noAds: false,
  teamWorkspace: false,
  ocrReceipts: false,
  aiCategory: false,
  debts: false,
  budgets: false,
};

/** Pro absorbs former Plus features. */
const PRO_FLAGS: PlanFlags = {
  csvExport: true,
  pdfExport: true,
  recurringExpenses: true,
  clientsAndProjects: true,
  savingsGoals: true,
  bankImport: true,
  advancedReports: true,
  workspaceBackup: true,
  pushNotifications: true,
  multiCurrency: true,
  whatsappReminders: true,
  noAds: true,
  teamWorkspace: true,
  ocrReceipts: true,
  aiCategory: true,
  debts: true,
  budgets: true,
};

export const DEFAULT_PLAN_FLAGS: Record<PlanId, PlanFlags> = {
  free: FREE_FLAGS,
  pro: PRO_FLAGS,
};

const UNLIMITED = -1;

export const DEFAULT_PLAN_CONFIGS: Record<PlanId, Omit<PlanConfigDocument, "updatedBy">> = {
  free: {
    planId: "free",
    priceYearly: 0,
    maxWorkspaces: 1,
    maxMembers: 1,
    maxInvoicesPerMonth: 2,
    maxClients: 3,
    maxActiveProjects: 1,
    maxSavingsGoals: 0,
    maxRecurringExpenses: 0,
    limitsVersion: PLAN_LIMITS_VERSION,
    highlighted: false,
    available: true,
    sortOrder: 0,
    nameAr: "مجاني",
    nameEn: "Free",
    priceDisplayAr: "٠",
    priceDisplayEn: "0",
    periodDisplayAr: "للأبد",
    periodDisplayEn: "forever",
    descriptionAr: "ابدأ بتنظيم وتتبع أموالك وفواتيرك مجانًا وبأعلى معايير الأمان والخصوصية.",
    descriptionEn: "Start organizing and tracking your finances for free with bank-grade security and privacy.",
    featuresAr: [
      "مساحة عمل واحدة فقط",
      "حسابات وتصنيفات غير محدودة",
      "حتى ٢ فواتير / شهر",
      "حتى ٣ عملاء ومشروع واحد نشط",
      "تقارير شهرية أساسية",
      "يشمل إعلانات",
    ],
    featuresEn: [
      "1 single workspace",
      "Unlimited accounts & categories",
      "Up to 2 invoices / month",
      "Up to 3 clients & 1 active project",
      "Basic monthly reports",
      "Includes ads",
    ],
    ctaAr: "ابدأ مجاناً",
    ctaEn: "Start free",
    flags: DEFAULT_PLAN_FLAGS.free,
  },
  pro: {
    planId: "pro",
    priceYearly: PRO_YEARLY_EGP,
    maxWorkspaces: 1,
    maxMembers: 5,
    maxInvoicesPerMonth: UNLIMITED,
    maxClients: UNLIMITED,
    maxActiveProjects: UNLIMITED,
    maxSavingsGoals: UNLIMITED,
    maxRecurringExpenses: UNLIMITED,
    limitsVersion: PLAN_LIMITS_VERSION,
    highlighted: true,
    available: true,
    sortOrder: 1,
    nameAr: "سندات برو",
    nameEn: "Pro",
    priceDisplayAr: formatBillingAmount(PRO_MONTHLY_EGP, "ar"),
    priceDisplayEn: formatBillingAmount(PRO_MONTHLY_EGP, "en"),
    periodDisplayAr: proMonthlyPeriod("EGP", "ar"),
    periodDisplayEn: proMonthlyPeriod("EGP", "en"),
    descriptionAr: "منظومة مالية متكاملة بدون إعلانات وبلا حدود — للمستقلين، المكاتب، والشركات النشطة.",
    descriptionEn: "Complete, ad-free financial system with no limits — built for freelancers, agencies, and growing businesses.",
    featuresAr: [
      "بدون إعلانات نهائياً",
      "مساحة عمل واحدة + فريق حتى ٥ أعضاء",
      "فواتير وعملاء ومشاريع بلا حدود",
      "الميزانيات وأهداف الادخار والمصاريف المتكررة",
      "OCR قراءة الإيصالات الذكية والتصنيف الآلي",
      "تصدير البيانات المتقدم (CSV, Excel, PDF)",
      "إدارة الديون والأقساط والالتزامات",
    ],
    featuresEn: [
      "100% Ad-free experience",
      "1 workspace + team up to 5 members",
      "Unlimited invoices, clients & projects",
      "Budgets, savings goals & recurring expenses",
      "Smart receipt OCR & automated AI categorization",
      "Complete export suite (CSV, Excel & PDF)",
      "Debts & loan installment tracking",
    ],
    ctaAr: "الترقية إلى برو",
    ctaEn: "Upgrade to Pro",
    flags: DEFAULT_PLAN_FLAGS.pro,
  },
};

export function isValidPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

export function isUnlimitedQuantity(limit: number): boolean {
  return limit === -1;
}
