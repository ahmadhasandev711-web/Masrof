import "server-only";

import type { AppLocale } from "@/i18n/config";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
} from "@/features/transactions/schemas";
import {
  InvalidTransactionReferenceError,
  TransactionsRepository,
  transactionsRepository,
} from "@/features/transactions/transactions.repository";
import { err, ok, type Result } from "@/server/kernel/result";
import { requirePlanFeature } from "@/server/kernel/plan-policy";

function asTransactionResult<T>(error: unknown): Result<T> | null {
  if (error instanceof InvalidTransactionReferenceError) {
    return err(error);
  }
  return null;
}

export class TransactionsService {
  constructor(private readonly repo: TransactionsRepository = transactionsRepository) {}

  async create(userId: string, input: CreateTransactionInput): Promise<Result<string>> {
    try {
      const id = await this.repo.create(input, userId);
      return ok(id);
    } catch (error) {
      const mapped = asTransactionResult<string>(error);
      if (mapped) return mapped;
      throw error;
    }
  }

  async update(input: UpdateTransactionInput, workspaceId: string): Promise<Result<void>> {
    try {
      await this.repo.update(input, workspaceId);
      return ok(undefined);
    } catch (error) {
      const mapped = asTransactionResult<void>(error);
      if (mapped) return mapped;
      throw error;
    }
  }

  async archive(transactionId: string, workspaceId: string): Promise<Result<void>> {
    try {
      await this.repo.archive(transactionId, workspaceId);
      return ok(undefined);
    } catch (error) {
      const mapped = asTransactionResult<void>(error);
      if (mapped) return mapped;
      throw error;
    }
  }

  list(filters: TransactionFilters) {
    return this.repo.list(filters);
  }

  async listForExport(
    userId: string,
    filters: Omit<TransactionFilters, "page" | "pageSize">,
  ) {
    const feature = await requirePlanFeature(userId, filters.workspaceId, "csvExport");
    if (!feature.ok) return feature;
    return ok(await this.repo.listForExport(filters));
  }

  getWorkspaceSummary(workspaceId: string, range?: { from?: Date; to?: Date }) {
    return this.repo.getWorkspaceSummary(workspaceId, range);
  }

  getRecent(workspaceId: string, limit = 5, locale: AppLocale = "ar") {
    return this.repo.getRecent(workspaceId, limit, locale);
  }
}

export const transactionsService = new TransactionsService();
