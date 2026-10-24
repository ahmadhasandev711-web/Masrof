import type { CategoryKind } from "@/models/category";

export type CategoryIconKey =
  | "briefcase"
  | "users"
  | "cart"
  | "wrench"
  | "plus"
  | "food"
  | "car"
  | "home"
  | "bag"
  | "heart"
  | "cpu"
  | "wifi"
  | "monitor"
  | "megaphone"
  | "payroll"
  | "bolt"
  | "card"
  | "dots"
  | "tag";

const SLUG_ICON: Record<string, CategoryIconKey> = {
  "income-salary": "briefcase",
  "income-client-payments": "users",
  "income-sales": "cart",
  "income-services": "wrench",
  "income-other": "plus",
  "expense-food": "food",
  "expense-transportation": "car",
  "expense-rent": "home",
  "expense-shopping": "bag",
  "expense-healthcare": "heart",
  "expense-software": "cpu",
  "expense-internet": "wifi",
  "expense-equipment": "monitor",
  "expense-marketing": "megaphone",
  "expense-salaries": "payroll",
  "expense-utilities": "bolt",
  "expense-debt-payment": "card",
  "expense-other": "dots",
};

export function categorySlugToIconKey(
  slug?: string | null,
  kind?: CategoryKind,
): CategoryIconKey {
  if (slug && SLUG_ICON[slug]) return SLUG_ICON[slug];
  if (kind === "income") return "briefcase";
  if (kind === "expense") return "tag";
  return "tag";
}
