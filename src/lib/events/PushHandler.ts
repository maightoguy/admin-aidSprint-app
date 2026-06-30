/**
 * PushHandler — Auto-registered stub for future push notification delivery.
 *
 * Checks event.push === true before processing (default: false).
 *
 * When implemented:
 *   1. Receive a BusinessEvent
 *   2. Look up recipient push tokens (fcm_token from profiles)
 *   3. Render push notification payloads
 *   4. Send via Firebase Cloud Messaging or similar
 */
import { createLogger } from "@/lib/logger";
import { registerEventHandler } from "./EventService";
import type { EventHandler } from "./eventTypes";

const logger = createLogger("PushHandler");

const handleEvent: EventHandler = async (event) => {
  if (event.push !== true) return;

  logger.debug("PushHandler stub: push notification would be sent here", {
    eventType: event.type,
    subjectId: event.subjectId,
    correlationId: event.correlationId,
  });
};

// Auto-register on import
registerEventHandler("PushHandler", handleEvent);
