import { describe, it, expect } from "vitest";
import { mobileClientsListResponseSchema } from "@contracts/mobile/clients";
import { mobileDashboardResponseSchema } from "@contracts/mobile/dashboard";
import { mobileErrorSchema } from "@contracts/mobile/common";

describe("mobile contract shapes", () => {
  it("accepts a clients list sample", () => {
    const result = mobileClientsListResponseSchema.safeParse({
      items: [
        {
          id: "c1",
          name: "Acme",
          email: "a@example.com",
          phone: null,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a dashboard sample", () => {
    const result = mobileDashboardResponseSchema.safeParse({
      workspace: { id: "ws-1", name: "Main", currency: "EGP" },
      totalBalance: 1000,
      monthIncome: 500,
      monthExpense: 200,
      monthNet: 300,
      canConvertAll: true,
      budgetWarnings: 0,
      dueRecurring: 1,
      receivableProjects: 2,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an error sample", () => {
    const result = mobileErrorSchema.safeParse({
      error: "unauthorized",
      message: "Session required",
    });
    expect(result.success).toBe(true);
  });
});
