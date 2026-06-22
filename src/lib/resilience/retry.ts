/**
 * Exponential backoff retry logic with jitter for transient failure recovery.
 * Ensures automatic retries of network/timeout failures while failing fast on permanent errors.
 */

/**
 * Error types that should trigger retries (transient failures)
 */
const TRANSIENT_ERROR_PATTERNS = [
  "ERR_NETWORK", // Network errors
  "ECONNREFUSED", // Connection refused
  "ECONNRESET", // Connection reset
  "ETIMEDOUT", // Timeout
  "EHOSTUNREACH", // Host unreachable
  "ENETUNREACH", // Network unreachable
  "timeout", // Generic timeout
  "temporarily unavailable", // Database temporarily unavailable
  "too many connections", // Connection pool exhausted
  "query timeout", // Query timeout
];

/**
 * Error patterns that should NOT be retried (permanent failures)
 */
const PERMANENT_ERROR_PATTERNS = [
  "permission denied",
  "unauthorized",
  "forbidden",
  "invalid request",
  "validation failed",
  "syntax error",
  "constraint violation",
  "unique constraint",
  "foreign key constraint",
  "check constraint",
  "not found",
  "already exists",
  "invalid input",
  "role",
  "policy",
  "RLS",
];

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number; // 0-1: 0.1 = 10% jitter
}

/**
 * Default retry configuration for transient failures
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 300,
  maxDelayMs: 10000,
  jitterFactor: 0.1,
};

/**
 * Classify whether an error is transient (retryable) or permanent (fail-fast)
 */
export function isTransientError(error: unknown): boolean {
  if (!error) return false;

  const errorStr = getErrorMessage(error).toLowerCase();

  // Check if it matches permanent error patterns (these should NOT retry)
  for (const pattern of PERMANENT_ERROR_PATTERNS) {
    if (errorStr.includes(pattern)) {
      return false; // Permanent error - do not retry
    }
  }

  // Check if it matches transient error patterns (these SHOULD retry)
  for (const pattern of TRANSIENT_ERROR_PATTERNS) {
    if (errorStr.includes(pattern.toLowerCase())) {
      return true; // Transient error - retry
    }
  }

  // If error has a status code, classify by HTTP status
  const statusCode = extractStatusCode(error);
  if (statusCode) {
    // 5xx errors are transient (server errors)
    if (statusCode >= 500) return true;
    // 429 is rate limiting (transient)
    if (statusCode === 429) return true;
    // 408 is request timeout (transient)
    if (statusCode === 408) return true;
    // 4xx errors are permanent (client errors)
    if (statusCode >= 400) return false;
  }

  // Default: treat as transient for network-level errors
  return true;
}

/**
 * Extract error message from various error types
 */
function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    if ("message" in error) return String((error as any).message);
    if ("error" in error) return String((error as any).error);
    if ("hint" in error) return String((error as any).hint);
  }
  return String(error);
}

/**
 * Extract HTTP status code from error if available
 */
function extractStatusCode(error: unknown): number | null {
  if (typeof error === "object" && error !== null) {
    if ("status" in error) return Number((error as any).status) || null;
    if ("statusCode" in error) return Number((error as any).statusCode) || null;
    if ("status_code" in error) return Number((error as any).status_code) || null;
  }
  return null;
}

/**
 * Calculate delay for exponential backoff with jitter
 * Formula: min(maxDelay, initialDelay * 2^attempt * (1 + jitter))
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  // Exponential: 2^attempt
  const exponentialDelay = config.initialDelayMs * Math.pow(2, attempt);

  // Add jitter (random 0-100% of jitterFactor)
  const jitter = exponentialDelay * config.jitterFactor * Math.random();
  const delayWithJitter = exponentialDelay + jitter;

  // Cap at maxDelayMs
  return Math.min(delayWithJitter, config.maxDelayMs);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry metrics for observability
 */
export interface RetryMetrics {
  attempt: number;
  maxAttempts: number;
  lastError: Error | null;
  totalDelayMs: number;
  succeeded: boolean;
}

/**
 * Execute a function with automatic retry on transient failures
 * Transparent to caller: same return type as wrapped function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onMetrics?: (metrics: RetryMetrics) => void
): Promise<T> {
  let lastError: Error | null = null;
  let totalDelayMs = 0;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      const result = await fn();

      // Success
      if (onMetrics) {
        onMetrics({
          attempt: attempt + 1,
          maxAttempts: config.maxAttempts,
          lastError: null,
          totalDelayMs,
          succeeded: true,
        });
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is transient
      if (!isTransientError(error)) {
        // Permanent error - fail fast
        if (onMetrics) {
          onMetrics({
            attempt: attempt + 1,
            maxAttempts: config.maxAttempts,
            lastError,
            totalDelayMs,
            succeeded: false,
          });
        }

        throw error;
      }

      // If this is the last attempt, give up
      if (attempt === config.maxAttempts - 1) {
        if (onMetrics) {
          onMetrics({
            attempt: attempt + 1,
            maxAttempts: config.maxAttempts,
            lastError,
            totalDelayMs,
            succeeded: false,
          });
        }

        throw error;
      }

      // Calculate backoff and retry
      const delayMs = calculateBackoffDelay(attempt, config);
      totalDelayMs += delayMs;

      console.warn(
        `[Retry] Transient error on attempt ${attempt + 1}/${config.maxAttempts}: ${getErrorMessage(error)}. Retrying in ${delayMs}ms...`
      );

      await sleep(delayMs);
    }
  }

  // Should not reach here, but ensure we throw if something goes wrong
  if (lastError) throw lastError;
  throw new Error("Retry failed without error");
}

/**
 * Synchronously check if an error is transient (for non-async scenarios)
 */
export function shouldRetry(error: unknown): boolean {
  return isTransientError(error);
}
