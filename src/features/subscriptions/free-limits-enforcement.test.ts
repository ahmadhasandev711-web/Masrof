import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLAN_CONFIGS,
  DEFAULT_PLAN_FLAGS,
  isUnlimitedQuantity,
} from "@/features/subscriptions/default-plans";
import { toQuantityUsage } from "@/features/subscriptions/quantity-usage";

describe("Strict Free Plan Limits Enforcement", () => {
  describe("1. Workspaces Limit (3 workspaces max on Free, Unlimited on Pro)", () => {
    it("Free plan config specifies exactly 3 workspaces", () => {
      expect(DEFAULT_PLAN_CONFIGS.free.maxWorkspaces).toBe(3);
    });

    it("allows a Free user with fewer than 3 workspaces to create a workspace", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxWorkspaces;
      expect(0 < limit).toBe(true);
      expect(2 < limit).toBe(true);
      expect(toQuantityUsage(0, limit).atLimit).toBe(false);
      expect(toQuantityUsage(2, limit).atLimit).toBe(false);
    });

    it("strictly blocks a Free user with 3 workspaces from creating a 4th workspace", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxWorkspaces;
      const allowsFourth = 3 < limit;
      expect(allowsFourth).toBe(false);
      expect(toQuantityUsage(3, limit).atLimit).toBe(true);
      expect(toQuantityUsage(4, limit).atLimit).toBe(true);
    });

    it("Pro plan allows unlimited workspaces", () => {
      expect(isUnlimitedQuantity(DEFAULT_PLAN_CONFIGS.pro.maxWorkspaces)).toBe(true);
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

  describe("3. Monthly Invoices Limit (10 invoices / month on Free)", () => {
    it("Free plan config specifies exactly 10 invoices per month", () => {
      expect(DEFAULT_PLAN_CONFIGS.free.maxInvoicesPerMonth).toBe(10);
    });

    it("allows Free users to create invoices when under the 10 invoice limit", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxInvoicesPerMonth;
      expect(0 < limit).toBe(true);
      expect(5 < limit).toBe(true);
      expect(9 < limit).toBe(true);
      expect(toQuantityUsage(9, limit).atLimit).toBe(false);
    });

    it("strictly blocks invoice creation when reaching 10 invoices in the month", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxInvoicesPerMonth;
      expect(10 < limit).toBe(false);
      expect(11 < limit).toBe(false);
      expect(toQuantityUsage(10, limit).atLimit).toBe(true);
      expect(toQuantityUsage(11, limit).atLimit).toBe(true);
    });

    it("Pro plan has unlimited invoices per month", () => {
      const proLimit = DEFAULT_PLAN_CONFIGS.pro.maxInvoicesPerMonth;
      expect(isUnlimitedQuantity(proLimit)).toBe(true);
      expect(toQuantityUsage(10, proLimit).unlimited).toBe(true);
      expect(toQuantityUsage(1000, proLimit).atLimit).toBe(false);
    });
  });

  describe("4. Clients & Projects Limit (20 clients and 5 active projects on Free)", () => {
    it("Free plan config specifies max 20 clients", () => {
      expect(DEFAULT_PLAN_CONFIGS.free.maxClients).toBe(20);
    });

    it("allows creating clients under 20 and blocks at 20", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxClients;
      expect(19 < limit).toBe(true);
      expect(20 < limit).toBe(false);
      expect(21 < limit).toBe(false);
      expect(toQuantityUsage(19, limit).atLimit).toBe(false);
      expect(toQuantityUsage(20, limit).atLimit).toBe(true);
    });

    it("Free plan config specifies max 5 active projects", () => {
      expect(DEFAULT_PLAN_CONFIGS.free.maxActiveProjects).toBe(5);
    });

    it("allows creating active projects under 5 and blocks at 5", () => {
      const limit = DEFAULT_PLAN_CONFIGS.free.maxActiveProjects;
      expect(4 < limit).toBe(true);
      expect(5 < limit).toBe(false);
      expect(6 < limit).toBe(false);
      expect(toQuantityUsage(4, limit).atLimit).toBe(false);
      expect(toQuantityUsage(5, limit).atLimit).toBe(true);
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
});
