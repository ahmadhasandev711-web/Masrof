import type { CategoryKind } from "@/models/category";
import type { WorkspaceType } from "@/models/workspace";

export type SystemCategorySeed = {
  slug: string;
  name: string;
  nameEn: string;
  kind: CategoryKind;
  icon: string;
  suggestedFor: WorkspaceType[];
};

/**
 * The full set of system categories, shared by every workspace.
 * `name` / `nameEn` are the canonical bilingual labels stored in MongoDB.
 * `suggestedFor` only controls onboarding highlights per workspace type.
 */
export const SYSTEM_CATEGORIES: SystemCategorySeed[] = [
  // --- Income ---
  {
    slug: "income-salary",
    name: "راتب",
    nameEn: "Salary",
    kind: "income",
    icon: "",
    suggestedFor: ["personal"],
  },
  {
    slug: "income-client-payments",
    name: "مدفوعات عملاء",
    nameEn: "Client payments",
    kind: "income",
    icon: "",
    suggestedFor: ["freelance"],
  },
  {
    slug: "income-sales",
    name: "مبيعات",
    nameEn: "Sales",
    kind: "income",
    icon: "",
    suggestedFor: ["business"],
  },
  {
    slug: "income-services",
    name: "خدمات",
    nameEn: "Services",
    kind: "income",
    icon: "",
    suggestedFor: ["business"],
  },
  {
    slug: "income-other",
    name: "دخل آخر",
    nameEn: "Other income",
    kind: "income",
    icon: "",
    suggestedFor: ["personal", "freelance", "business"],
  },

  // --- Expense ---
  {
    slug: "expense-food",
    name: "أكل ومشروبات",
    nameEn: "Food & drinks",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal"],
  },
  {
    slug: "expense-transportation",
    name: "مواصلات",
    nameEn: "Transportation",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal", "freelance"],
  },
  {
    slug: "expense-rent",
    name: "إيجار",
    nameEn: "Rent",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal", "business"],
  },
  {
    slug: "expense-shopping",
    name: "تسوق",
    nameEn: "Shopping",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal"],
  },
  {
    slug: "expense-healthcare",
    name: "صحة",
    nameEn: "Healthcare",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal"],
  },
  {
    slug: "expense-software",
    name: "برامج واشتراكات",
    nameEn: "Software & subscriptions",
    kind: "expense",
    icon: "",
    suggestedFor: ["freelance"],
  },
  {
    slug: "expense-internet",
    name: "إنترنت",
    nameEn: "Internet",
    kind: "expense",
    icon: "",
    suggestedFor: ["freelance", "business"],
  },
  {
    slug: "expense-equipment",
    name: "معدات",
    nameEn: "Equipment",
    kind: "expense",
    icon: "",
    suggestedFor: ["freelance", "business"],
  },
  {
    slug: "expense-marketing",
    name: "تسويق وإعلانات",
    nameEn: "Marketing & ads",
    kind: "expense",
    icon: "",
    suggestedFor: ["freelance", "business"],
  },
  {
    slug: "expense-salaries",
    name: "رواتب",
    nameEn: "Salaries",
    kind: "expense",
    icon: "",
    suggestedFor: ["business"],
  },
  {
    slug: "expense-utilities",
    name: "مرافق",
    nameEn: "Utilities",
    kind: "expense",
    icon: "",
    suggestedFor: ["business"],
  },
  {
    slug: "expense-debt-payment",
    name: "سداد ديون وأقساط",
    nameEn: "Debt & installment payments",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal", "freelance", "business"],
  },
  {
    slug: "expense-other",
    name: "مصروفات أخرى",
    nameEn: "Other expense",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal", "freelance", "business"],
  },
];

export function getSuggestedCategoriesForType(type: WorkspaceType) {
  return SYSTEM_CATEGORIES.filter((category) => category.suggestedFor.includes(type));
}
