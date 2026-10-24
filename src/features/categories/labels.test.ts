import { describe, expect, it } from "vitest";
import { resolveCategoryLabel } from "@/features/categories/labels";

describe("resolveCategoryLabel", () => {
  const row = { name: "راتب", nameEn: "Salary" };

  it("returns Arabic name for ar locale", () => {
    expect(resolveCategoryLabel(row, "ar")).toBe("راتب");
  });

  it("returns English name for en locale when nameEn is set", () => {
    expect(resolveCategoryLabel(row, "en")).toBe("Salary");
  });

  it("falls back to Arabic when nameEn is missing", () => {
    expect(resolveCategoryLabel({ name: "مصروف مخصص" }, "en")).toBe("مصروف مخصص");
  });
});
