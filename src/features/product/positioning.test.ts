import { describe, expect, it } from "vitest";
import { PRODUCT_POSITIONING } from "@/features/product/positioning";

describe("growth phase scaffolding", () => {
  it("keeps freelancer/invoice wedge as the lead positioning", () => {
    expect(PRODUCT_POSITIONING.leadWedge).toContain("invoices");
    expect(PRODUCT_POSITIONING.primaryAudience).toContain("freelancers");
    expect(PRODUCT_POSITIONING.onlinePayments).toBe("manual_admin_until_paymob");
  });
});
