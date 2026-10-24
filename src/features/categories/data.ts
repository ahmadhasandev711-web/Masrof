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

export async function ensureSystemCategories(): Promise<void> {
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

/**
 * Every category usable by a workspace: system categories (workspaceId
 * null, available to all) PLUS this workspace's own custom ones.
 * Nothing is copied into the workspace at creation time — see the
 * architecture note in models/category.ts.
 */
export const listCategoriesForWorkspace = unstable_cache(
  async (workspaceId: string, kind?: CategoryKind) => {
    await connectToDatabase();
    await ensureSystemCategories();

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

export async function createCustomCategory(input: CreateCategoryInput) {
  await connectToDatabase();

  const existingId = await findWorkspaceIdempotentId(input.workspaceId, input.idempotencyKey);
  if (existingId) {
    const existing = await CategoryModel.findOne({
      _id: existingId,
      workspaceId: input.workspaceId,
    }).lean();
    if (existing) return existing;
  }

  const category = await CategoryModel.create({
    name: input.name,
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
export async function archiveCustomCategory(categoryId: string, workspaceId: string) {
  await connectToDatabase();

  return CategoryModel.findOneAndUpdate(
    { _id: categoryId, workspaceId, isSystem: false },
    { isArchived: true },
    { returnDocument: "after" },
  ).lean();
}
