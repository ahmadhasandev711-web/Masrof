import "server-only";

import { unstable_cache } from "next/cache";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { toPlain } from "@/lib/db/plain";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { CategoryModel, type CategoryKind } from "@/models/category";
import type { CreateCategoryInput } from "@/features/categories/schemas";
import { SYSTEM_CATEGORIES } from "@/features/categories/seed-data";
import {
  findWorkspaceIdempotentId,
  registerWorkspaceIdempotentResource,
} from "@/lib/idempotency/workspace-resource";

let hasCheckedSystemCategories = false;

async function ensureSystemCategoriesImpl(): Promise<void> {
  if (hasCheckedSystemCategories) return;
  try {
    const count = await CategoryModel.countDocuments({ isSystem: true });
    if (count === 0) {
      const ops = SYSTEM_CATEGORIES.map((category) => ({
        updateOne: {
          filter: { slug: category.slug },
          update: {
            $setOnInsert: {
              slug: category.slug,
              name: category.name,
              nameEn: category.nameEn,
              kind: category.kind,
              icon: category.icon,
              suggestedFor: category.suggestedFor,
              isSystem: true,
              workspaceId: null,
              isArchived: false,
            },
          },
          upsert: true,
        },
      }));
      if (ops.length > 0) {
        await CategoryModel.bulkWrite(ops);
      }
    }
    hasCheckedSystemCategories = true;
  } catch (error) {
    console.error("[categories] Failed to ensure system categories:", error);
  }
}

export class CategoriesRepository {
  ensureSystemCategories(): Promise<void> {
    return ensureSystemCategoriesImpl();
  }

  async findByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    await connectToDatabase();
    const existingId = await findWorkspaceIdempotentId(workspaceId, idempotencyKey);
    if (!existingId) return null;
    return CategoryModel.findOne({ _id: existingId, workspaceId }).lean();
  }

  /**
   * Every category usable by a workspace: system categories (workspaceId
   * null, available to all) PLUS this workspace's own custom ones.
   * Nothing is copied into the workspace at creation time — see the
   * architecture note in models/category.ts.
   */
  listForWorkspace = unstable_cache(
    async (workspaceId: string, kind?: CategoryKind) => {
      await connectToDatabase();
      await ensureSystemCategoriesImpl();

      const docs = await CategoryModel.find({
        $or: [{ workspaceId: null }, { workspaceId: new mongoose.Types.ObjectId(workspaceId) }],
        isArchived: false,
        ...(kind ? { kind } : {}),
      })
        .sort({ isSystem: -1, name: 1 })
        .lean();

      return docs.map((doc) => toPlain(doc));
    },
    ["categories-for-workspace"],
    { revalidate: 30, tags: [CACHE_TAGS.categories] },
  );

  async create(input: CreateCategoryInput) {
    await connectToDatabase();

    const category = await CategoryModel.create({
      name: input.name,
      nameEn: input.nameEn ?? null,
      kind: input.kind,
      workspaceId: input.workspaceId,
      isSystem: false,
    });

    await registerWorkspaceIdempotentResource(
      input.workspaceId,
      input.idempotencyKey,
      "category",
      category._id.toString(),
    );

    return category.toObject();
  }

  /**
   * Archives a custom category. Scoped to `{ _id, workspaceId, isSystem: false }`
   * so a request can never archive: (a) another workspace's category, or
   * (b) a shared system category — both checks happen in the same query,
   * not as an afterthought.
   */
  async archive(categoryId: string, workspaceId: string) {
    await connectToDatabase();

    return CategoryModel.findOneAndUpdate(
      { _id: categoryId, workspaceId, isSystem: false },
      { isArchived: true },
      { returnDocument: "after" },
    ).lean();
  }
}

export const categoriesRepository = new CategoriesRepository();
