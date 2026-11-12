import "server-only";

import type { SupportedCurrency } from "@/lib/currency/constants";
import type { CreateDebtInput, RecordDebtPaymentInput } from "@/features/debts/schemas";
import {
  DebtsRepository,
  debtsRepository,
} from "@/features/debts/debts.repository";
import { DebtNotFoundError } from "@/features/debts/debts.errors";
import { isAppError } from "@/server/kernel/errors";
import { err, ok, type Result } from "@/server/kernel/result";
import { requirePlanFeature } from "@/server/kernel/plan-policy";

export class DebtsService {
  constructor(private readonly repo: DebtsRepository = debtsRepository) {}

  /** Plan gate shared by web actions and mobile routes. */
  async requireAccess(userId: string, workspaceId: string) {
    return requirePlanFeature(userId, workspaceId, "debts");
  }

  async create(
    userId: string,
    input: CreateDebtInput & { currency: SupportedCurrency | string },
  ): Promise<Result<string>> {
    const feature = await this.requireAccess(userId, input.workspaceId);
    if (!feature.ok) return feature;

    const id = await this.repo.create(input);
    return ok(id);
  }

  async archive(workspaceId: string, debtId: string): Promise<Result<true>> {
    const archived = await this.repo.archive(workspaceId, debtId);
    if (!archived) return err(new DebtNotFoundError());
    return ok(true);
  }

  async recordPayment(
    userId: string,
    input: RecordDebtPaymentInput,
  ): Promise<Result<{ paymentId: string; transactionId: string }>> {
    const feature = await this.requireAccess(userId, input.workspaceId);
    if (!feature.ok) return feature;

    try {
      const payment = await this.repo.recordPayment(input, userId);
      return ok(payment);
    } catch (error) {
      if (isAppError(error)) return err(error);
      throw error;
    }
  }

  listForWorkspace(workspaceId: string, options?: { status?: "active" | "paid" }) {
    return this.repo.listForWorkspace(workspaceId, options);
  }

  getSummary(workspaceId: string, currency: string) {
    return this.repo.getSummary(workspaceId, currency);
  }

  listPayments(workspaceId: string, debtId: string) {
    return this.repo.listPayments(workspaceId, debtId);
  }
}

export const debtsService = new DebtsService();
