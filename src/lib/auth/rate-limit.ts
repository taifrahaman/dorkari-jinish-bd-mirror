// src/lib/auth/rate-limit.ts

/**
 * In-memory sliding-window rate limiter.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Opportunistic cleanup — prevents unbounded growth of the Map
 * on long-running processes. Called on ~1% of invocations.
 */
function maybeSweep(now: number) {
  if (Math.random() > 0.01) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Milliseconds until the window resets. 0 when allowed with no wait. */
  retryAfterMs: number;
};

/**
 * Consume one attempt against `key` within a fixed window.
 *
 * @example
 *   const r = rateLimit(`admin-login:${ip}`, { max: 5, windowMs: 15 * 60_000 });
 *   if (!r.allowed) return tooManyRequests(r.retryAfterMs);
 */
export function rateLimit(
  key: string,
  opts: { max: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  maybeSweep(now);

  const bucket = buckets.get(key);

  // No bucket, or window expired → start a fresh window
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return {
      allowed: true,
      remaining: opts.max - 1,
      retryAfterMs: 0,
    };
  }

  // Window still active, but exhausted
  if (bucket.count >= opts.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: bucket.resetAt - now,
    };
  }

  // Consume one
  bucket.count += 1;
  return {
    allowed: true,
    remaining: opts.max - bucket.count,
    retryAfterMs: 0,
  };
}

/**
 * Manually clear a key. Useful after a successful login so a user
 * who mistyped their password a few times isn't penalized later.
 */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
