import type { CategoryKind } from "@/models/category";
import type { WorkspaceType } from "@/models/workspace";

export type SystemCategorySeed = {
  slug: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  suggestedFor: WorkspaceType[];
};

/**
 * The full set of system categories, shared by every workspace.
 * `suggestedFor` only controls which ones are highlighted as defaults
 * during onboarding for a given workspace type — every category here is
 * technically usable by any workspace.
 */
export const SYSTEM_CATEGORIES: SystemCategorySeed[] = [
  // --- Income ---
  { slug: "income-salary", name: "راتب", kind: "income", icon: "", suggestedFor: ["personal"] },
  {
    slug: "income-client-payments",
    name: "مدفوعات عملاء",
    kind: "income",
    icon: "",
    suggestedFor: ["freelance"],
  },
  { slug: "income-sales", name: "مبيعات", kind: "income", icon: "", suggestedFor: ["business"] },
  {
    slug: "income-services",
    name: "خدمات",
    kind: "income",
    icon: "",
    suggestedFor: ["business"],
  },
  {
    slug: "income-other",
    name: "دخل آخر",
    kind: "income",
    icon: "",
    suggestedFor: ["personal", "freelance", "business"],
  },

  // --- Expense ---
  {
    slug: "expense-food",
    name: "أكل ومشروبات",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal"],
  },
  {
    slug: "expense-transportation",
    name: "مواصلات",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal", "freelance"],
  },
  {
    slug: "expense-rent",
    name: "إيجار",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal", "business"],
  },
  {
    slug: "expense-shopping",
    name: "تسوق",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal"],
  },
  {
    slug: "expense-healthcare",
    name: "صحة",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal"],
  },
  {
    slug: "expense-software",
    name: "برامج واشتراكات",
    kind: "expense",
    icon: "",
    suggestedFor: ["freelance"],
  },
  {
    slug: "expense-internet",
    name: "إنترنت",
    kind: "expense",
    icon: "",
    suggestedFor: ["freelance", "business"],
  },
  {
    slug: "expense-equipment",
    name: "معدات",
    kind: "expense",
    icon: "",
    suggestedFor: ["freelance", "business"],
  },
  {
    slug: "expense-marketing",
    name: "تسويق وإعلانات",
    kind: "expense",
    icon: "",
    suggestedFor: ["freelance", "business"],
  },
  {
    slug: "expense-salaries",
    name: "رواتب",
    kind: "expense",
    icon: "",
    suggestedFor: ["business"],
  },
  {
    slug: "expense-utilities",
    name: "مرافق",
    kind: "expense",
    icon: "",
    suggestedFor: ["business"],
  },
  {
    slug: "expense-debt-payment",
    name: "سداد ديون وأقساط",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal", "freelance", "business"],
  },
  {
    slug: "expense-other",
    name: "مصروفات أخرى",
    kind: "expense",
    icon: "",
    suggestedFor: ["personal", "freelance", "business"],
  },
];

export function getSuggestedCategoriesForType(type: WorkspaceType) {
  return SYSTEM_CATEGORIES.filter((category) => category.suggestedFor.includes(type));
}

