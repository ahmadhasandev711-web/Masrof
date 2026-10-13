import { describe, expect, it } from "vitest";
import { DEFAULT_PLAN_CONFIGS } from "@/features/subscriptions/default-plans";
import { toQuantityUsage } from "@/features/subscriptions/quantity-usage";

describe("Single Workspace Policy & Team Exclusivity", () => {
  it("enforces max 1 workspace across Free and Pro default configurations", () => {
    expect(DEFAULT_PLAN_CONFIGS.free.maxWorkspaces).toBe(1);
    expect(DEFAULT_PLAN_CONFIGS.pro.maxWorkspaces).toBe(1);
  });

  it("blocks creating a second workspace when 1 workspace is already owned", () => {
    const freeMax = DEFAULT_PLAN_CONFIGS.free.maxWorkspaces;
    const proMax = DEFAULT_PLAN_CONFIGS.pro.maxWorkspaces;

    expect(1 < freeMax).toBe(false);
    expect(1 < proMax).toBe(false);

    expect(toQuantityUsage(1, freeMax).atLimit).toBe(true);
    expect(toQuantityUsage(1, proMax).atLimit).toBe(true);
  });

  it("allows workspace creation only when 0 workspaces are owned", () => {
    const freeMax = DEFAULT_PLAN_CONFIGS.free.maxWorkspaces;
    expect(0 < freeMax).toBe(true);
    expect(toQuantityUsage(0, freeMax).atLimit).toBe(false);
  });

  it("confirms Pro plan pricing is annual at 250 EGP with team capacity of 5", () => {
    expect(DEFAULT_PLAN_CONFIGS.pro.priceYearly).toBe(250);
    expect(DEFAULT_PLAN_CONFIGS.pro.maxMembers).toBe(5);
    expect(DEFAULT_PLAN_CONFIGS.free.maxMembers).toBe(1);
  });
});
