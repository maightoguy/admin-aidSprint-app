/**
 * EventService — Pure event dispatcher. No hard-coded side-effects.
 *
 * Handlers register themselves via `registerEventHandler()`.
 * Adding a new channel (Slack, webhooks, analytics) is one
 * registration call — EventService never changes.
 *
 * ## Handler Pipeline Rationale
 *
 * Handlers execute in **parallel via Promise.allSettled**. This is intentional:
 *
 *   - **No handler depends on another.** AuditHandler writes to admin_action_log,
 *     NotificationHandler writes to notifications, EmailHandler/PushHandler
 *     are stubs. None need the output of another.
 *   - **Latency matters.** Sequential execution would make every event take
 *     sum(handler_times). Parallel execution takes max(handler_times).
 *   - **Fault isolation.** One handler crashing does not block others.
 *     Promise.allSettled guarantees every handler runs regardless.
 *   - **Audit authority.** The audit trail is THE authoritative record via
 *     the admin_action_log table, not via execution order. Order is irrelevant
 *     when data is immutable and timestamped.
 *
 * If a future handler genuinely depends on another handler's output (e.g.,
 * "send email only if notification was created"), that dependency should be
 * expressed INSIDE the handler — not by sequencing the pipeline globally.
 *
 * ## Return Value
 *
 * `emitEvent()` returns `Promise<EventResult[]>` — one result per registered
 * handler. Each result includes the handler name, success/failure, duration
 * in milliseconds, and any captured error.
 *
 * In development mode, a compact diagnostic summary is logged.
 *
 * Usage:
 *   import { emitEvent, BusinessEventType } from "@/lib/events";
 *   const results = await emitEvent({
 *     type: BusinessEventType.JOB_COMPLETED,
 *     actorId, subjectId,
 *     source: "admin-dashboard",
 *   });
 *   // results: [{ handler: "AuditHandler", success: true, durationMs: 11 }, ...]
 */
import type { BusinessEvent, EventHandler, EventResult } from "./eventTypes";
import { createLogger } from "@/lib/logger";

const logger = createLogger("EventService");

type RegisteredHandler = {
  name: string;
  fn: EventHandler;
};

const handlers: Set<RegisteredHandler> = new Set();

/**
 * Register a global event handler with a human-readable name.
 * Returns an unsubscribe function.
 */
export function registerEventHandler(
  name: string,
  handler: EventHandler,
): () => void {
  const entry: RegisteredHandler = { name, fn: handler };
  handlers.add(entry);
  return () => {
    handlers.delete(entry);
  };
}

/**
 * Emit a business event. Dispatches in parallel to ALL registered handlers.
 * Returns EventResult[] — one per handler — with timing and status.
 * Never throws — callers can safely fire-and-forget.
 *
 * In dev mode, logs a compact diagnostic summary.
 */
export async function emitEvent(event: BusinessEvent): Promise<EventResult[]> {
  const normalized: BusinessEvent = {
    schemaVersion: event.schemaVersion ?? 1,
    source: event.source ?? "admin-dashboard",
    priority: event.priority ?? "normal",
    ...event,
    occurredAt: event.occurredAt ?? new Date().toISOString(),
    correlationId: event.correlationId ?? crypto.randomUUID(),
  };

  const handlerEntries = Array.from(handlers);

  const results: EventResult[] = await Promise.all(
    handlerEntries.map(async ({ name, fn }): Promise<EventResult> => {
      const startedAt = performance.now();
      try {
        await fn(normalized);
        return {
          handler: name,
          success: true,
          durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        };
      } catch (err) {
        logger.error("Event handler failed", {
          handler: name,
          eventType: normalized.type,
          error: err,
        });
        return {
          handler: name,
          success: false,
          durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }),
  );

  // Development diagnostics — compact summary log
  if (import.meta.env.DEV) {
    const skipped = results.filter(
      (r) => r.durationMs < 0.5 && r.success,
    ).length;
    const failed = results.filter((r) => !r.success);

    const summaryLines = results.map((r) => {
      const status = r.success ? "✔" : "✖";
      const ms = `${r.durationMs}ms`;
      return `  ${r.handler} ${status} ${ms}`;
    });

    if (failed.length > 0) {
      summaryLines.push(
        ...failed.map((r) => `  ${r.handler} ERROR: ${r.error ?? "unknown"}`),
      );
    }

    logger.debug(
      `Event: ${normalized.type}\n${summaryLines.join("\n")}`,
    );
  }

  return results;
}