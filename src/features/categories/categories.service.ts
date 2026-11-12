import "server-only";

import type { CategoryKind } from "@/models/category";
import type { CreateCategoryInput } from "@/features/categories/schemas";
import {
  CategoriesRepository,
  categoriesRepository,
} from "@/features/categories/categories.repository";
import { NotFoundError } from "@/server/kernel/errors";
import { err, ok, type Result } from "@/server/kernel/result";

export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository = categoriesRepository) {}

  async create(
    _userId: string,
    input: CreateCategoryInput,
  ): Promise<Result<Awaited<ReturnType<CategoriesRepository["create"]>>>> {
    const existing = await this.repo.findByIdempotencyKey(
      input.workspaceId,
      input.idempotencyKey,
    );
    if (existing) return ok(existing as Awaited<ReturnType<CategoriesRepository["create"]>>);

    return ok(await this.repo.create(input));
  }

  async archive(categoryId: string, workspaceId: string) {
    const archived = await this.repo.archive(categoryId, workspaceId);
    if (!archived) return err(new NotFoundError("categoryNotFound"));
    return ok(archived);
  }

  listForWorkspace(workspaceId: string, kind?: CategoryKind) {
    return this.repo.listForWorkspace(workspaceId, kind);
  }

  ensureSystemCategories() {
    return this.repo.ensureSystemCategories();
  }
}

export const categoriesService = new CategoriesService();
