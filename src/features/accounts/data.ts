import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/accounts/accounts.service` for writes
 * and `@/features/accounts/accounts.repository` for persistence-only access.
 */
import { accountsRepository } from "@/features/accounts/accounts.repository";
import { accountsService } from "@/features/accounts/accounts.service";
import type { CreateAccountInput } from "@/features/accounts/schemas";
import type { SupportedCurrency } from "@/models/workspace";
import type { ClientSession } from "mongoose";

export async function createAccount(
  input: CreateAccountInput,
  workspaceCurrency: SupportedCurrency,
) {
  const existing = await accountsRepository.findByIdempotencyKey(
    input.workspaceId,
    input.idempotencyKey,
  );
  if (existing) return existing;
  return accountsRepository.create(input, workspaceCurrency);
}

export const listAccountsForWorkspace = (workspaceId: string) =>
  accountsService.listForWorkspace(workspaceId);

export const getWorkspaceBalanceSummary = (workspaceId: string) =>
  accountsService.getWorkspaceBalanceSummary(workspaceId);

export const getWorkspaceTotalBalance = (workspaceId: string) =>
  accountsService.getWorkspaceTotalBalance(workspaceId);

export async function updateAccount(
  accountId: string,
  workspaceId: string,
  updates: { name?: string },
) {
  return accountsRepository.update(accountId, workspaceId, updates);
}

export async function archiveAccount(accountId: string, workspaceId: string) {
  return accountsRepository.archive(accountId, workspaceId);
}

export async function adjustAccountBalance(
  accountId: string,
  deltaMinorUnits: number,
  session?: ClientSession | null,
) {
  return accountsRepository.adjustBalance(accountId, deltaMinorUnits, session);
}

export async function recalculateAccountBalance(accountId: string) {
  return accountsRepository.recalculateBalance(accountId);
}
