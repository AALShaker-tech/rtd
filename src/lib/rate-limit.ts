/**
 * A tiny in-memory fixed-window rate limiter.
 *
 * Pure and dependency-free so it can be unit-tested and reused anywhere. It
 * guards the two unauthenticated entry points that are cheap to abuse today:
 * staff login (brute force) and verification-code issuance (SMS cost / bombing).
 *
 * NOTE (scaling): state lives in this process's memory, so limits are per
 * instance. That is enough to blunt abuse from a single origin on a single
 * server. For a multi-instance / serverless deployment, swap the store for a
 * shared backend (e.g. Redis via `@upstash/ratelimit`) — the call sites and the
 * `RateLimitResult` contract stay the same.
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms when the window rolls over
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  /** Remaining allowance in the current window. */
  remaining: number;
  /** Seconds until the window resets (useful for a Retry-After hint). */
  retryAfterSeconds: number;
}

/**
 * Record a hit against `key` and report whether it is allowed.
 *
 * @param key       identifies the actor + action, e.g. `login:1.2.3.4:a@b.com`
 * @param limit     max hits permitted per window
 * @param windowMs  window length in milliseconds
 * @param now       injectable clock (defaults to Date.now) for testing
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  // Opportunistic sweep so the map can't grow unbounded over a long-lived process.
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds };
}

/** Clear limiter state — a specific key, or everything. Primarily for tests. */
export function resetRateLimit(key?: string): void {
  if (key) buckets.delete(key);
  else buckets.clear();
}
