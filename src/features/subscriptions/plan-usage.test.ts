import { describe, expect, it } from "vitest";
import { toQuantityUsage } from "@/features/subscriptions/quantity-usage";

describe("toQuantityUsage", () => {
  it("shows Free invoice cap as 7/10 and not at limit", () => {
    expect(toQuantityUsage(7, 10)).toEqual({
      used: 7,
      limit: 10,
      unlimited: false,
      atLimit: false,
    });
  });

  it("marks the cap as reached at 10/10", () => {
    expect(toQuantityUsage(10, 10).atLimit).toBe(true);
  });

  it("hides the meter math for unlimited Pro (-1)", () => {
    expect(toQuantityUsage(50, -1)).toMatchObject({ unlimited: true, atLimit: false });
  });
});
