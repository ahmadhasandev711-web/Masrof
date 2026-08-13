import { describe, expect, it } from "vitest";
import { checkMemoryRateLimit } from "@/lib/rate-limit/memory";

describe("checkMemoryRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-allow-${Date.now()}`;
    expect(checkMemoryRateLimit(key, 2, 60_000).ok).toBe(true);
    expect(checkMemoryRateLimit(key, 2, 60_000).ok).toBe(true);
  });

  it("blocks after the limit", () => {
    const key = `test-block-${Date.now()}`;
    expect(checkMemoryRateLimit(key, 1, 60_000).ok).toBe(true);
    const blocked = checkMemoryRateLimit(key, 1, 60_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });
});
