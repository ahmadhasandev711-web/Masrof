import "server-only";

import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { countRecurringExpensesForWorkspace } from "@/features/subscriptions/plan-usage";
import type { CreateRecurringExpenseInput } from "@/features/recurring-expenses/schemas";
import {
  InvalidRecurringExpenseError,
  RecurringExpensesRepository,
  recurringExpensesRepository,
} from "@/features/recurring-expenses/recurring-expenses.repository";
import { NotFoundError } from "@/server/kernel/errors";
import { err, ok, type Result } from "@/server/kernel/result";
import { requirePlanFeature, requireQuantityLimit } from "@/server/kernel/plan-policy";

function asRecurringResult<T>(error: unknown): Result<T> | null {
  if (error instanceof InvalidRecurringExpenseError) {
    return err(error);
  }
  return null;
}

export class RecurringExpensesService {
  constructor(
    private readonly repo: RecurringExpensesRepository = recurringExpensesRepository,
  ) {}

  async create(userId: string, input: CreateRecurringExpenseInput) {
    const feature = await requirePlanFeature(userId, input.workspaceId, "recurringExpenses");
    if (!feature.ok) return feature;

    const recurringCount = await countRecurringExpensesForWorkspace(input.workspaceId);
    const limit = await requireQuantityLimit(
      userId,
      input.workspaceId,
      "maxRecurringExpenses",
      recurringCount,
    );
    if (!limit.ok) return limit;

    const existing = await this.repo.findByIdempotencyKey(input.workspaceId, input.idempotencyKey);
    if (existing) return ok(existing);

    try {
      const created = await this.repo.create(input);
      return ok(created);
    } catch (error) {
      const mapped = asRecurringResult<Awaited<ReturnType<RecurringExpensesRepository["create"]>>>(
        error,
      );
      if (mapped) return mapped;
      throw error;
    }
  }

  async archive(userId: string, recurringId: string, workspaceId: string) {
    const feature = await requirePlanFeature(userId, workspaceId, "recurringExpenses");
    if (!feature.ok) return feature;

    const archived = await this.repo.archive(recurringId, workspaceId);
    if (!archived) return err(new NotFoundError("recurringExpenseNotFound"));
    return ok(archived);
  }

  async record(
    recurringId: string,
    workspaceId: string,
    userId: string,
    locale: AppLocale = "ar",
  ) {
    const feature = await requirePlanFeature(userId, workspaceId, "recurringExpenses");
    if (!feature.ok) return feature;

    const t = await getTranslations({ locale, namespace: "forms.recurring" });
    try {
      const txId = await this.repo.record(
        recurringId,
        workspaceId,
        userId,
        t("txFallback"),
      );
      return ok(txId);
    } catch (error) {
      const mapped = asRecurringResult<string | undefined>(error);
      if (mapped) return mapped;
      throw error;
    }
  }

  listForWorkspace(workspaceId: string, limit?: number) {
    return this.repo.listForWorkspace(workspaceId, limit);
  }

  listDue(workspaceId: string) {
    return this.repo.listDue(workspaceId);
  }
}

export const recurringExpensesService = new RecurringExpensesService();
