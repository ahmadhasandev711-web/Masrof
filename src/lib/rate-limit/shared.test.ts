import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/mongoose", () => ({ connectToDatabase: () => connect() }));

const connect = vi.fn(async () => undefined);
const counters = new Map<string, number>();
const findOneAndUpdate = vi.fn((filter: { key: string; windowStart: Date }) => {
  const id = `${filter.key}@${filter.windowStart.getTime()}`;
  const count = (counters.get(id) ?? 0) + 1;
  counters.set(id, count);
  return { lean: async () => ({ count }) };
});

vi.mock("@/models/rate-limit-counter", () => ({
  RateLimitCounterModel: {
    findOneAndUpdate: (...args: [{ key: string; windowStart: Date }]) => findOneAndUpdate(...args),
  },
}));

const { checkRateLimit } = await import("@/lib/rate-limit");
const { windowStartMs } = await import("@/lib/rate-limit/window");

beforeEach(() => {
  counters.clear();
  connect.mockResolvedValue(undefined);
  findOneAndUpdate.mockClear();
});

describe("windowStartMs", () => {
  it("aligns timestamps onto fixed window boundaries", () => {
    expect(windowStartMs(65_000, 60_000)).toBe(60_000);
    expect(windowStartMs(119_999, 60_000)).toBe(60_000);
    expect(windowStartMs(120_000, 60_000)).toBe(120_000);
  });
});

describe("checkRateLimit", () => {
  it("shares one counter across callers, unlike a per-process limiter", async () => {
    expect(await checkRateLimit("shared", 2, 60_000)).toEqual({ ok: true });
    expect(await checkRateLimit("shared", 2, 60_000)).toEqual({ ok: true });

    const blocked = await checkRateLimit("shared", 2, 60_000);
    expect(blocked.ok).toBe(false);
    expect(findOneAndUpdate).toHaveBeenCalledTimes(3);
  });

  it("reports how long to wait, capped by the window length", async () => {
    const blocked = await checkRateLimit("retry", 0, 60_000);

    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
      expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
    }
  });

  it("keeps separate counters per key", async () => {
    await checkRateLimit("key-a", 1, 60_000);

    expect(await checkRateLimit("key-b", 1, 60_000)).toEqual({ ok: true });
  });

  it("falls back to the in-process limiter when Mongo is unreachable", async () => {
    connect.mockRejectedValue(new Error("no connection"));

    expect(await checkRateLimit("offline", 1, 60_000)).toEqual({ ok: true });
    expect((await checkRateLimit("offline", 1, 60_000)).ok).toBe(false);
  });
});
