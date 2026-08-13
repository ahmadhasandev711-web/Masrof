import { PLAN_IDS, type PlanId } from "@/features/subscriptions/plans";

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

/** Current freemium model: Free + ads (capped) / Pro $5 (unlimited + no ads). */
export const PLAN_LIMITS_VERSION = 2;

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
  recurringExpenses: true,
  clientsAndProjects: true,
  savingsGoals: true,
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
};

export const DEFAULT_PLAN_FLAGS: Record<PlanId, PlanFlags> = {
  free: FREE_FLAGS,
  pro: PRO_FLAGS,
  /** Legacy id — same entitlements as Pro; hidden from pricing. */
  plus: PRO_FLAGS,
};

const UNLIMITED = -1;

export const DEFAULT_PLAN_CONFIGS: Record<PlanId, Omit<PlanConfigDocument, "updatedBy">> = {
  free: {
    planId: "free",
    priceYearly: 0,
    maxWorkspaces: 1,
    maxMembers: 1,
    maxInvoicesPerMonth: 10,
    maxClients: 20,
    maxActiveProjects: 5,
    maxSavingsGoals: 2,
    maxRecurringExpenses: 3,
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
    descriptionAr: "تابع فلوسك مجانًا — مع إعلانات وحدود بسيطة تناسب البداية.",
    descriptionEn: "Track your money for free — with ads and simple limits for getting started.",
    featuresAr: [
      "مساحة عمل واحدة",
      "حسابات وتصنيفات وميزانيات غير محدودة",
      "حتى ١٠ فواتير / شهر",
      "حتى ٢٠ عميل و٥ مشاريع نشطة",
      "تقارير شهرية أساسية",
      "يشمل إعلانات",
    ],
    featuresEn: [
      "One workspace",
      "Unlimited accounts, categories & budgets",
      "Up to 10 invoices / month",
      "Up to 20 clients & 5 active projects",
      "Basic monthly reports",
      "Includes ads",
    ],
    ctaAr: "ابدأ مجاناً",
    ctaEn: "Start free",
    flags: DEFAULT_PLAN_FLAGS.free,
  },
  pro: {
    planId: "pro",
    priceYearly: 48,
    maxWorkspaces: 3,
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
    nameAr: "باقة برو",
    nameEn: "Pro",
    priceDisplayAr: "٥",
    priceDisplayEn: "5",
    periodDisplayAr: "دولار / شهر",
    periodDisplayEn: "USD / month",
    descriptionAr: "بدون إعلانات، بلا حدود تقريبًا — للفيري لانسر اللي بيشتغل بجد.",
    descriptionEn: "Ad-free and nearly unlimited — for freelancers who work seriously.",
    featuresAr: [
      "بدون إعلانات",
      "٣ مساحات عمل + فريق حتى ٥",
      "فواتير وعملاء ومشاريع بلا حدود",
      "تقارير متقدمة + استيراد بنك",
      "OCR إيصالات + تصنيف ذكي",
      "تصدير CSV و Excel و PDF",
      "نسخ احتياطي وتذكيرات واتساب",
      "أو ٤٨ دولار / سنة",
    ],
    featuresEn: [
      "Ad-free experience",
      "3 workspaces + team up to 5",
      "Unlimited invoices, clients & projects",
      "Advanced reports + bank import",
      "Receipt OCR + smart categories",
      "CSV, Excel & PDF export",
      "Backup & WhatsApp reminders",
      "Or $48 / year",
    ],
    ctaAr: "ترقّى لبرو",
    ctaEn: "Upgrade to Pro",
    flags: DEFAULT_PLAN_FLAGS.pro,
  },
  plus: {
    planId: "plus",
    priceYearly: 48,
    maxWorkspaces: 3,
    maxMembers: 5,
    maxInvoicesPerMonth: UNLIMITED,
    maxClients: UNLIMITED,
    maxActiveProjects: UNLIMITED,
    maxSavingsGoals: UNLIMITED,
    maxRecurringExpenses: UNLIMITED,
    limitsVersion: PLAN_LIMITS_VERSION,
    highlighted: false,
    available: false,
    sortOrder: 2,
    nameAr: "بلس (قديم)",
    nameEn: "Plus (legacy)",
    priceDisplayAr: "٥",
    priceDisplayEn: "5",
    periodDisplayAr: "دولار / شهر",
    periodDisplayEn: "USD / month",
    descriptionAr: "باقة قديمة — نفس مميزات برو. مخفية من صفحة الأسعار.",
    descriptionEn: "Legacy plan — same as Pro. Hidden from pricing.",
    featuresAr: ["نفس مميزات برو"],
    featuresEn: ["Same as Pro"],
    ctaAr: "تواصل معنا",
    ctaEn: "Contact us",
    flags: DEFAULT_PLAN_FLAGS.plus,
  },
};

export function isValidPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

export function isUnlimitedQuantity(limit: number): boolean {
  return limit === -1;
}
