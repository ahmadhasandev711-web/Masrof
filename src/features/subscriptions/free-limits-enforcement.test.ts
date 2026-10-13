import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLAN_CONFIGS,
  DEFAULT_PLAN_FLAGS,
  isUnlimitedQuantity,
} from "@/features/subscriptions/default-plans";
import { toQuantityUsage } from "@/features/subscriptions/quantity-usage";

describe("Strict Free Plan Limits Enforcement", () => {
  describe("1. Workspaces Limit (1 workspace max on Free and Pro)", () => {
    it("Free plan config specifies exactly 1 workspace", () => {
      expect(DEFAULT_PLAN_CONFIGS.free.maxWorkspaces).toBe(1);
    });

    it("allows a user with 0 workspaces to create a workspace", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxWorkspaces;
      expect(0 < limit).toBe(true);
      expect(toQuantityUsage(0, limit).atLimit).toBe(false);
    });

    it("strictly blocks a user with 1 workspace from creating a 2nd workspace", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxWorkspaces;
      const allowsSecond = 1 < limit;
      expect(allowsSecond).toBe(false);
      expect(toQuantityUsage(1, limit).atLimit).toBe(true);
      expect(toQuantityUsage(2, limit).atLimit).toBe(true);
    });

    it("Pro plan has 1 central workspace", () => {
      expect(DEFAULT_PLAN_CONFIGS.pro.maxWorkspaces).toBe(1);
    });
  });

  describe("2. Team Members Limit (Owner only, 1 member max on Free)", () => {
    it("Free plan disables the teamWorkspace feature flag", () => {
      expect(DEFAULT_PLAN_FLAGS.free.teamWorkspace).toBe(false);
    });

    it("Free plan has maxMembers set to 1 (only the owner)", () => {
      expect(DEFAULT_PLAN_CONFIGS.free.maxMembers).toBe(1);
    });

    it("blocks Free plan from adding any team members (currentCount >= 1)", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxMembers;
      const allowsNewMember = 1 < limit;
      expect(allowsNewMember).toBe(false);
      expect(toQuantityUsage(1, limit).atLimit).toBe(true);
    });

    it("Pro plan enables teamWorkspace and allows up to 5 members", () => {
      expect(DEFAULT_PLAN_FLAGS.pro.teamWorkspace).toBe(true);
      expect(DEFAULT_PLAN_CONFIGS.pro.maxMembers).toBe(5);
    });
  });

  describe("3. Monthly Invoices Limit (3 invoices / month on Free)", () => {
    it("Free plan config specifies exactly 3 invoices per month", () => {
      expect(DEFAULT_PLAN_CONFIGS.free.maxInvoicesPerMonth).toBe(3);
    });

    it("allows Free users to create invoices when under the 3 invoice limit", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxInvoicesPerMonth;
      expect(0 < limit).toBe(true);
      expect(2 < limit).toBe(true);
      expect(toQuantityUsage(2, limit).atLimit).toBe(false);
    });

    it("strictly blocks invoice creation when reaching 3 invoices in the month", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxInvoicesPerMonth;
      expect(3 < limit).toBe(false);
      expect(4 < limit).toBe(false);
      expect(toQuantityUsage(3, limit).atLimit).toBe(true);
      expect(toQuantityUsage(4, limit).atLimit).toBe(true);
    });

    it("Pro plan has unlimited invoices per month", () => {
      const proLimit = DEFAULT_PLAN_CONFIGS.pro.maxInvoicesPerMonth;
      expect(isUnlimitedQuantity(proLimit)).toBe(true);
      expect(toQuantityUsage(10, proLimit).unlimited).toBe(true);
      expect(toQuantityUsage(1000, proLimit).atLimit).toBe(false);
    });
  });

  describe("4. Clients & Projects Limit (5 clients and 2 active projects on Free)", () => {
    it("Free plan config specifies max 5 clients", () => {
      expect(DEFAULT_PLAN_CONFIGS.free.maxClients).toBe(5);
    });

    it("allows creating clients under 5 and blocks at 5", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxClients;
      expect(4 < limit).toBe(true);
      expect(5 < limit).toBe(false);
      expect(6 < limit).toBe(false);
      expect(toQuantityUsage(4, limit).atLimit).toBe(false);
      expect(toQuantityUsage(5, limit).atLimit).toBe(true);
    });

    it("Free plan config specifies max 2 active projects", () => {
      expect(DEFAULT_PLAN_CONFIGS.free.maxActiveProjects).toBe(2);
    });

    it("allows creating active projects under 2 and blocks at 2", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxActiveProjects;
      expect(1 < limit).toBe(true);
      expect(2 < limit).toBe(false);
      expect(3 < limit).toBe(false);
      expect(toQuantityUsage(1, limit).atLimit).toBe(false);
      expect(toQuantityUsage(2, limit).atLimit).toBe(true);
    });

    it("Pro plan has unlimited clients and projects", () => {
      const proClientsLimit = DEFAULT_PLAN_CONFIGS.pro.maxClients;
      const proProjectsLimit = DEFAULT_PLAN_CONFIGS.pro.maxActiveProjects;
      expect(isUnlimitedQuantity(proClientsLimit)).toBe(true);
      expect(isUnlimitedQuantity(proProjectsLimit)).toBe(true);
      expect(toQuantityUsage(100, proClientsLimit).unlimited).toBe(true);
      expect(toQuantityUsage(100, proProjectsLimit).unlimited).toBe(true);
    });
  });

  describe("5. Pro Features & Yearly Pricing (250 EGP/year)", () => {
    it("Pro price is exactly 250 EGP/year", () => {
      expect(DEFAULT_PLAN_CONFIGS.pro.priceYearly).toBe(250);
    });

    it("Free plan restricts budgets, recurring expenses, and savings goals to Pro", () => {
      expect(DEFAULT_PLAN_FLAGS.free.budgets).toBe(false);
      expect(DEFAULT_PLAN_FLAGS.free.recurringExpenses).toBe(false);
      expect(DEFAULT_PLAN_FLAGS.free.savingsGoals).toBe(false);

      expect(DEFAULT_PLAN_FLAGS.pro.budgets).toBe(true);
      expect(DEFAULT_PLAN_FLAGS.pro.recurringExpenses).toBe(true);
      expect(DEFAULT_PLAN_FLAGS.pro.savingsGoals).toBe(true);
    });
  });
});
