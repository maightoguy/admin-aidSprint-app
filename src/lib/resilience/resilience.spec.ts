import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isTransientError,
  calculateBackoffDelay,
  withRetry,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
  shouldRetry,
  type RetryMetrics,
} from "./retry";
import {
  CircuitBreaker,
  createCircuitBreaker,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  type CircuitBreakerMetrics,
} from "./circuit-breaker";

describe("Resilience - Retry Logic", () => {
  describe("Error Classification", () => {
    it("should classify network errors as transient", () => {
      expect(isTransientError(new Error("ERR_NETWORK"))).toBe(true);
      expect(isTransientError(new Error("ECONNREFUSED"))).toBe(true);
      expect(isTransientError(new Error("ECONNRESET"))).toBe(true);
      expect(isTransientError(new Error("ETIMEDOUT"))).toBe(true);
    });

    it("should classify database timeout as transient", () => {
      expect(isTransientError(new Error("query timeout"))).toBe(true);
      expect(isTransientError(new Error("temporarily unavailable"))).toBe(true);
      expect(isTransientError(new Error("too many connections"))).toBe(true);
    });

    it("should classify permission errors as permanent", () => {
      expect(isTransientError(new Error("permission denied"))).toBe(false);
      expect(isTransientError(new Error("unauthorized"))).toBe(false);
      expect(isTransientError(new Error("forbidden"))).toBe(false);
    });

    it("should classify validation errors as permanent", () => {
      expect(isTransientError(new Error("validation failed"))).toBe(false);
      expect(isTransientError(new Error("invalid request"))).toBe(false);
      expect(isTransientError(new Error("constraint violation"))).toBe(false);
    });

    it("should classify constraint errors as permanent", () => {
      expect(isTransientError(new Error("unique constraint violation"))).toBe(false);
      expect(isTransientError(new Error("foreign key constraint"))).toBe(false);
      expect(isTransientError(new Error("check constraint"))).toBe(false);
    });

    it("should classify RLS policy errors as permanent", () => {
      expect(isTransientError(new Error("RLS policy violation"))).toBe(false);
      expect(isTransientError(new Error("policy denied"))).toBe(false);
    });

    it("should classify HTTP 5xx errors as transient", () => {
      const serverError = new Error("Server error");
      (serverError as any).status = 502;
      expect(isTransientError(serverError)).toBe(true);

      const gatewayError = new Error("Bad gateway");
      (gatewayError as any).statusCode = 503;
      expect(isTransientError(gatewayError)).toBe(true);
    });

    it("should classify HTTP 429 (rate limit) as transient", () => {
      const rateLimitError = new Error("Too many requests");
      (rateLimitError as any).status = 429;
      expect(isTransientError(rateLimitError)).toBe(true);
    });

    it("should classify HTTP 408 (timeout) as transient", () => {
      const timeoutError = new Error("Request timeout");
      (timeoutError as any).status = 408;
      expect(isTransientError(timeoutError)).toBe(true);
    });

    it("should classify HTTP 4xx errors as permanent", () => {
      const badRequest = new Error("Bad request");
      (badRequest as any).status = 400;
      expect(isTransientError(badRequest)).toBe(false);

      const notFound = new Error("Not found");
      (notFound as any).status = 404;
      expect(isTransientError(notFound)).toBe(false);
    });

    it("should handle string errors", () => {
      expect(isTransientError("network error")).toBe(true);
      expect(isTransientError("permission denied")).toBe(false);
    });

    it("should handle null/undefined errors", () => {
      expect(isTransientError(null)).toBe(false);
      expect(isTransientError(undefined)).toBe(false);
    });
  });

  describe("Backoff Calculation", () => {
    it("should calculate exponential backoff delays", () => {
      const config = DEFAULT_RETRY_CONFIG;

      const delay0 = calculateBackoffDelay(0, config);
      const delay1 = calculateBackoffDelay(1, config);
      const delay2 = calculateBackoffDelay(2, config);

      // Each delay should be roughly 2x the previous (with jitter)
      expect(delay1).toBeGreaterThan(delay0);
      expect(delay2).toBeGreaterThan(delay1);
    });

    it("should respect max delay cap", () => {
      const config: RetryConfig = {
        maxAttempts: 5,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        jitterFactor: 0,
      };

      // Exponential growth would exceed 1000ms at high attempts
      const delay5 = calculateBackoffDelay(5, config);
      expect(delay5).toBeLessThanOrEqual(config.maxDelayMs);

      const delay10 = calculateBackoffDelay(10, config);
      expect(delay10).toBeLessThanOrEqual(config.maxDelayMs);
    });

    it("should apply jitter consistently", () => {
      const config = DEFAULT_RETRY_CONFIG;

      const delays = Array.from({ length: 10 }, () =>
        calculateBackoffDelay(1, config)
      );

      // All delays should be different due to jitter
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);

      // All should be within reasonable range
      delays.forEach((delay) => {
        expect(delay).toBeGreaterThan(0);
        expect(delay).toBeLessThanOrEqual(config.maxDelayMs);
      });
    });

    it("should calculate zero delay for first attempt", () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        jitterFactor: 0,
      };

      const delay = calculateBackoffDelay(0, config);
      expect(delay).toBeLessThanOrEqual(config.initialDelayMs);
    });
  });

  describe("Retry Execution", () => {
    it("should succeed on first attempt", async () => {
      const fn = vi.fn().mockResolvedValue("success");

      const result = await withRetry(fn, DEFAULT_RETRY_CONFIG);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledOnce();
    });

    it("should retry on transient error and eventually succeed", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("ETIMEDOUT"))
        .mockRejectedValueOnce(new Error("ECONNRESET"))
        .mockResolvedValueOnce("success");

      const result = await withRetry(fn, DEFAULT_RETRY_CONFIG);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should fail fast on permanent error", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("permission denied"));

      await expect(
        withRetry(fn, DEFAULT_RETRY_CONFIG)
      ).rejects.toThrow("permission denied");

      expect(fn).toHaveBeenCalledOnce();
    });

    it("should fail after max attempts exhausted", async () => {
      const fn = vi
        .fn()
        .mockRejectedValue(new Error("ETIMEDOUT"));

      const config: RetryConfig = {
        maxAttempts: 2,
        initialDelayMs: 10,
        maxDelayMs: 50,
        jitterFactor: 0,
      };

      await expect(
        withRetry(fn, config)
      ).rejects.toThrow("ETIMEDOUT");

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should track metrics on success", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("ETIMEDOUT"))
        .mockResolvedValueOnce("success");

      const metrics: RetryMetrics[] = [];

      await withRetry(fn, DEFAULT_RETRY_CONFIG, (m) => metrics.push(m));

      expect(metrics).toHaveLength(1);
      expect(metrics[0].succeeded).toBe(true);
      expect(metrics[0].attempt).toBe(2);
      expect(metrics[0].totalDelayMs).toBeGreaterThan(0);
    });

    it("should track metrics on failure", async () => {
      const fn = vi
        .fn()
        .mockRejectedValue(new Error("ETIMEDOUT"));

      const config: RetryConfig = {
        maxAttempts: 2,
        initialDelayMs: 10,
        maxDelayMs: 50,
        jitterFactor: 0,
      };

      const metrics: RetryMetrics[] = [];

      try {
        await withRetry(fn, config, (m) => metrics.push(m));
      } catch {
        // Expected
      }

      expect(metrics).toHaveLength(1);
      expect(metrics[0].succeeded).toBe(false);
      expect(metrics[0].attempt).toBe(2);
      expect(metrics[0].lastError).toBeTruthy();
    });

    it("should handle custom retry config", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("ETIMEDOUT"))
        .mockResolvedValueOnce("success");

      const config: RetryConfig = {
        maxAttempts: 5,
        initialDelayMs: 50,
        maxDelayMs: 500,
        jitterFactor: 0.2,
      };

      const result = await withRetry(fn, config);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("shouldRetry utility", () => {
    it("should return true for transient errors", () => {
      expect(shouldRetry(new Error("ETIMEDOUT"))).toBe(true);
      expect(shouldRetry(new Error("network error"))).toBe(true);
    });

    it("should return false for permanent errors", () => {
      expect(shouldRetry(new Error("permission denied"))).toBe(false);
      expect(shouldRetry(new Error("validation failed"))).toBe(false);
    });
  });
});

describe("Resilience - Circuit Breaker", () => {
  describe("Circuit Breaker State Machine", () => {
    it("should start in closed state", () => {
      const cb = createCircuitBreaker("test");
      expect(cb.getState()).toBe("closed");
      expect(cb.isHealthy()).toBe(true);
    });

    it("should transition to open after failure threshold", async () => {
      const cb = new CircuitBreaker("test", {
        failureThreshold: 3,
        resetTimeoutMs: 1000,
        successThresholdInHalfOpen: 2,
      });

      // Simulate 3 failures
      for (let i = 0; i < 3; i++) {
        try {
          await cb.execute(async () => {
            throw new Error("Service error");
          });
        } catch {
          // Expected
        }
      }

      expect(cb.getState()).toBe("open");
      expect(cb.isHealthy()).toBe(false);
    });

    it("should reject requests when open", async () => {
      const cb = new CircuitBreaker("test", {
        failureThreshold: 1,
        resetTimeoutMs: 5000,
        successThresholdInHalfOpen: 2,
      });

      // Force circuit to open
      try {
        await cb.execute(async () => {
          throw new Error("Service error");
        });
      } catch {
        // Expected
      }

      expect(cb.getState()).toBe("open");

      // Subsequent request should be rejected immediately
      await expect(cb.execute(async () => "success")).rejects.toThrow(
        /Circuit is OPEN/
      );
    });

    it("should transition to half-open after reset timeout", async () => {
      vi.useFakeTimers();

      const cb = new CircuitBreaker("test", {
        failureThreshold: 1,
        resetTimeoutMs: 1000,
        successThresholdInHalfOpen: 2,
      });

      // Force circuit to open
      try {
        await cb.execute(async () => {
          throw new Error("Service error");
        });
      } catch {
        // Expected
      }

      expect(cb.getState()).toBe("open");

      // Advance time past reset timeout
      vi.advanceTimersByTime(1100);

      // Next request should transition to half-open
      await cb.execute(async () => "success");

      expect(cb.getState()).toBe("half-open");

      vi.useRealTimers();
    });

    it("should close circuit after success threshold in half-open", async () => {
      vi.useFakeTimers();

      const cb = new CircuitBreaker("test", {
        failureThreshold: 1,
        resetTimeoutMs: 100,
        successThresholdInHalfOpen: 2,
      });

      // Force to open
      try {
        await cb.execute(async () => {
          throw new Error("error");
        });
      } catch {
        // Expected
      }

      // Advance to half-open
      vi.advanceTimersByTime(150);

      // First success in half-open
      await cb.execute(async () => "success");
      expect(cb.getState()).toBe("half-open");

      // Second success closes circuit
      await cb.execute(async () => "success");
      expect(cb.getState()).toBe("closed");

      vi.useRealTimers();
    });

    it("should reopen if failure occurs in half-open", async () => {
      vi.useFakeTimers();

      const cb = new CircuitBreaker("test", {
        failureThreshold: 1,
        resetTimeoutMs: 100,
        successThresholdInHalfOpen: 2,
      });

      // Force to open
      try {
        await cb.execute(async () => {
          throw new Error("error");
        });
      } catch {
        // Expected
      }

      expect(cb.getState()).toBe("open");

      // Advance to half-open
      vi.advanceTimersByTime(150);

      // Execute triggers the transition to half-open
      try {
        await cb.execute(async () => {
          throw new Error("error");
        });
      } catch {
        // Expected
      }

      // After the failed execute in half-open, should be open again
      expect(cb.getState()).toBe("open");

      vi.useRealTimers();
    });
  });

  describe("Circuit Breaker Metrics", () => {
    it("should track success metrics", async () => {
      const cb = createCircuitBreaker("test");

      await cb.execute(async () => "success");
      await cb.execute(async () => "success");

      const metrics = cb.getMetrics();
      expect(metrics.state).toBe("closed");
      expect(metrics.totalSuccesses).toBe(2);
      expect(metrics.totalFailures).toBe(0);
      expect(metrics.lastSuccessAt).toBeTruthy();
    });

    it("should track failure metrics", async () => {
      const cb = new CircuitBreaker("test", {
        failureThreshold: 10,
        resetTimeoutMs: 1000,
        successThresholdInHalfOpen: 2,
      });

      try {
        await cb.execute(async () => {
          throw new Error("error");
        });
      } catch {
        // Expected
      }

      const metrics = cb.getMetrics();
      expect(metrics.totalFailures).toBe(1);
      expect(metrics.lastFailureAt).toBeTruthy();
    });

    it("should maintain cumulative totals", async () => {
      const cb = new CircuitBreaker("test", {
        failureThreshold: 1,
        resetTimeoutMs: 100,
        successThresholdInHalfOpen: 2,
      });

      // Simulate multiple cycles
      for (let i = 0; i < 3; i++) {
        try {
          await cb.execute(async () => {
            throw new Error("error");
          });
        } catch {
          // Expected
        }
      }

      const metrics = cb.getMetrics();
      expect(metrics.totalFailures).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Circuit Breaker Reset", () => {
    it("should manually reset to closed state", async () => {
      const cb = new CircuitBreaker("test", {
        failureThreshold: 1,
        resetTimeoutMs: 1000,
        successThresholdInHalfOpen: 2,
      });

      // Force to open
      try {
        await cb.execute(async () => {
          throw new Error("error");
        });
      } catch {
        // Expected
      }

      expect(cb.getState()).toBe("open");

      // Manual reset
      cb.reset();
      expect(cb.getState()).toBe("closed");
    });
  });

  describe("Circuit Breaker Health Check", () => {
    it("should report healthy when closed", () => {
      const cb = createCircuitBreaker("test");
      expect(cb.isHealthy()).toBe(true);
    });

    it("should report unhealthy when open", async () => {
      const cb = new CircuitBreaker("test", {
        failureThreshold: 1,
        resetTimeoutMs: 1000,
        successThresholdInHalfOpen: 2,
      });

      try {
        await cb.execute(async () => {
          throw new Error("error");
        });
      } catch {
        // Expected
      }

      expect(cb.isHealthy()).toBe(false);
    });
  });

  describe("Multiple Circuit Breakers", () => {
    it("should maintain independent state per resource", async () => {
      const cbUsers = new CircuitBreaker("users", {
        failureThreshold: 1,
        resetTimeoutMs: 1000,
        successThresholdInHalfOpen: 2,
      });

      const cbJobs = new CircuitBreaker("jobs", {
        failureThreshold: 1,
        resetTimeoutMs: 1000,
        successThresholdInHalfOpen: 2,
      });

      // Open users circuit
      try {
        await cbUsers.execute(async () => {
          throw new Error("users service down");
        });
      } catch {
        // Expected
      }

      expect(cbUsers.getState()).toBe("open");
      expect(cbJobs.getState()).toBe("closed"); // Jobs still healthy
    });
  });
});
