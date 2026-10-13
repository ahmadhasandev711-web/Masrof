import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLAN_CONFIGS,
  DEFAULT_PLAN_FLAGS,
  isUnlimitedQuantity,
} from "@/features/subscriptions/default-plans";

describe("plan feature gates (freemium v8)", () => {
  it("gives Free clients and projects with ads, but locks budgets/savings/recurring to Pro", () => {
    expect(DEFAULT_PLAN_FLAGS.free.clientsAndProjects).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.free.savingsGoals).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.free.recurringExpenses).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.free.budgets).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.free.noAds).toBe(false);
  });

  it("keeps Free without Pro-only power features", () => {
    expect(DEFAULT_PLAN_FLAGS.free.csvExport).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.free.bankImport).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.free.advancedReports).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.free.ocrReceipts).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.free.teamWorkspace).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.free.debts).toBe(false);
  });

  it("gives Pro all advanced features and no ads", () => {
    expect(DEFAULT_PLAN_FLAGS.pro.noAds).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.bankImport).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.advancedReports).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.teamWorkspace).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.ocrReceipts).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.aiCategory).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.debts).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.budgets).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.recurringExpenses).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.savingsGoals).toBe(true);
  });

  it("caps Free quantities and sets Pro to 250 EGP/year", () => {
    expect(DEFAULT_PLAN_CONFIGS.free.maxWorkspaces).toBe(1);
    expect(DEFAULT_PLAN_CONFIGS.free.maxInvoicesPerMonth).toBe(3);
    expect(DEFAULT_PLAN_CONFIGS.free.maxClients).toBe(5);
    expect(DEFAULT_PLAN_CONFIGS.free.maxActiveProjects).toBe(2);
    expect(DEFAULT_PLAN_CONFIGS.free.maxSavingsGoals).toBe(0);
    expect(DEFAULT_PLAN_CONFIGS.free.maxRecurringExpenses).toBe(0);

    expect(DEFAULT_PLAN_CONFIGS.pro.maxWorkspaces).toBe(1);
    expect(isUnlimitedQuantity(DEFAULT_PLAN_CONFIGS.pro.maxInvoicesPerMonth)).toBe(true);
    expect(isUnlimitedQuantity(DEFAULT_PLAN_CONFIGS.pro.maxClients)).toBe(true);
    expect(DEFAULT_PLAN_CONFIGS.pro.maxMembers).toBe(5);
    expect(DEFAULT_PLAN_CONFIGS.pro.priceYearly).toBe(250);
  });
});
