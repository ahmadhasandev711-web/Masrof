import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/clients/clients.service` for writes
 * and `@/features/clients/clients.repository` for persistence-only access.
 */
import { clientsRepository } from "@/features/clients/clients.repository";
import { clientsService } from "@/features/clients/clients.service";
import type { CreateClientInput } from "@/features/clients/schemas";

export async function createClient(input: CreateClientInput) {
  const existing = await clientsRepository.findByIdempotencyKey(
    input.workspaceId,
    input.idempotencyKey,
  );
  if (existing) return existing;
  return clientsRepository.create(input);
}

export async function updateClient(
  clientId: string,
  workspaceId: string,
  input: { name: string; email: string | null; phone: string | null },
) {
  return clientsRepository.update(clientId, workspaceId, input);
}

export async function archiveClient(clientId: string, workspaceId: string) {
  return clientsRepository.archive(clientId, workspaceId);
}

export const listClientsForWorkspace = (workspaceId: string) =>
  clientsService.listForWorkspace(workspaceId);

export const listClientsWithFinancials = (workspaceId: string) =>
  clientsService.listWithFinancials(workspaceId);
