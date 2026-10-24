import "server-only";

import {
  findIdempotentResourceId,
  registerIdempotentResource,
  type IdempotencyScope,
} from "@/lib/idempotency/resolve";

export function workspaceIdempotencyScope(workspaceId: string): IdempotencyScope {
  return { type: "workspace", workspaceId };
}

export async function findWorkspaceIdempotentId(
  workspaceId: string,
  idempotencyKey: string,
): Promise<string | null> {
  return findIdempotentResourceId(workspaceIdempotencyScope(workspaceId), idempotencyKey);
}

export async function registerWorkspaceIdempotentResource(
  workspaceId: string,
  idempotencyKey: string,
  resourceType: string,
  resourceId: string,
): Promise<void> {
  return registerIdempotentResource(
    workspaceIdempotencyScope(workspaceId),
    idempotencyKey,
    resourceType,
    resourceId,
  );
}
