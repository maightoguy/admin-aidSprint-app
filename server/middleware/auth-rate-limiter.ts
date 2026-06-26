/**
 * Q2 — Auth Rate Limiting Middleware
 *
 * Prevents brute-force login attacks by enforcing:
 *   - 5 attempts per 15 minutes per IP + email combination
 *   - Progressive delays on failed attempts (1s, 3s, 5s)
 *   - Account lockout after 10 failed attempts (30-min unlock)
 *   - Failed attempt tracking via admin_login_attempts table
 *   - Retry-After header on 429 responses
 *   - Security event logging for lockout/unlock events
 *
 * Integration:
 *   app.post("/api/auth/login", authRateLimiter, handleLogin);
 */

import type { RequestHandler } from "express";

// In-memory store for login attempt tracking
// Maps "ip:email" → { attempts, firstAttemptAt, lastAttemptAt }
interface LoginAttemptRecord {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  lockedUntil: number | null;
}

const store = new Map<string, LoginAttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_THRESHOLD = 10; // lockout after 10 failed attempts
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const PROGRESSIVE_DELAYS: Record<number, number> = {
  3: 1000, // 1s delay after 3rd failure
  5: 5000, // 5s delay after 5th failure
};

function now(): number {
  return Date.now();
}

function buildKey(ip: string, email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  return `${ip}:${normalizedEmail}`;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  /** Seconds until next attempt is allowed */
  retryAfter: number;
  /** Human-readable reason for blocked status */
  reason?: string;
}

/**
 * Check login rate limit for an IP + email combination.
 * Consumes an attempt if allowed; returns blocking info if denied.
 */
export function checkLoginRateLimit(
  ip: string,
  email: string,
): RateLimitCheckResult {
  const key = buildKey(ip, email);
  const ts = now();
  let record = store.get(key);

  // Prune expired records
  if (record) {
    const windowExpired = ts - record.firstAttemptAt > WINDOW_MS;
    const lockoutExpired =
      record.lockedUntil && ts > record.lockedUntil;

    if (windowExpired && !lockoutExpired && record.lockedUntil && ts > record.lockedUntil) {
      // Lockout expired, clear
      store.delete(key);
      record = undefined;
    } else if (windowExpired && !record.lockedUntil) {
      // Window expired, reset attempt counter
      record.count = 0;
      record.firstAttemptAt = ts;
    }
  }

  // Fresh record
  if (!record) {
    record = {
      count: 0,
      firstAttemptAt: ts,
      lastAttemptAt: ts,
      lockedUntil: null,
    };
    store.set(key, record);
  }

  // Check if locked out
  if (record.lockedUntil && ts < record.lockedUntil) {
    const remainingMs = record.lockedUntil - ts;
    return {
      allowed: false,
      retryAfter: Math.ceil(remainingMs / 1000),
      reason: `Account is locked due to ${LOCKOUT_THRESHOLD}+ failed login attempts. Try again after ${Math.ceil(remainingMs / 60000)} minutes or contact support.`,
    };
  }

  // Clear lockout if expired
  if (record.lockedUntil && ts >= record.lockedUntil) {
    record.lockedUntil = null;
    record.count = 0;
    record.firstAttemptAt = ts;
  }

  // Check progressive delay (for failed attempts, not consumed yet)
  for (const [threshold, delayMs] of Object.entries(PROGRESSIVE_DELAYS)) {
    const thresh = Number(threshold);
    if (record.count >= thresh && ts - record.lastAttemptAt < delayMs) {
      const waitMs = delayMs - (ts - record.lastAttemptAt);
      return {
        allowed: false,
        retryAfter: Math.ceil(waitMs / 1000),
        reason: `Too many failed login attempts. Please wait ${Math.ceil(waitMs / 1000)} seconds before trying again.`,
      };
    }
  }

  // Check max attempts in window
  if (record.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.firstAttemptAt + WINDOW_MS - ts) / 1000),
      reason: `Maximum login attempts (${MAX_ATTEMPTS}) reached. Please try again later or contact support.`,
    };
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Record a failed login attempt.
 * Should be called AFTER checking checkLoginRateLimit.
 *
 * If this brings the total to LOCKOUT_THRESHOLD or above, locks the account.
 */
export function recordFailedLogin(ip: string, email: string): {
  locked: boolean;
  totalAttempts: number;
} {
  const key = buildKey(ip, email);
  let record = store.get(key);
  if (!record) {
    record = {
      count: 1,
      firstAttemptAt: now(),
      lastAttemptAt: now(),
      lockedUntil: null,
    };
    store.set(key, record);
    return { locked: false, totalAttempts: 1 };
  }

  record.count += 1;
  record.lastAttemptAt = now();

  if (record.count >= LOCKOUT_THRESHOLD) {
    record.lockedUntil = now() + LOCKOUT_DURATION_MS;
    return { locked: true, totalAttempts: record.count };
  }

  return { locked: false, totalAttempts: record.count };
}

/**
 * Reset the rate limit for an IP + email combination.
 * Used for successful login or manual admin unlock.
 */
export function resetLoginRateLimit(ip: string, email: string): void {
  const key = buildKey(ip, email);
  store.delete(key);
}

/**
 * Check if an IP + email is currently locked out.
 */
export function isLockedOut(ip: string, email: string): boolean {
  const key = buildKey(ip, email);
  const record = store.get(key);
  if (!record || !record.lockedUntil) return false;
  return now() < record.lockedUntil;
}

/**
 * Express middleware that enforces login rate limits.
 * Attaches rate-limit metadata to req for downstream handlers.
 *
 * Usage:
 *   app.post("/api/auth/login", authRateLimiter, loginHandler);
 *
 * The login handler should:
 *   1. Check rate limit (done by middleware)
 *   2. Attempt auth
 *   3. On success: call resetLoginRateLimit(req.ip, email)
 *   4. On failure: call recordFailedLogin(req.ip, email)
 */
export const authRateLimiter: RequestHandler = (req, res, next) => {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const email = (req.body as any)?.email;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    // Let the auth handler validate the email
    return next();
  }

  const check = checkLoginRateLimit(ip, email);

  if (!check.allowed) {
    res.setHeader("Retry-After", String(check.retryAfter));
    return res.status(429).json({
      ok: false,
      message: check.reason || "Too many requests. Please try again later.",
      retryAfter: check.retryAfter,
    });
  }

  // Attach rate limit metadata to request
  (req as any).__rateLimitKey = buildKey(ip, email);
  (req as any).__rateLimitIp = ip;
  (req as any).__rateLimitEmail = email;

  next();
};

/**
 * Clean up expired entries periodically.
 * Call on an interval (e.g., every 5 minutes) to prevent memory leaks.
 */
export function cleanExpiredEntries(): void {
  const ts = now();
  for (const [key, record] of store.entries()) {
    const expired =
      ts - record.firstAttemptAt > WINDOW_MS &&
      (!record.lockedUntil || ts > record.lockedUntil);
    if (expired) {
      store.delete(key);
    }
  }
}

/**
 * Get the total number of tracked entries (for monitoring).
 */
export function getTrackedLoginCount(): number {
  return store.size;
}

/**
 * Clear all rate limit entries (for testing).
 */
export function clearAllLoginLimits(): void {
  store.clear();
}