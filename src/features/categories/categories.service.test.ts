import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/categories/categories.repository", () => ({
  CategoriesRepository: class {},
  categoriesRepository: {},
}));

import { CategoriesService } from "@/features/categories/categories.service";
import { NotFoundError } from "@/server/kernel/errors";

describe("CategoriesService.update", () => {
  const repo = {
    update: vi.fn(),
  };
  const service = new CategoriesService(repo as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns NotFound when the category is missing", async () => {
    repo.update.mockResolvedValue(null);
    const result = await service.update("missing", "ws1", { name: "مكتب" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error.code).toBe("categoryNotFound");
    }
  });

  it("returns the updated category", async () => {
    const doc = { _id: "c1", name: "مكتب", nameEn: "Office" };
    repo.update.mockResolvedValue(doc);
    const result = await service.update("c1", "ws1", { name: "مكتب", nameEn: "Office" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(doc);
    expect(repo.update).toHaveBeenCalledWith("c1", "ws1", { name: "مكتب", nameEn: "Office" });
  });
});
