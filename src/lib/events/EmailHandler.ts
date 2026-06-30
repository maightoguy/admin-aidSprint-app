/**
 * EmailHandler — Auto-registered stub for future email notification delivery.
 *
 * Checks event.email === true before processing (default: false).
 *
 * When implemented:
 *   1. Receive a BusinessEvent
 *   2. Look up recipient email addresses from profiles
 *   3. Render email templates
 *   4. Send via chosen email provider (SendGrid, Resend, etc.)
 */
import { createLogger } from "@/lib/logger";
import { registerEventHandler } from "./EventService";
import type { BusinessEvent, EventHandler } from "./eventTypes";

const logger = createLogger("EmailHandler");

const handleEvent: EventHandler = async (event) => {
  if (event.email !== true) return;

  logger.debug("EmailHandler stub: email would be sent here", {
    eventType: event.type,
    subjectId: event.subjectId,
    correlationId: event.correlationId,
  });
};

// Auto-register on import
registerEventHandler("EmailHandler", handleEvent);
