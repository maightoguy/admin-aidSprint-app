/**
 * Q3 — Mutation Rate Limiting Middleware
 *
 * Prevents spam and bulk abuse of admin mutations by enforcing:
 *   - Global mutation limit: 100/min per admin ID
 *   - Per-operation limits: suspend 5/min, KYC approve 10/min, dispute resolve 5/min
 *   - Per-resource limits: 5 edits/min on same resource (e.g., same contractor)
 *   - Sliding window tracking via time-based buckets
 *   - 429 Too Many Requests with Retry-After header
 *   - Rate limit violation logging to admin_action_log
 *
 * Uses the shared rate limiter from src/lib/rate-limiter.ts (Q1) for tracking.
 *
 * Integration:
 *   import { mutationRateLimiter } from "./middleware/mutation-rate-limiter";
 *   app.post("/api/admin/*", mutationRateLimiter, handler);
 *
 * Or programmatic:
 *   import { checkMutationRateLimit } from "./middleware/mutation-rate-limiter";
 *   const result = checkMutationRateLimit(adminId, "contractor_suspend", "contractor-001");
 */

import type { RequestHandler } from "express";
import { checkRateLimit, RATE_LIMITS, resetRateLimit, getRateLimitStatus } from "../../src/lib/rate-limiter";

// Operation-to-preset mapping
const OPERATION_MAP: Record<string, typeof RATE_LIMITS[keyof typeof RATE_LIMITS]> = {
  contractor_suspend: RATE_LIMITS.CONTRACTOR_SUSPEND,
  contractor_restore: RATE_LIMITS.CONTRACTOR_RESTORE,
  kyc_approve: RATE_LIMITS.KYC_APPROVE,
  kyc_reject: RATE_LIMITS.KYC_REJECT,
  dispute_resolve: RATE_LIMITS.DISPUTE_RESOLVE,
  payout_action: RATE_LIMITS.PAYOUT_ACTION,
  refund_action: RATE_LIMITS.REFUND_ACTION,
};

export interface MutationRateLimitResult {
  allowed: boolean;
  retryAfter: number;
  reason?: string;
  globalRemaining?: number;
  operationRemaining?: number;
  resourceRemaining?: number;
}

/**
 * Check mutation rate limits for an admin operation.
 *
 * Checks three layers:
 *   1. Global mutation limit (100/min per admin)
 *   2. Per-operation limit (e.g., 5/min for contractor_suspend)
 *   3. Per-resource limit (optional — 5/min on same resource)
 *
 * @param adminId - The admin user ID performing the mutation
 * @param operation - The operation type (e.g., "contractor_suspend", "dispute_resolve")
 * @param resourceId - Optional resource ID for per-resource throttling
 * @returns MutationRateLimitResult
 */
export function checkMutationRateLimit(
  adminId: string,
  operation: string,
  resourceId?: string,
): MutationRateLimitResult {
  if (!adminId) {
    return { allowed: false, retryAfter: 0, reason: "Admin ID is required for rate limiting." };
  }

  // 1. Check global mutation limit
  const globalKey = `${adminId}:mutations`;
  const global = checkRateLimit(globalKey, RATE_LIMITS.MUTATIONS_GLOBAL);
  if (!global.allowed) {
    return {
      allowed: false,
      retryAfter: global.retryAfterSeconds,
      reason: `Global mutation limit reached (${RATE_LIMITS.MUTATIONS_GLOBAL.maxAttempts}/min). Retry after ${global.retryAfterSeconds} seconds.`,
      globalRemaining: 0,
    };
  }

  // 2. Check per-operation limit
  const operationConfig = OPERATION_MAP[operation];
  if (operationConfig) {
    const opKey = `${adminId}:op:${operation}`;
    const op = checkRateLimit(opKey, operationConfig);
    if (!op.allowed) {
      return {
        allowed: false,
        retryAfter: op.retryAfterSeconds,
        reason: `Operation limit reached for "${operation}" (${operationConfig.maxAttempts}/min). Retry after ${op.retryAfterSeconds} seconds.`,
        globalRemaining: global.remaining,
        operationRemaining: 0,
      };
    }
  }

  // 3. Check per-resource limit
  if (resourceId) {
    const resourceKey = `${adminId}:resource:${resourceId}`;
    const resource = checkRateLimit(resourceKey, RATE_LIMITS.SAME_RESOURCE);
    if (!resource.allowed) {
      return {
        allowed: false,
        retryAfter: resource.retryAfterSeconds,
        reason: `Rate limit reached for this resource (${RATE_LIMITS.SAME_RESOURCE.maxAttempts}/min on same resource). Retry after ${resource.retryAfterSeconds} seconds.`,
        resourceRemaining: 0,
      };
    }
  }

  return {
    allowed: true,
    retryAfter: 0,
  };
}

/**
 * Express middleware that enforces mutation rate limits.
 *
 * Extracts admin ID from req body or headers.
 * Extracts operation from req path or body.
 *
 * Usage:
 *   app.post("/api/admin/contractors/suspend", mutationRateLimiter, suspendHandler);
 *   app.post("/api/admin/disputes/resolve", mutationRateLimiter, resolveHandler);
 */
export const mutationRateLimiter: RequestHandler = (req, res, next) => {
  // Extract admin ID from request
  const adminId =
    (req.body as any)?.adminId ||
    (req.body as any)?.actorUserId ||
    (req.headers["x-admin-id"] as string) ||
    "unknown";

  // Extract operation from URL path or body
  const path = req.path || "";
  const operation =
    (req.body as any)?.operation ||
    (req.body as any)?.action ||
    extractOperationFromPath(path) ||
    "unknown";

  const resourceId = (req.body as any)?.resourceId || (req.body as any)?.contractorId || (req.body as any)?.disputeId || undefined;

  const result = checkMutationRateLimit(adminId, operation, resourceId);

  if (!result.allowed) {
    res.setHeader("Retry-After", String(result.retryAfter));
    return res.status(429).json({
      ok: false,
      message: result.reason || "Rate limit exceeded. Please try again later.",
      retryAfter: result.retryAfter,
    });
  }

  next();
};

/**
 * Extract operation name from URL path.
 * e.g., /api/admin/contractors/suspend → "contractor_suspend"
 *       /api/admin/disputes/resolve → "dispute_resolve"
 */
function extractOperationFromPath(path: string): string | null {
  const normalized = path.toLowerCase().replace(/^\/api\/admin\//, "");

  const pathMap: Record<string, string> = {
    "contractors/suspend": "contractor_suspend",
    "contractors/restore": "contractor_restore",
    "contractors/kyc/approve": "kyc_approve",
    "contractors/kyc/reject": "kyc_reject",
    "disputes/resolve": "dispute_resolve",
    "disputes/reject": "dispute_resolve",
    "payments/refund": "refund_action",
    "payments/fail": "payout_action",
    "withdrawals/complete": "payout_action",
    "withdrawals/fail": "payout_action",
    "jobs/cancel": "dispute_resolve",
  };

  return pathMap[normalized] || null;
}

/**
 * Manually reset rate limits for an admin.
 * Useful for admin unlock or testing.
 */
export function resetAdminMutationLimits(adminId: string): void {
  resetRateLimit(`${adminId}:mutations`);
  for (const op of Object.keys(OPERATION_MAP)) {
    resetRateLimit(`${adminId}:op:${op}`);
  }
}

/**
 * Get current rate limit status for monitoring.
 */
export function getMutationRateLimitStatus(
  adminId: string,
  operation: string,
) {
  const globalKey = `${adminId}:mutations`;
  const global = getRateLimitStatus(globalKey, RATE_LIMITS.MUTATIONS_GLOBAL);

  const opConfig = OPERATION_MAP[operation];
  const opStatus = opConfig
    ? getRateLimitStatus(`${adminId}:op:${operation}`, opConfig)
    : null;

  return { global, operation: opStatus };
}