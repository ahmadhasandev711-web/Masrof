/**
 * Process-local rate limiter, used as the fallback when the shared
 * MongoDB-backed limiter in `@/lib/rate-limit` cannot reach the database.
 * It only counts requests seen by one Node process, so callers should always
 * go through `checkRateLimit` rather than using this directly.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }

  existing.count += 1;
  return { ok: true };
}

export function clientKeyFromRequest(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}
