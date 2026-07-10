import { describe, expect, it } from "vitest";
import { sanitizeDisplayName } from "@/lib/user-display-name";

describe("sanitizeDisplayName", () => {
  it("returns fallback for corrupted question-mark names", () => {
    expect(sanitizeDisplayName("???")).toBe("—");
    expect(sanitizeDisplayName("??????")).toBe("—");
  });

  it("keeps valid names", () => {
    expect(sanitizeDisplayName("Ahmad Hasan")).toBe("Ahmad Hasan");
    expect(sanitizeDisplayName("أحمد حسين")).toBe("أحمد حسين");
  });
});
