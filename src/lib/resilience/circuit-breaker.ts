/**
 * Circuit breaker pattern for preventing cascading failures.
 * Prevents repeated calls to a failing service by tracking failure rates.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service failing, requests are rejected immediately
 * - HALF_OPEN: Testing if service recovered, allowing limited requests
 */

export type CircuitBreakerState = "closed" | "open" | "half-open";

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeoutMs: number; // Time in ms before attempting half-open state
  successThresholdInHalfOpen: number; // Successes needed in half-open to close circuit
  monitoringWindowMs?: number; // Time window for failure tracking (optional)
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5, // Open after 5 failures
  resetTimeoutMs: 30000, // Try recovery after 30 seconds
  successThresholdInHalfOpen: 2, // 2 successes closes circuit
  monitoringWindowMs: 60000, // Track failures in 60s window
};

export interface CircuitBreakerMetrics {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = "closed";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureAt: number | null = null;
  private lastSuccessAt: number | null = null;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private nextAttemptAt: number | null = null;
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG) {
    this.name = name;
    this.config = config;
  }

  /**
   * Check if request should be allowed through
   * Throws if circuit is open
   */
  checkAllowance(): void {
    if (this.state === "closed") {
      return; // Allow request
    }

    if (this.state === "open") {
      // Check if we should try half-open
      const now = Date.now();
      if (this.nextAttemptAt && now >= this.nextAttemptAt) {
        this.transition("half-open");
        return; // Allow this probe request
      }

      throw new Error(
        `[CircuitBreaker ${this.name}] Circuit is OPEN. Service unavailable. Retry after ${
          this.nextAttemptAt ? Math.ceil((this.nextAttemptAt - now) / 1000) : "unknown"
        }s`
      );
    }

    if (this.state === "half-open") {
      return; // Allow request to probe service health
    }
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    this.lastSuccessAt = Date.now();
    this.totalSuccesses++;

    if (this.state === "half-open") {
      this.successCount++;

      // Check if we should close circuit
      if (this.successCount >= this.config.successThresholdInHalfOpen) {
        this.transition("closed");
      }
    } else if (this.state === "closed") {
      // Reset failure count on success
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(): void {
    this.lastFailureAt = Date.now();
    this.totalFailures++;
    this.failureCount++;

    if (this.state === "half-open") {
      // Failure in half-open goes back to open
      this.transition("open");
    } else if (this.state === "closed" && this.failureCount >= this.config.failureThreshold) {
      // Too many failures - open circuit
      this.transition("open");
    }
  }

  /**
   * Transition to a new state and log the change
   */
  private transition(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;

    if (newState === "open") {
      this.failureCount = 0;
      this.successCount = 0;
      this.nextAttemptAt = Date.now() + this.config.resetTimeoutMs;

      console.error(
        `[CircuitBreaker ${this.name}] OPENED after ${this.totalFailures} total failures. Will attempt recovery at ${new Date(this.nextAttemptAt).toISOString()}`
      );
    } else if (newState === "half-open") {
      this.failureCount = 0;
      this.successCount = 0;

      console.warn(`[CircuitBreaker ${this.name}] HALF-OPEN: Testing if service recovered...`);
    } else if (newState === "closed") {
      this.failureCount = 0;
      this.successCount = 0;

      console.info(`[CircuitBreaker ${this.name}] CLOSED: Service recovered, resuming normal operation.`);
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if allowed
    this.checkAllowance();

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureAt: this.lastFailureAt,
      lastSuccessAt: this.lastSuccessAt,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Manually reset circuit to closed state
   */
  reset(): void {
    this.transition("closed");
    console.info(`[CircuitBreaker ${this.name}] Manually reset to CLOSED state.`);
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Check if circuit is healthy (closed or successfully recovering)
   */
  isHealthy(): boolean {
    return this.state === "closed" || (this.state === "half-open" && this.successCount > 0);
  }
}

/**
 * Create a circuit breaker for a specific resource/service
 */
export function createCircuitBreaker(
  name: string,
  config?: CircuitBreakerConfig
): CircuitBreaker {
  return new CircuitBreaker(name, config);
}
