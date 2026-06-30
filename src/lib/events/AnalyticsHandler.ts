/**
 * AnalyticsHandler — Auto-registered placeholder for future analytics integration.
 *
 * Receives every event. Currently performs no external calls — only logs
 * event metrics internally. Structured to be replaced with a real analytics
 * backend (PostHog, Mixpanel, Amplitude, self-hosted) without changing
 * any other file.
 */
import { registerEventHandler } from "./EventService";
import { createLogger } from "@/lib/logger";
import type { EventHandler } from "./eventTypes";

const logger = createLogger("AnalyticsHandler");

// In-memory metrics for development visibility
const eventCounts = new Map<string, number>();

const handleEvent: EventHandler = async (event) => {
  // Increment counter
  const current = eventCounts.get(event.type) ?? 0;
  eventCounts.set(event.type, current + 1);

  logger.debug("Analytics: event received", {
    type: event.type,
    source: event.source,
    priority: event.priority,
    schemaVersion: event.schemaVersion,
    correlationId: event.correlationId,
    totalEventsOfThisType: current + 1,
  });
};

// Auto-register on import
registerEventHandler("AnalyticsHandler", handleEvent);

/**
 * Get current event counts (for dashboard/debugging)
 */
export function getAnalyticsEventCounts(): ReadonlyMap<string, number> {
  return eventCounts;
}