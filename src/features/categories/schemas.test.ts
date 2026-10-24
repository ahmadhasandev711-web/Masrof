import { describe, expect, it } from "vitest";
import { createCategorySchema } from "@/features/categories/schemas";

const t = (key: string) => key;

describe("createCategorySchema", () => {
  const base = {
    workspaceId: "507f1f77bcf86cd799439011",
    name: "مصروف مكتب",
    kind: "expense" as const,
    idempotencyKey: "key-1",
  };

  it("accepts Arabic name without nameEn", () => {
    const parsed = createCategorySchema(t).safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.nameEn).toBeUndefined();
  });

  it("accepts optional nameEn when at least 2 chars", () => {
    const parsed = createCategorySchema(t).safeParse({ ...base, nameEn: "Office" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.nameEn).toBe("Office");
  });

  it("treats blank nameEn as omitted", () => {
    const parsed = createCategorySchema(t).safeParse({ ...base, nameEn: "   " });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.nameEn).toBeUndefined();
  });

  it("rejects single-character nameEn", () => {
    const parsed = createCategorySchema(t).safeParse({ ...base, nameEn: "x" });
    expect(parsed.success).toBe(false);
  });
});
