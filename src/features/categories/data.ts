import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/categories/categories.service` for writes
 * and `@/features/categories/categories.repository` for persistence-only access.
 */
import { categoriesRepository } from "@/features/categories/categories.repository";
import { categoriesService } from "@/features/categories/categories.service";
import type { CreateCategoryInput } from "@/features/categories/schemas";
import type { CategoryKind } from "@/models/category";

export async function ensureSystemCategories(): Promise<void> {
  return categoriesRepository.ensureSystemCategories();
}

export const listCategoriesForWorkspace = (workspaceId: string, kind?: CategoryKind) =>
  categoriesService.listForWorkspace(workspaceId, kind);

export async function createCustomCategory(input: CreateCategoryInput) {
  const existing = await categoriesRepository.findByIdempotencyKey(
    input.workspaceId,
    input.idempotencyKey,
  );
  if (existing) return existing;
  return categoriesRepository.create(input);
}

export async function archiveCustomCategory(categoryId: string, workspaceId: string) {
  return categoriesRepository.archive(categoryId, workspaceId);
}
