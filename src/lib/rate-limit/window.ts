/**
 * Pure fixed-window rate limit arithmetic, shared by the in-memory and the
 * MongoDB-backed limiters so both agree on window boundaries and retry hints.
 */
export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/** Start of the fixed window `now` falls into, aligned on `windowMs` boundaries. */
export function windowStartMs(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

export function retryAfterSec(now: number, windowStart: number, windowMs: number): number {
  return Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000));
}

export function resultForCount(
  count: number,
  limit: number,
  now: number,
  windowStart: number,
  windowMs: number,
): RateLimitResult {
  if (count > limit) {
    return { ok: false, retryAfterSec: retryAfterSec(now, windowStart, windowMs) };
  }
  return { ok: true };
}
