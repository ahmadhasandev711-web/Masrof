import "server-only";

import { cache } from "react";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CategoryModel, type CategoryKind } from "@/models/category";
import type { CreateCategoryInput } from "@/features/categories/schemas";

/**
 * Every category usable by a workspace: system categories (workspaceId
 * null, available to all) PLUS this workspace's own custom ones.
 * Nothing is copied into the workspace at creation time — see the
 * architecture note in models/category.ts.
 */
export const listCategoriesForWorkspace = cache(async (workspaceId: string, kind?: CategoryKind) => {
  await connectToDatabase();

  return CategoryModel.find({
    $or: [{ workspaceId: null }, { workspaceId: new mongoose.Types.ObjectId(workspaceId) }],
    isArchived: false,
    ...(kind ? { kind } : {}),
  })
    .sort({ isSystem: -1, name: 1 })
    .lean();
});

export async function createCustomCategory(input: CreateCategoryInput) {
  await connectToDatabase();

  const category = await CategoryModel.create({
    name: input.name,
    kind: input.kind,
    workspaceId: input.workspaceId,
    isSystem: false,
  });

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
