import "server-only";

import { resolveAccountCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/models/workspace";
import type { CreateAccountInput } from "@/features/accounts/schemas";
import {
  AccountsRepository,
  accountsRepository,
} from "@/features/accounts/accounts.repository";
import { NotFoundError } from "@/server/kernel/errors";
import { err, ok } from "@/server/kernel/result";
import { requirePlanFeature } from "@/server/kernel/plan-policy";

export class AccountsService {
  constructor(private readonly repo: AccountsRepository = accountsRepository) {}

  async create(
    userId: string,
    input: CreateAccountInput,
    workspaceCurrency: SupportedCurrency,
  ) {
    const currency = resolveAccountCurrency(input.currency, workspaceCurrency);
    if (currency !== workspaceCurrency) {
      const feature = await requirePlanFeature(userId, input.workspaceId, "multiCurrency");
      if (!feature.ok) return feature;
    }

    const existing = await this.repo.findByIdempotencyKey(
      input.workspaceId,
      input.idempotencyKey,
    );
    if (existing) return ok(existing);

    const created = await this.repo.create(
      { ...input, currency },
      workspaceCurrency,
    );
    return ok(created);
  }

  async update(accountId: string, workspaceId: string, updates: { name?: string }) {
    const updated = await this.repo.update(accountId, workspaceId, updates);
    if (!updated) return err(new NotFoundError("accountNotFound"));
    return ok(updated);
  }

  async archive(accountId: string, workspaceId: string) {
    const archived = await this.repo.archive(accountId, workspaceId);
    if (!archived) return err(new NotFoundError("accountNotFound"));
    return ok(archived);
  }

  listForWorkspace(workspaceId: string) {
    return this.repo.listForWorkspace(workspaceId);
  }

  getWorkspaceBalanceSummary(workspaceId: string) {
    return this.repo.getWorkspaceBalanceSummary(workspaceId);
  }

  getWorkspaceTotalBalance(workspaceId: string) {
    return this.repo.getWorkspaceTotalBalance(workspaceId);
  }
}

export const accountsService = new AccountsService();
