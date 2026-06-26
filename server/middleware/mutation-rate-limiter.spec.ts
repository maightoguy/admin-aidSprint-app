/**
 * Q3 — Mutation Rate Limiting Tests
 *
 * Validates spam/abuse prevention for admin mutations:
 *   - Global mutation limit: 100/min per admin
 *   - Per-operation limits: suspend 5/min, KYC 10/min, dispute 5/min
 *   - Per-resource limits: 5/min on same resource
 *   - Independent admins don't affect each other
 *   - Reset/unlock support
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  checkMutationRateLimit,
  resetAdminMutationLimits,
  getMutationRateLimitStatus,
} from "./mutation-rate-limiter";
import { clearAllRateLimits } from "../../src/lib/rate-limiter";

const ADMIN_ID = "admin-001";

describe("Q3: Mutation Rate Limiting Middleware", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  // ──────────────────────────────────────────────────────────
  // 1. GLOBAL MUTATION LIMIT
  // ──────────────────────────────────────────────────────────
  describe("1. Global Mutation Limit (100/min per admin)", () => {
    it("allows mutations within global limit", () => {
      for (let i = 0; i < 5; i++) {
        const r = checkMutationRateLimit(ADMIN_ID, "generic");
        expect(r.allowed).toBe(true);
      }
    });

    it("blocks after 100 mutations in 1 minute (global cap)", () => {
      for (let i = 0; i < 100; i++) {
        const r = checkMutationRateLimit(ADMIN_ID, "generic");
        expect(r.allowed).toBe(true);
      }
      const r = checkMutationRateLimit(ADMIN_ID, "generic");
      expect(r.allowed).toBe(false);
      expect(r.reason).toContain("Global mutation limit");
    });
  });

  // ──────────────────────────────────────────────────────────
  // 2. PER-OPERATION LIMITS
  // ──────────────────────────────────────────────────────────
  describe("2. Per-Operation Limits", () => {
    it("contractor_suspend: blocks after 5/min", () => {
      for (let i = 0; i < 5; i++) {
        const r = checkMutationRateLimit(ADMIN_ID, "contractor_suspend");
        expect(r.allowed).toBe(true);
      }
      const r = checkMutationRateLimit(ADMIN_ID, "contractor_suspend");
      expect(r.allowed).toBe(false);
      expect(r.reason).toContain("contractor_suspend");
    });

    it("contractor_restore: blocks after 5/min", () => {
      for (let i = 0; i < 5; i++) {
        const r = checkMutationRateLimit(ADMIN_ID, "contractor_restore");
        expect(r.allowed).toBe(true);
      }
      const r = checkMutationRateLimit(ADMIN_ID, "contractor_restore");
      expect(r.allowed).toBe(false);
    });

    it("kyc_approve: blocks after 10/min", () => {
      for (let i = 0; i < 10; i++) {
        const r = checkMutationRateLimit(ADMIN_ID, "kyc_approve");
        expect(r.allowed).toBe(true);
      }
      const r = checkMutationRateLimit(ADMIN_ID, "kyc_approve");
      expect(r.allowed).toBe(false);
      expect(r.reason).toContain("kyc_approve");
    });

    it("kyc_reject: blocks after 10/min", () => {
      for (let i = 0; i < 10; i++) {
        const r = checkMutationRateLimit(ADMIN_ID, "kyc_reject");
        expect(r.allowed).toBe(true);
      }
      const r = checkMutationRateLimit(ADMIN_ID, "kyc_reject");
      expect(r.allowed).toBe(false);
    });

    it("dispute_resolve: blocks after 5/min", () => {
      for (let i = 0; i < 5; i++) {
        const r = checkMutationRateLimit(ADMIN_ID, "dispute_resolve");
        expect(r.allowed).toBe(true);
      }
      const r = checkMutationRateLimit(ADMIN_ID, "dispute_resolve");
      expect(r.allowed).toBe(false);
    });

    it("refund_action: blocks after 5/min", () => {
      for (let i = 0; i < 5; i++) {
        const r = checkMutationRateLimit(ADMIN_ID, "refund_action");
        expect(r.allowed).toBe(true);
      }
      const r = checkMutationRateLimit(ADMIN_ID, "refund_action");
      expect(r.allowed).toBe(false);
    });

    it("payout_action: blocks after 10/min", () => {
      for (let i = 0; i < 10; i++) {
        const r = checkMutationRateLimit(ADMIN_ID, "payout_action");
        expect(r.allowed).toBe(true);
      }
      const r = checkMutationRateLimit(ADMIN_ID, "payout_action");
      expect(r.allowed).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 3. PER-RESOURCE LIMITS
  // ──────────────────────────────────────────────────────────
  describe("3. Per-Resource Limits (5/min on same resource)", () => {
    it("blocks after 5 operations on same resource", () => {
      for (let i = 0; i < 5; i++) {
        const r = checkMutationRateLimit(ADMIN_ID, "generic", "contractor-001");
        expect(r.allowed).toBe(true);
      }
      const r = checkMutationRateLimit(ADMIN_ID, "generic", "contractor-001");
      expect(r.allowed).toBe(false);
      expect(r.reason).toContain("resource");
    });

    it("same resource limit is per-resource, not global", () => {
      for (let i = 0; i < 5; i++) {
        checkMutationRateLimit(ADMIN_ID, "generic", "contractor-001");
      }
      // Different resource should still be allowed
      const r = checkMutationRateLimit(ADMIN_ID, "generic", "contractor-002");
      expect(r.allowed).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 4. ADMIN ISOLATION
  // ──────────────────────────────────────────────────────────
  describe("4. Admin Isolation", () => {
    it("different admins are rate-limited independently", () => {
      for (let i = 0; i < 5; i++) {
        checkMutationRateLimit("admin-001", "contractor_suspend");
      }
      const r = checkMutationRateLimit("admin-002", "contractor_suspend");
      expect(r.allowed).toBe(true);
    });

    it("admin-001 hitting suspend limit doesn't block admin-002 globally", () => {
      for (let i = 0; i < 5; i++) {
        checkMutationRateLimit("admin-001", "contractor_suspend");
      }
      // admin-001 now hit suspend limit
      // admin-002 global should still be fine
      const r = checkMutationRateLimit("admin-002", "generic");
      expect(r.allowed).toBe(true); // admin-002 under global (only 1 of 100 used)
    });
  });

  // ──────────────────────────────────────────────────────────
  // 5. UNKNOWN / UNMAPPED OPERATIONS
  // ──────────────────────────────────────────────────────────
  describe("5. Unknown/Unmapped Operations", () => {
    it("unknown operation only checks global limit", () => {
      for (let i = 0; i < 50; i++) {
        // Unknown operation "custom_action" has no per-op config
        const r = checkMutationRateLimit(ADMIN_ID, "custom_action");
        expect(r.allowed).toBe(true);
      }
      // Should not be blocked (still under global 100)
      const r = checkMutationRateLimit(ADMIN_ID, "custom_action");
      expect(r.allowed).toBe(true);
    });

    it("unknown operation still counts toward global", () => {
      for (let i = 0; i < 100; i++) {
        checkMutationRateLimit(ADMIN_ID, "custom_action");
      }
      const r = checkMutationRateLimit(ADMIN_ID, "custom_action");
      expect(r.allowed).toBe(false);
      expect(r.reason).toContain("Global mutation limit");
    });
  });

  // ──────────────────────────────────────────────────────────
  // 6. RESET
  // ──────────────────────────────────────────────────────────
  describe("6. Reset & Status", () => {
    it("resetAdminMutationLimits clears all limits for admin", () => {
      for (let i = 0; i < 5; i++) {
        checkMutationRateLimit(ADMIN_ID, "contractor_suspend");
      }
      let r = checkMutationRateLimit(ADMIN_ID, "contractor_suspend");
      expect(r.allowed).toBe(false);

      resetAdminMutationLimits(ADMIN_ID);

      r = checkMutationRateLimit(ADMIN_ID, "contractor_suspend");
      expect(r.allowed).toBe(true);
    });

    it("getMutationRateLimitStatus returns current status", () => {
      checkMutationRateLimit(ADMIN_ID, "contractor_suspend");
      checkMutationRateLimit(ADMIN_ID, "contractor_suspend");

      const status = getMutationRateLimitStatus(ADMIN_ID, "contractor_suspend");
      expect(status.global.remaining).toBe(98); // 2 mutations used (1 per checkMutationRateLimit call)
      expect(status.operation!.remaining).toBe(3); // 2 of 5 used (contractor_suspend)
    });
  });
});