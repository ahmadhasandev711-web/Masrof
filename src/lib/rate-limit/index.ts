import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { RateLimitCounterModel } from "@/models/rate-limit-counter";
import { checkMemoryRateLimit, clientKeyFromRequest } from "@/lib/rate-limit/memory";
import { resultForCount, windowStartMs, type RateLimitResult } from "@/lib/rate-limit/window";

export { clientKeyFromRequest };
export type { RateLimitResult };

/**
 * Distributed fixed-window rate limiter backed by MongoDB.
 *
 * The in-memory limiter only counts requests inside a single Node process, so
 * on Vercel every concurrent lambda gets its own fresh allowance and the limit
 * is effectively multiplied by the number of warm instances. Counters live in
 * one shared collection instead, incremented atomically, and are reaped by a
 * TTL index on `expiresAt`.
 *
 * If Mongo is unreachable the request is still counted in-process rather than
 * failing open completely.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = new Date(windowStartMs(now, windowMs));

  try {
    await connectToDatabase();

    const counter = await RateLimitCounterModel.findOneAndUpdate(
      { key, windowStart },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date(windowStart.getTime() + windowMs) },
      },
      { upsert: true, new: true, projection: { count: 1 } },
    ).lean();

    return resultForCount(counter?.count ?? 1, limit, now, windowStart.getTime(), windowMs);
  } catch {
    return checkMemoryRateLimit(key, limit, windowMs);
  }
}
