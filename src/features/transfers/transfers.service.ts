import "server-only";

import type { CreateTransferInput } from "@/features/transfers/schemas";
import {
  InvalidTransferError,
  TransfersRepository,
  transfersRepository,
} from "@/features/transfers/transfers.repository";
import { err, ok, type Result } from "@/server/kernel/result";

function asTransferResult<T>(error: unknown): Result<T> | null {
  if (error instanceof InvalidTransferError) {
    return err(error);
  }
  return null;
}

export class TransfersService {
  constructor(private readonly repo: TransfersRepository = transfersRepository) {}

  async create(userId: string, input: CreateTransferInput): Promise<Result<string>> {
    try {
      const id = await this.repo.create(input, userId);
      return ok(id);
    } catch (error) {
      const mapped = asTransferResult<string>(error);
      if (mapped) return mapped;
      throw error;
    }
  }

  async archive(transferId: string, workspaceId: string): Promise<Result<void>> {
    try {
      await this.repo.archive(transferId, workspaceId);
      return ok(undefined);
    } catch (error) {
      const mapped = asTransferResult<void>(error);
      if (mapped) return mapped;
      throw error;
    }
  }

  listForWorkspace(workspaceId: string, limit = 20) {
    return this.repo.listForWorkspace(workspaceId, limit);
  }

  listPaginated(workspaceId: string, page = 1, pageSize = 20) {
    return this.repo.listPaginated(workspaceId, page, pageSize);
  }

  countForWorkspace(workspaceId: string) {
    return this.repo.countForWorkspace(workspaceId);
  }
}

export const transfersService = new TransfersService();
