/**
 * Admin Rate Limiting Utility
 *
 * Provides in-memory sliding-window rate limiting for admin operations
 * to prevent abuse, brute-force attacks, and system overload.
 *
 * Strategy (per Q1 contract):
 *   - Auth:      5 attempts / 15 minutes per IP+email
 *   - Mutations: 100 per minute per admin
 *   - Reads:     1000 per minute per admin
 *   - Per-operation limits for sensitive mutations
 *   - Sliding window tracking with time-based buckets
 *
 * Integration:
 *   - Call checkRateLimit(key, config) before executing sensitive operations
 *   - Returns { allowed: boolean, remaining: number, resetAt: number }
 *   - Frontend should show rate limit status and respect 429 responses
 *   - Backend should return 429 with Retry-After header
 */

export interface RateLimitConfig {
  /** Maximum number of allowed attempts in the window */
  maxAttempts: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Human-readable operation name for error messages */
  operation?: string;
}

export interface RateLimitResult {
  /** Whether the operation is allowed */
  allowed: boolean;
  /** Number of remaining attempts in current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  resetAt: number;
  /** Recommended retry-after duration in seconds (only when not allowed) */
  retryAfterSeconds: number;
}

interface RateLimitBucket {
  timestamps: number[];
  blockedUntil: number | null;
}

/**
 * Preset rate limit configurations for admin operations
 */
export const RATE_LIMITS = {
  AUTH_LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    operation: "login",
  } as RateLimitConfig,

  MUTATIONS_GLOBAL: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    operation: "mutation",
  } as RateLimitConfig,

  READS_GLOBAL: {
    maxAttempts: 1000,
    windowMs: 60 * 1000, // 1 minute
    operation: "read",
  } as RateLimitConfig,

  CONTRACTOR_SUSPEND: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
    operation: "contractor_suspend",
  } as RateLimitConfig,

  CONTRACTOR_RESTORE: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
    operation: "contractor_restore",
  } as RateLimitConfig,

  KYC_APPROVE: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    operation: "kyc_approve",
  } as RateLimitConfig,

  KYC_REJECT: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    operation: "kyc_reject",
  } as RateLimitConfig,

  DISPUTE_RESOLVE: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
    operation: "dispute_resolve",
  } as RateLimitConfig,

  PAYOUT_ACTION: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    operation: "payout_action",
  } as RateLimitConfig,

  REFUND_ACTION: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
    operation: "refund_action",
  } as RateLimitConfig,

  /** Per-resource: prevent bulk operations on same resource */
  SAME_RESOURCE: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 5 edits/min on same resource
    operation: "same_resource",
  } as RateLimitConfig,
};

// In-memory store for rate limit buckets
const store = new Map<string, RateLimitBucket>();

/**
 * Clean up expired timestamp entries from a bucket.
 * Should be called periodically to prevent memory leaks.
 */
function pruneBucket(bucket: RateLimitBucket, now: number, windowMs: number) {
  const cutoff = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);
}

/**
 * Get or create a rate limit bucket for a given key.
 */
function getOrCreateBucket(key: string): RateLimitBucket {
  let bucket = store.get(key);
  if (!bucket) {
    bucket = { timestamps: [], blockedUntil: null };
    store.set(key, bucket);
  }
  return bucket;
}

/**
 * Check if an operation is allowed under the configured rate limit.
 *
 * @param key - Unique identifier for the rate limit scope (e.g., "admin-001:login")
 * @param config - Rate limit configuration (maxAttempts, windowMs)
 * @returns RateLimitResult with allowed/remaining/resetAt/retryAfterSeconds
 *
 * Example:
 *   const result = checkRateLimit("admin-001:login", RATE_LIMITS.AUTH_LOGIN);
 *   if (!result.allowed) {
 *     return { ok: false, message: `Too many attempts. Retry after ${result.retryAfterSeconds}s` };
 *   }
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const bucket = getOrCreateBucket(key);

  // Check if blocked
  if (bucket.blockedUntil && now < bucket.blockedUntil) {
    const remainingMs = bucket.blockedUntil - now;
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.blockedUntil,
      retryAfterSeconds: Math.ceil(remainingMs / 1000),
    };
  }

  // Clear block if expired
  if (bucket.blockedUntil && now >= bucket.blockedUntil) {
    bucket.blockedUntil = null;
    bucket.timestamps = [];
  }

  // Prune expired timestamps
  pruneBucket(bucket, now, config.windowMs);

  // Check if limit exceeded
  if (bucket.timestamps.length >= config.maxAttempts) {
    // Progressive lockout: block for windowMs
    bucket.blockedUntil = now + config.windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.blockedUntil,
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  // Record the attempt
  bucket.timestamps.push(now);
  const remaining = config.maxAttempts - bucket.timestamps.length;

  // Find the earliest timestamp that will expire
  const oldestTimestamp = bucket.timestamps[0];
  const resetAt = oldestTimestamp + config.windowMs;

  return {
    allowed: true,
    remaining,
    resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset rate limit for a given key.
 * Used for manual admin unlock or testing.
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Get current rate limit status for a key without consuming an attempt.
 */
export function getRateLimitStatus(
  key: string,
  config: RateLimitConfig,
): Omit<RateLimitResult, "retryAfterSeconds"> & { blocked: boolean } {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket) {
    return {
      allowed: true,
      remaining: config.maxAttempts,
      resetAt: now + config.windowMs,
      blocked: false,
    };
  }

  if (bucket.blockedUntil && now < bucket.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.blockedUntil,
      blocked: true,
    };
  }

  // Clone and prune without modifying original
  const timestamps = bucket.timestamps.filter(
    (t) => t > now - config.windowMs,
  );
  const remaining = Math.max(0, config.maxAttempts - timestamps.length);
  const resetAt = timestamps.length > 0
    ? timestamps[0] + config.windowMs
    : now + config.windowMs;

  return {
    allowed: remaining > 0,
    remaining,
    resetAt,
    blocked: false,
  };
}

/**
 * Clear all rate limit buckets.
 * Useful for testing and cleanup.
 */
export function clearAllRateLimits(): void {
  store.clear();
}

/**
 * Get the total number of tracked rate limit keys.
 */
export function getTrackedKeyCount(): number {
  return store.size;
}

/**
 * Progressive lockout duration based on consecutive violations.
 * After lockout expires, if the same key hits the limit again,
 * the lockout duration doubles (up to a maximum).
 *
 * @param consecutiveViolations - Number of times this key has been rate-limited
 * @param baseWindowMs - The base window duration from config
 * @returns The progressive lockout duration in ms
 */
export function getProgressiveLockoutMs(
  consecutiveViolations: number,
  baseWindowMs: number,
): number {
  const multiplier = Math.min(
    Math.pow(2, consecutiveViolations - 1),
    8, // max 8x lockout
  );
  return baseWindowMs * multiplier;
}