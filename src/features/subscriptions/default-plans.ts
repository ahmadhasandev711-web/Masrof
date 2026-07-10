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

export type PlanConfigDocument = {
  planId: PlanId;
  priceYearly: number;
  maxWorkspaces: number;
  maxMembers: number;
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

export type PlanFlagKey = (typeof PLAN_FLAG_KEYS)[number];

export const DEFAULT_PLAN_FLAGS: Record<PlanId, PlanFlags> = {
  free: {
    csvExport: false,
    pdfExport: false,
    recurringExpenses: false,
    clientsAndProjects: false,
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
  },
  pro: {
    csvExport: true,
    pdfExport: true,
    recurringExpenses: true,
    clientsAndProjects: true,
    savingsGoals: true,
    bankImport: false,
    advancedReports: false,
    workspaceBackup: true,
    pushNotifications: true,
    multiCurrency: true,
    whatsappReminders: true,
    noAds: true,
    teamWorkspace: false,
    ocrReceipts: false,
    aiCategory: false,
  },
  plus: {
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
  },
};

export const DEFAULT_PLAN_CONFIGS: Record<PlanId, Omit<PlanConfigDocument, "updatedBy">> = {
  free: {
    planId: "free",
    priceYearly: 0,
    maxWorkspaces: 1,
    maxMembers: 1,
    highlighted: true,
    available: true,
    sortOrder: 0,
    nameAr: "مجاني",
    nameEn: "Free",
    priceDisplayAr: "٠",
    priceDisplayEn: "0",
    periodDisplayAr: "للأبد",
    periodDisplayEn: "forever",
    descriptionAr: "مثالي للأفراد اللي بيبدأوا يتابعوا فلوسهم.",
    descriptionEn: "Perfect for individuals starting to track their money.",
    featuresAr: ["مساحة عمل واحدة", "حسابات وتصنيفات غير محدودة", "تقارير شهرية", "ميزانيات أساسية"],
    featuresEn: [
      "One workspace",
      "Unlimited accounts & categories",
      "Monthly reports",
      "Basic budgets",
    ],
    ctaAr: "ابدأ مجاناً",
    ctaEn: "Start free",
    flags: DEFAULT_PLAN_FLAGS.free,
  },
  pro: {
    planId: "pro",
    priceYearly: 500,
    maxWorkspaces: 3,
    maxMembers: 1,
    highlighted: false,
    available: false,
    sortOrder: 1,
    nameAr: "باقة برو",
    nameEn: "Pro",
    priceDisplayAr: "٥٠٠",
    priceDisplayEn: "500",
    periodDisplayAr: "ج.م / سنة",
    periodDisplayEn: "EGP / year",
    descriptionAr: "للمستقلين اللي محتاجين أكتر من مساحة وأدوات احترافية.",
    descriptionEn: "For freelancers who need more workspaces and pro tools.",
    featuresAr: [
      "٣ مساحات عمل",
      "عملاء ومشاريع ومستحقات",
      "أهداف ادخار",
      "تصدير CSV و Excel و PDF",
      "مصاريف متكررة",
      "تذكيرات واتساب",
      "نسخ احتياطي واستعادة",
      "إشعارات Push",
      "عملات متعددة",
      "بدون إعلانات",
      "دعم أولوية",
    ],
    featuresEn: [
      "3 workspaces",
      "Clients, projects & receivables",
      "Savings goals",
      "CSV, Excel & PDF export",
      "Recurring expenses",
      "WhatsApp reminders",
      "Backup & restore",
      "Push notifications",
      "Multi-currency",
      "Ad-free experience",
      "Priority support",
    ],
    ctaAr: "تواصل للترقية",
    ctaEn: "Contact to upgrade",
    flags: DEFAULT_PLAN_FLAGS.pro,
  },
  plus: {
    planId: "plus",
    priceYearly: 1000,
    maxWorkspaces: -1,
    maxMembers: 5,
    highlighted: false,
    available: false,
    sortOrder: 2,
    nameAr: "بلس",
    nameEn: "Plus",
    priceDisplayAr: "١٬٠٠٠",
    priceDisplayEn: "1,000",
    periodDisplayAr: "ج.م / سنة",
    periodDisplayEn: "EGP / year",
    descriptionAr: "للفرق والمشاريع اللي بتكبر ومحتاجة مرونة كاملة.",
    descriptionEn: "For growing teams that need full flexibility.",
    featuresAr: [
      "مساحات غير محدودة",
      "كل ميزات برو",
      "استيراد كشف بنك CSV",
      "تقارير متقدمة وتوقعات",
      "مساحة فريق (حتى ٥ أعضاء)",
      "مسح إيصالات OCR",
      "تصنيف ذكي بالذكاء الاصطناعي",
      "أولوية في الدعم",
    ],
    featuresEn: [
      "Unlimited workspaces",
      "All Pro features",
      "Bank CSV import",
      "Advanced reports & forecasts",
      "Team workspace (up to 5 members)",
      "Receipt OCR scanning",
      "AI category suggestions",
      "Top priority support",
    ],
    ctaAr: "تواصل للترقية",
    ctaEn: "Contact to upgrade",
    flags: DEFAULT_PLAN_FLAGS.plus,
  },
};

export function isValidPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}
