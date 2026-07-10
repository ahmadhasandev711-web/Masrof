import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { listCategoriesForWorkspace } from "@/features/categories/data";
import { SYSTEM_CATEGORIES } from "@/features/categories/seed-data";

type CategoryRow = { id: string; name: string; kind: "income" | "expense"; slug?: string | null };

const KEYWORD_RULES: Array<{ slug: string; keywords: string[] }> = [
  { slug: "expense-food", keywords: ["food", "restaurant", "cafe", "coffee", "starbucks", "أكل", "مطعم", "كافيه", "مقهى"] },
  { slug: "expense-transportation", keywords: ["uber", "careem", "fuel", "petrol", "gas", "مواصلات", "بنزين", "وقود", "تاكسي"] },
  { slug: "expense-rent", keywords: ["rent", "lease", "إيجار", "ايجار"] },
  { slug: "expense-shopping", keywords: ["amazon", "mall", "store", "shop", "تسوق", "سوبر", "market", "carrefour"] },
  { slug: "expense-healthcare", keywords: ["pharmacy", "hospital", "clinic", "doctor", "صيدل", "مستشف", "طبيب"] },
  { slug: "expense-software", keywords: ["software", "subscription", "saas", "netflix", "spotify", "اشتراك", "برنامج"] },
  { slug: "expense-internet", keywords: ["internet", "wifi", "vodafone", "orange", "etisalat", "we", "إنترنت", "نت"] },
  { slug: "expense-equipment", keywords: ["equipment", "laptop", "computer", "hardware", "معدات", "لابتوب"] },
  { slug: "expense-marketing", keywords: ["ads", "marketing", "facebook", "google ads", "تسويق", "إعلان"] },
  { slug: "expense-salaries", keywords: ["salary", "payroll", "wage", "راتب", "رواتب"] },
  { slug: "expense-utilities", keywords: ["electric", "water", "utility", "كهرب", "مياه", "مرافق"] },
  { slug: "income-salary", keywords: ["salary", "payroll", "راتب"] },
  { slug: "income-client-payments", keywords: ["client", "invoice", "payment received", "عميل", "فاتورة"] },
  { slug: "income-sales", keywords: ["sale", "sales", "order", "مبيعات", "طلب"] },
  { slug: "income-services", keywords: ["service", "consulting", "خدمات", "استشارات"] },
];

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

export type CategorySuggestion = {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reason: "keyword" | "fallback";
};

export async function suggestCategoryForTransaction(input: {
  workspaceId: string;
  type: "income" | "expense";
  description?: string;
  notes?: string;
  merchant?: string;
}): Promise<CategorySuggestion | null> {
  await connectToDatabase();

  const categories = (await listCategoriesForWorkspace(input.workspaceId)).filter(
    (c) => c.kind === input.type,
  );
  if (categories.length === 0) return null;

  const haystack = normalize(
    [input.description, input.notes, input.merchant].filter(Boolean).join(" "),
  );
  if (!haystack) return null;

  let best: { category: CategoryRow; score: number } | null = null;

  for (const category of categories) {
    const slug = category.slug ?? SYSTEM_CATEGORIES.find((row) => row.name === category.name)?.slug ?? null;
    if (!slug) continue;

    const rule = KEYWORD_RULES.find((row) => row.slug === slug);
    if (!rule) continue;

    let score = 0;
    for (const keyword of rule.keywords) {
      if (haystack.includes(normalize(keyword))) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = {
        category: {
          id: category._id.toString(),
          name: category.name,
          kind: category.kind,
          slug,
        },
        score,
      };
    }
  }

  if (best) {
    return {
      categoryId: best.category.id,
      categoryName: best.category.name,
      confidence: Math.min(0.95, 0.4 + best.score * 0.2),
      reason: "keyword",
    };
  }

  const fallbackSlug =
    input.type === "expense" ? "expense-other" : "income-other";
  const fallback = categories.find((c) => {
    const slug = c.slug ?? SYSTEM_CATEGORIES.find((row) => row.name === c.name)?.slug ?? null;
    return slug === fallbackSlug;
  });

  if (!fallback) return null;

  return {
    categoryId: fallback._id.toString(),
    categoryName: fallback.name,
    confidence: 0.25,
    reason: "fallback",
  };
}
