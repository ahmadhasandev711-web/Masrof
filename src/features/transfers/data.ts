import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/transfers/transfers.service` for writes
 * and `@/features/transfers/transfers.repository` for persistence-only access.
 */
import {
  InvalidTransferError,
  transfersRepository,
  type TransfersPage,
} from "@/features/transfers/transfers.repository";
import { transfersService } from "@/features/transfers/transfers.service";
import type { CreateTransferInput } from "@/features/transfers/schemas";

export { InvalidTransferError };
export type { TransfersPage };

export async function createTransfer(input: CreateTransferInput, userId: string) {
  return transfersRepository.create(input, userId);
}

export async function archiveTransfer(transferId: string, workspaceId: string) {
  return transfersRepository.archive(transferId, workspaceId);
}

export const listTransfersForWorkspace = (workspaceId: string, limit = 20) =>
  transfersService.listForWorkspace(workspaceId, limit);

export const listTransfersPaginated = (workspaceId: string, page = 1, pageSize = 20) =>
  transfersService.listPaginated(workspaceId, page, pageSize);

export const countTransfersForWorkspace = (workspaceId: string) =>
  transfersService.countForWorkspace(workspaceId);
