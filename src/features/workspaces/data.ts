import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/workspaces/workspaces.service` for writes
 * and `@/features/workspaces/workspaces.repository` for persistence-only access.
 */
import { cache } from "react";
import type { CreateWorkspaceInput } from "@/features/workspaces/schemas";
import type { SupportedCurrency } from "@/models/workspace";
import { workspacesRepository } from "@/features/workspaces/workspaces.repository";
import { workspacesService } from "@/features/workspaces/workspaces.service";

export async function createWorkspaceForUser(userId: string, input: CreateWorkspaceInput) {
  const existingId = await workspacesRepository.findIdempotentWorkspaceId(
    userId,
    input.idempotencyKey,
  );
  if (existingId) return existingId;
  return workspacesRepository.createWithOwnerAndAccount(userId, input);
}

/** Lists every non-archived workspace the given user belongs to, newest first. */
export const listWorkspacesForUser = cache(async (userId: string) =>
  workspacesService.listForUser(userId),
);

/** Returns true if the user has at least one accessible workspace. */
export async function userHasAnyWorkspace(userId: string): Promise<boolean> {
  return workspacesService.userHasAnyWorkspace(userId);
}

export async function updateWorkspace(
  workspaceId: string,
  updates: Parameters<typeof workspacesRepository.update>[1],
) {
  return workspacesRepository.update(workspaceId, updates);
}

export async function archiveWorkspace(workspaceId: string) {
  return workspacesRepository.archive(workspaceId);
}

export async function updateWorkspaceBaseCurrency(
  workspaceId: string,
  newCurrency: SupportedCurrency,
) {
  const updated = await workspacesRepository.updateBaseCurrency(workspaceId, newCurrency);
  if (!updated) throw new Error("Workspace not found");
  return updated;
}
