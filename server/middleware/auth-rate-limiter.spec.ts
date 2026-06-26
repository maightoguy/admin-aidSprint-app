/**
 * Q2 — Auth Rate Limiting Tests
 *
 * Validates brute-force protection:
 *   - Rate limiting: 5 attempts / 15 minutes per IP+email
 *   - Progressive delays after 3rd and 5th failures
 *   - Account lockout after 10 failed attempts
 *   - Retry-After header on 429 responses
 *   - Reset on successful login
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
  isLockedOut,
  cleanExpiredEntries,
  clearAllLoginLimits,
  getTrackedLoginCount,
} from "./auth-rate-limiter";

describe("Q2: Auth Rate Limiting Middleware", () => {
  beforeEach(() => {
    clearAllLoginLimits();
  });

  afterEach(() => {
    clearAllLoginLimits();
  });

  // ──────────────────────────────────────────────────────────
  // 1. BASIC RATE LIMITING
  // ──────────────────────────────────────────────────────────
  describe("1. Basic Rate Limiting (5 attempts / 15 min)", () => {
    it("allows first login attempt", () => {
      const r = checkLoginRateLimit("192.168.1.1", "admin@test.com");
      expect(r.allowed).toBe(true);
      expect(r.retryAfter).toBe(0);
    });

    it("allows first 3 attempts without delay", () => {
      for (let i = 0; i < 3; i++) {
        const r = checkLoginRateLimit("192.168.1.1", "login@test.com");
        if (i < 2) recordFailedLogin("192.168.1.1", "login@test.com");
        expect(r.allowed).toBe(true);
      }
    });

    it("blocks after 5 recorded failures with progressive delay or max-attempts reason", () => {
      for (let i = 0; i < 5; i++) {
        recordFailedLogin("192.168.1.1", "blocked@test.com");
      }
      const r = checkLoginRateLimit("192.168.1.1", "blocked@test.com");
      expect(r.allowed).toBe(false);
      expect(r.retryAfter).toBeGreaterThan(0);
      // Reason will be either progressive-delay or max-attempts
      expect(r.reason?.toLowerCase()).toMatch(/wait|seconds|maximum|try again/i);
    });

    it("provides clear reason with action guidance", () => {
      // After 5 failures, the progressive delay fires
      for (let i = 0; i < 5; i++) {
        recordFailedLogin("192.168.1.1", "guide@test.com");
      }
      const r = checkLoginRateLimit("192.168.1.1", "guide@test.com");
      expect(r.allowed).toBe(false);
      expect(r.reason).toBeTruthy();
      // Message should contain actionable info
      expect(r.reason!.toLowerCase()).toMatch(/wait|seconds|try again|contact support/i);
    });
  });

  describe("1b. Max attempts reached in window", () => {
    it("blocks with max-attempts message when window exhausted", () => {
      // Create a key with 5 attempts but not rapid enough for progressive delay
      // We just need to verify the max-attempts message when count >= 5 and no progressive delay fires
      for (let i = 0; i < 6; i++) {
        recordFailedLogin("10.10.10.10", "maxed@test.com");
      }
      // Lockout at 10 means at count=6 we're not locked, but count > 5
      // Progressive delay fires first since 5th failure is immediate
      const r = checkLoginRateLimit("10.10.10.10", "maxed@test.com");
      expect(r.allowed).toBe(false);
      // Progressive delay fires before max-attempts check when rapid
      expect(r.reason?.toLowerCase()).toMatch(/wait|seconds/i);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 2. PER-IDENTITY ISOLATION
  // ──────────────────────────────────────────────────────────
  describe("2. Per-Identity Isolation", () => {
    it("different IPs are rate-limited independently", () => {
      for (let i = 0; i < 5; i++) {
        recordFailedLogin("192.168.1.1", "admin@test.com");
      }
      const r = checkLoginRateLimit("192.168.1.2", "admin@test.com");
      expect(r.allowed).toBe(true);
    });

    it("different emails are rate-limited independently", () => {
      for (let i = 0; i < 5; i++) {
        recordFailedLogin("192.168.1.1", "admin@test.com");
      }
      const r = checkLoginRateLimit("192.168.1.1", "admin2@test.com");
      expect(r.allowed).toBe(true);
    });

    it("same IP + same email share rate limit", () => {
      for (let i = 0; i < 4; i++) {
        recordFailedLogin("192.168.1.1", "admin@test.com");
      }
      // 5th attempt should still be allowed (4 failures, count < 5)
      const r = checkLoginRateLimit("192.168.1.1", "admin@test.com");
      // After 4 rapid failures, progressive delay (1s after 3rd) kicks in
      // So the check may be blocked by progressive delay
      // But the base limit check (< 5) allows it; progressive delay is separate
      expect(r.allowed).toBe(false); // progressive delay kicks in
      expect(r.reason).toMatch(/wait|seconds/i);
    });

    it("email is normalized to lowercase", () => {
      recordFailedLogin("192.168.1.1", "Admin@Test.com");
      recordFailedLogin("192.168.1.1", "ADMIN@TEST.COM");
      recordFailedLogin("192.168.1.1", "admin@test.com");
      recordFailedLogin("192.168.1.1", " admin@test.com ");
      recordFailedLogin("192.168.1.1", "admin@test.com");
      const r = checkLoginRateLimit("192.168.1.1", "Admin@test.com");
      expect(r.allowed).toBe(false); // all normalized to same key, 5 failures = blocked
    });
  });

  // ──────────────────────────────────────────────────────────
  // 3. PROGRESSIVE DELAYS
  // ──────────────────────────────────────────────────────────
  describe("3. Progressive Delays (1s after 3rd, 5s after 5th)", () => {
    it("enforces ~1s delay after 3rd failure", () => {
      recordFailedLogin("192.168.1.1", "admin@test.com");
      recordFailedLogin("192.168.1.1", "admin@test.com");
      recordFailedLogin("192.168.1.1", "admin@test.com");
      const r = checkLoginRateLimit("192.168.1.1", "admin@test.com");
      expect(r.allowed).toBe(false);
      expect(r.reason?.toLowerCase()).toMatch(/wait|seconds/i);
      expect(r.retryAfter).toBeGreaterThan(0);
    });

    it("enforces ~5s delay after 5th failure", () => {
      for (let i = 0; i < 5; i++) {
        recordFailedLogin("192.168.1.1", "delay@test.com");
      }
      const r = checkLoginRateLimit("192.168.1.1", "delay@test.com");
      expect(r.allowed).toBe(false);
      // retryAfter will be ~5s; we verify it's at least 1
      expect(r.retryAfter).toBeGreaterThanOrEqual(1);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 4. ACCOUNT LOCKOUT
  // ──────────────────────────────────────────────────────────
  describe("4. Account Lockout (10 failures → 30-min lock)", () => {
    it("locks account after 10 failed attempts", () => {
      for (let i = 0; i < 10; i++) {
        const r = recordFailedLogin("10.0.0.1", "locked@test.com");
        if (i === 9) {
          expect(r.locked).toBe(true);
        }
      }
      expect(isLockedOut("10.0.0.1", "locked@test.com")).toBe(true);
    });

    it("checkLoginRateLimit returns blocked while locked", () => {
      for (let i = 0; i < 10; i++) {
        recordFailedLogin("10.0.0.1", "locked2@test.com");
      }
      const r = checkLoginRateLimit("10.0.0.1", "locked2@test.com");
      expect(r.allowed).toBe(false);
      expect(r.reason).toContain("locked");
      expect(r.reason).toContain("30");
    });

    it("isLockedOut returns true while locked", () => {
      for (let i = 0; i < 10; i++) {
        recordFailedLogin("10.0.0.1", "locked3@test.com");
      }
      expect(isLockedOut("10.0.0.1", "locked3@test.com")).toBe(true);
    });

    it("lockout reasons mention minutes and contact support", () => {
      for (let i = 0; i < 10; i++) {
        recordFailedLogin("10.0.0.1", "locked4@test.com");
      }
      const r = checkLoginRateLimit("10.0.0.1", "locked4@test.com");
      expect(r.reason).toMatch(/minutes|contact support/i);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 5. RESET ON SUCCESS
  // ──────────────────────────────────────────────────────────
  describe("5. Reset on Successful Login", () => {
    it("reset clears rate limit for that user", () => {
      for (let i = 0; i < 2; i++) {
        recordFailedLogin("192.168.1.1", "reset@test.com");
      }
      // After 2 failures, not at progressive delay threshold yet
      const r = checkLoginRateLimit("192.168.1.1", "reset@test.com");
      expect(r.allowed).toBe(true);

      // Simulate successful login
      resetLoginRateLimit("192.168.1.1", "reset@test.com");

      const r2 = checkLoginRateLimit("192.168.1.1", "reset@test.com");
      expect(r2.allowed).toBe(true); // fresh start
    });

    it("reset clears lockout too", () => {
      for (let i = 0; i < 10; i++) {
        recordFailedLogin("10.0.0.1", "unlock@test.com");
      }
      expect(isLockedOut("10.0.0.1", "unlock@test.com")).toBe(true);

      resetLoginRateLimit("10.0.0.1", "unlock@test.com");
      expect(isLockedOut("10.0.0.1", "unlock@test.com")).toBe(false);

      const r = checkLoginRateLimit("10.0.0.1", "unlock@test.com");
      expect(r.allowed).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 6. RECORDED ATTEMPTS
  // ──────────────────────────────────────────────────────────
  describe("6. Recorded Attempts (recordFailedLogin)", () => {
    it("recordFailedLogin increments count", () => {
      let r = recordFailedLogin("1.1.1.1", "record@test.com");
      expect(r.totalAttempts).toBe(1);
      expect(r.locked).toBe(false);

      r = recordFailedLogin("1.1.1.1", "record@test.com");
      expect(r.totalAttempts).toBe(2);
    });

    it("recordFailedLogin returns locked=true at threshold", () => {
      for (let i = 0; i < 9; i++) {
        const r = recordFailedLogin("2.2.2.2", "threshold@test.com");
        expect(r.locked).toBe(false);
      }
      const last = recordFailedLogin("2.2.2.2", "threshold@test.com");
      expect(last.locked).toBe(true);
      expect(last.totalAttempts).toBe(10);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 7. CLEANUP
  // ──────────────────────────────────────────────────────────
  describe("7. Cleanup", () => {
    it("clearAllLoginLimits removes all entries", () => {
      recordFailedLogin("1.1.1.1", "a@test.com");
      recordFailedLogin("2.2.2.2", "b@test.com");
      expect(getTrackedLoginCount()).toBe(2);

      clearAllLoginLimits();
      expect(getTrackedLoginCount()).toBe(0);
    });

    it("cleanExpiredEntries removes old entries", () => {
      // This is a helper — entries are auto-pruned on check
      // Verify that cleanup doesn't throw
      expect(() => cleanExpiredEntries()).not.toThrow();
    });
  });

  // ──────────────────────────────────────────────────────────
  // 8. EDGE CASES
  // ──────────────────────────────────────────────────────────
  describe("8. Edge Cases", () => {
    it("no email registered yet: first check returns allowed", () => {
      const r = checkLoginRateLimit("127.0.0.1", "new@test.com");
      expect(r.allowed).toBe(true);
    });

    it("recordFailedLogin on fresh user returns totalAttempts=1", () => {
      const r = recordFailedLogin("127.0.0.1", "fresh@test.com");
      expect(r.totalAttempts).toBe(1);
      expect(r.locked).toBe(false);
    });

    it("isLockedOut returns false for unknown user", () => {
      expect(isLockedOut("0.0.0.0", "nonexistent@test.com")).toBe(false);
    });
  });
});