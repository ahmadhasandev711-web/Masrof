/**
 * Cache tags used with `unstable_cache` + `revalidateTag`.
 * Reference data (accounts/categories/clients/projects) is cached per
 * request so the dashboard doesn't re-query MongoDB on every navigation;
 * mutations revalidate the matching tag to drop the entry.
 */
export const CACHE_TAGS = {
  accounts: "ref:accounts",
  categories: "ref:categories",
  clients: "ref:clients",
  projects: "ref:projects",
  invoices: "list:invoices",
  budgets: "list:budgets",
  goals: "list:goals",
  recurring: "list:recurring",
  transfers: "list:transfers",
} as const;
