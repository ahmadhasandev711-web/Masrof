import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLAN_CONFIGS,
  DEFAULT_PLAN_FLAGS,
  isUnlimitedQuantity,
} from "@/features/subscriptions/default-plans";

describe("plan feature gates (freemium v2)", () => {
  it("gives Free clients/projects/goals/recurring with ads", () => {
    expect(DEFAULT_PLAN_FLAGS.free.clientsAndProjects).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.free.savingsGoals).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.free.recurringExpenses).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.free.noAds).toBe(false);
  });

  it("keeps Free without Pro-only power features", () => {
    expect(DEFAULT_PLAN_FLAGS.free.csvExport).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.free.bankImport).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.free.advancedReports).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.free.ocrReceipts).toBe(false);
    expect(DEFAULT_PLAN_FLAGS.free.teamWorkspace).toBe(false);
  });

  it("gives Pro former Plus features and no ads", () => {
    expect(DEFAULT_PLAN_FLAGS.pro.noAds).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.bankImport).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.advancedReports).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.teamWorkspace).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.ocrReceipts).toBe(true);
    expect(DEFAULT_PLAN_FLAGS.pro.aiCategory).toBe(true);
  });

  it("keeps legacy Plus aligned with Pro entitlements", () => {
    expect(DEFAULT_PLAN_FLAGS.plus).toEqual(DEFAULT_PLAN_FLAGS.pro);
    expect(DEFAULT_PLAN_CONFIGS.plus.available).toBe(false);
  });

  it("caps Free quantities and leaves Pro unlimited", () => {
    expect(DEFAULT_PLAN_CONFIGS.free.maxInvoicesPerMonth).toBe(10);
    expect(DEFAULT_PLAN_CONFIGS.free.maxClients).toBe(20);
    expect(DEFAULT_PLAN_CONFIGS.free.maxActiveProjects).toBe(5);
    expect(DEFAULT_PLAN_CONFIGS.free.maxSavingsGoals).toBe(2);
    expect(DEFAULT_PLAN_CONFIGS.free.maxRecurringExpenses).toBe(3);

    expect(isUnlimitedQuantity(DEFAULT_PLAN_CONFIGS.pro.maxInvoicesPerMonth)).toBe(true);
    expect(isUnlimitedQuantity(DEFAULT_PLAN_CONFIGS.pro.maxClients)).toBe(true);
    expect(DEFAULT_PLAN_CONFIGS.pro.maxWorkspaces).toBe(3);
    expect(DEFAULT_PLAN_CONFIGS.pro.maxMembers).toBe(5);
    expect(DEFAULT_PLAN_CONFIGS.pro.priceYearly).toBe(48);
  });
});
