/**
 * Q1 — Rate Limiter Utility Tests
 *
 * Validates the sliding-window rate limiting implementation.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  checkRateLimit,
  getRateLimitStatus,
  resetRateLimit,
  clearAllRateLimits,
  getTrackedKeyCount,
  getProgressiveLockoutMs,
  RATE_LIMITS,
  RateLimitConfig,
} from "./rate-limiter";

describe("Q1: Rate Limiter Utility", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  // ──────────────────────────────────────────────────────────
  // 1. BASIC OPERATIONS
  // ──────────────────────────────────────────────────────────
  describe("1. Basic Operations", () => {
    it("allows first attempt", () => {
      const r = checkRateLimit("test:login", { maxAttempts: 3, windowMs: 60000 });
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(2);
    });

    it("allows attempts within limit", () => {
      for (let i = 0; i < 3; i++) {
        const r = checkRateLimit("test:login", { maxAttempts: 3, windowMs: 60000 });
        expect(r.allowed).toBe(true);
      }
    });

    it("blocks attempts beyond limit", () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit("test:login", { maxAttempts: 3, windowMs: 60000 });
      }
      const r = checkRateLimit("test:login", { maxAttempts: 3, windowMs: 60000 });
      expect(r.allowed).toBe(false);
      expect(r.remaining).toBe(0);
      expect(r.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("provides retry-after guidance when blocked", () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit("test:login", { maxAttempts: 3, windowMs: 60000 });
      }
      const r = checkRateLimit("test:login", { maxAttempts: 3, windowMs: 60000 });
      expect(r.allowed).toBe(false);
      expect(r.retryAfterSeconds).toBe(60); // 60000ms = 60s
    });
  });

  // ──────────────────────────────────────────────────────────
  // 2. SLIDING WINDOW
  // ──────────────────────────────────────────────────────────
  describe("2. Sliding Window Behavior", () => {
    it("tracks per-key independently", () => {
      const r1 = checkRateLimit("admin-1:login", { maxAttempts: 3, windowMs: 60000 });
      const r2 = checkRateLimit("admin-2:login", { maxAttempts: 3, windowMs: 60000 });
      expect(r1.allowed).toBe(true);
      expect(r2.allowed).toBe(true);
    });

    it("decrements remaining count correctly", () => {
      let r = checkRateLimit("k:1", { maxAttempts: 5, windowMs: 60000 });
      expect(r.remaining).toBe(4);
      r = checkRateLimit("k:1", { maxAttempts: 5, windowMs: 60000 });
      expect(r.remaining).toBe(3);
      r = checkRateLimit("k:1", { maxAttempts: 5, windowMs: 60000 });
      expect(r.remaining).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 3. STATUS CHECK (non-consuming)
  // ──────────────────────────────────────────────────────────
  describe("3. Status Check (non-consuming)", () => {
    it("returns default status when no bucket exists", () => {
      const s = getRateLimitStatus("nonexistent", { maxAttempts: 5, windowMs: 60000 });
      expect(s.allowed).toBe(true);
      expect(s.remaining).toBe(5);
      expect(s.blocked).toBe(false);
    });

    it("reflects consumed attempts", () => {
      checkRateLimit("k:status", { maxAttempts: 5, windowMs: 60000 });
      checkRateLimit("k:status", { maxAttempts: 5, windowMs: 60000 });
      const s = getRateLimitStatus("k:status", { maxAttempts: 5, windowMs: 60000 });
      expect(s.remaining).toBe(3);
      expect(s.allowed).toBe(true);
      expect(s.blocked).toBe(false);
    });

    it("reflects blocked state", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("k:blocked", { maxAttempts: 5, windowMs: 60000 });
      }
      // Trigger the block by making one more attempt
      checkRateLimit("k:blocked", { maxAttempts: 5, windowMs: 60000 });
      const s = getRateLimitStatus("k:blocked", { maxAttempts: 5, windowMs: 60000 });
      expect(s.blocked).toBe(true);
      expect(s.allowed).toBe(false);
      expect(s.remaining).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 4. RESET
  // ──────────────────────────────────────────────────────────
  describe("4. Reset", () => {
    it("allows attempts after reset", () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit("k:reset", { maxAttempts: 3, windowMs: 60000 });
      }
      let r = checkRateLimit("k:reset", { maxAttempts: 3, windowMs: 60000 });
      expect(r.allowed).toBe(false);

      resetRateLimit("k:reset");
      r = checkRateLimit("k:reset", { maxAttempts: 3, windowMs: 60000 });
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(2);
    });

    it("clearAll removes all tracked keys", () => {
      checkRateLimit("k:1", { maxAttempts: 3, windowMs: 60000 });
      checkRateLimit("k:2", { maxAttempts: 3, windowMs: 60000 });
      expect(getTrackedKeyCount()).toBe(2);

      clearAllRateLimits();
      expect(getTrackedKeyCount()).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 5. PRESET CONFIGURATIONS
  // ──────────────────────────────────────────────────────────
  describe("5. Preset Configurations (Q1 contract)", () => {
    it("AUTH_LOGIN: 5 attempts / 15 min", () => {
      const config = RATE_LIMITS.AUTH_LOGIN;
      expect(config.maxAttempts).toBe(5);
      expect(config.windowMs).toBe(15 * 60 * 1000);
    });

    it("MUTATIONS_GLOBAL: 100 per minute", () => {
      const config = RATE_LIMITS.MUTATIONS_GLOBAL;
      expect(config.maxAttempts).toBe(100);
      expect(config.windowMs).toBe(60 * 1000);
    });

    it("READS_GLOBAL: 1000 per minute", () => {
      const config = RATE_LIMITS.READS_GLOBAL;
      expect(config.maxAttempts).toBe(1000);
      expect(config.windowMs).toBe(60 * 1000);
    });

    it("CONTRACTOR_SUSPEND: 5 per minute", () => {
      expect(RATE_LIMITS.CONTRACTOR_SUSPEND.maxAttempts).toBe(5);
    });

    it("CONTRACTOR_RESTORE: 5 per minute", () => {
      expect(RATE_LIMITS.CONTRACTOR_RESTORE.maxAttempts).toBe(5);
    });

    it("KYC_APPROVE: 10 per minute", () => {
      expect(RATE_LIMITS.KYC_APPROVE.maxAttempts).toBe(10);
    });

    it("KYC_REJECT: 10 per minute", () => {
      expect(RATE_LIMITS.KYC_REJECT.maxAttempts).toBe(10);
    });

    it("DISPUTE_RESOLVE: 5 per minute", () => {
      expect(RATE_LIMITS.DISPUTE_RESOLVE.maxAttempts).toBe(5);
    });

    it("PAYOUT_ACTION: 10 per minute", () => {
      expect(RATE_LIMITS.PAYOUT_ACTION.maxAttempts).toBe(10);
    });

    it("REFUND_ACTION: 5 per minute", () => {
      expect(RATE_LIMITS.REFUND_ACTION.maxAttempts).toBe(5);
    });

    it("SAME_RESOURCE: 5 per minute", () => {
      expect(RATE_LIMITS.SAME_RESOURCE.maxAttempts).toBe(5);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 6. PROGRESSIVE LOCKOUT
  // ──────────────────────────────────────────────────────────
  describe("6. Progressive Lockout", () => {
    it("1st violation: 1x base window", () => {
      const ms = getProgressiveLockoutMs(1, 60000);
      expect(ms).toBe(60000);
    });

    it("2nd violation: 2x base window", () => {
      const ms = getProgressiveLockoutMs(2, 60000);
      expect(ms).toBe(120000);
    });

    it("3rd violation: 4x base window", () => {
      const ms = getProgressiveLockoutMs(3, 60000);
      expect(ms).toBe(240000);
    });

    it("capped at 8x base window", () => {
      const ms = getProgressiveLockoutMs(10, 60000);
      expect(ms).toBe(480000); // 8 * 60000
    });
  });

  // ──────────────────────────────────────────────────────────
  // 7. EDGE CASES
  // ──────────────────────────────────────────────────────────
  describe("7. Edge Cases", () => {
    it("maxAttempts of 0 blocks everything", () => {
      const r = checkRateLimit("k:zero", { maxAttempts: 0, windowMs: 60000 });
      expect(r.allowed).toBe(false);
    });

    it("maxAttempts of 1 allows only one", () => {
      let r = checkRateLimit("k:one", { maxAttempts: 1, windowMs: 60000 });
      expect(r.allowed).toBe(true);
      r = checkRateLimit("k:one", { maxAttempts: 1, windowMs: 60000 });
      expect(r.allowed).toBe(false);
    });
  });
});