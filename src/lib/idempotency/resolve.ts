import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { WriteIdempotencyModel } from "@/models/write-idempotency";

export type IdempotencyScope =
  | { type: "workspace"; workspaceId: string }
  | { type: "user"; userId: string };

function scopeId(scope: IdempotencyScope): string {
  return scope.type === "workspace" ? scope.workspaceId : scope.userId;
}

export async function findIdempotentResourceId(
  scope: IdempotencyScope,
  idempotencyKey: string,
): Promise<string | null> {
  await connectToDatabase();
  const row = await WriteIdempotencyModel.findOne({
    scopeType: scope.type,
    scopeId: scopeId(scope),
    idempotencyKey,
  }).lean();
  return row?.resourceId ?? null;
}

export async function registerIdempotentResource(
  scope: IdempotencyScope,
  idempotencyKey: string,
  resourceType: string,
  resourceId: string,
): Promise<void> {
  await connectToDatabase();
  try {
    await WriteIdempotencyModel.create({
      scopeType: scope.type,
      scopeId: scopeId(scope),
      idempotencyKey,
      resourceType,
      resourceId,
    });
  } catch {
    const existing = await findIdempotentResourceId(scope, idempotencyKey);
    if (existing && existing !== resourceId) {
      throw new Error("idempotencyConflict");
    }
  }
}
