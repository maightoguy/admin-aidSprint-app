/**
 * AidSprint Notification Event Architecture (Handler-based)
 *
 * Barrel export for the event-driven notification system.
 *
 * Architecture:
 *   Business Code → emitEvent() → EventService
 *                                     ├── AuditHandler (auto-registered, checks event.audit)
 *                                     ├── NotificationHandler (auto-registered, checks event.realtime)
 *                                     ├── EmailHandler (auto-registered, checks event.email)
 *                                     ├── PushHandler (auto-registered, checks event.push)
 *                                     └── AnalyticsHandler (auto-registered, receives all events)
 *
 * Handlers execute in PARALLEL via Promise.allSettled.
 * Rationale: no handler depends on another's output.
 * Audit authority comes from the admin_action_log table, not execution order.
 *
 * Usage:
 *   import { emitEvent, BusinessEventType } from "@/lib/events";
 *   await emitEvent({
 *     type: BusinessEventType.KYC_APPROVED,
 *     actorId, subjectId,
 *     schemaVersion: 1,
 *     source: "admin-dashboard",
 *     priority: "high",
 *     audit: true,
 *     realtime: true,
 *     correlationId: crypto.randomUUID(),
 *   });
 */

// Core dispatcher + handler registration
export { emitEvent, registerEventHandler } from "./EventService";

// Recipient routing
export { routeEvent, clearRecipientCache } from "./RecipientRouter";

// Strongly typed event constants
export { BusinessEventType } from "./eventTypes";

// Analytics metrics (for dashboard/debugging)
export { getAnalyticsEventCounts } from "./AnalyticsHandler";

// Types
export type {
  AdminNotificationType,
  BusinessEvent,
  EventSchemaVersion,
  EventSource,
  EventPriority,
  NotificationSeverity,
  RecipientStrategy,
  EventHandler,
  EventResult,
} from "./eventTypes";

// Handlers are auto-registered on import — import them to activate
export { /* auto-registered */ } from "./AuditHandler";
export { /* auto-registered */ } from "./NotificationHandler";
export { /* auto-registered */ } from "./EmailHandler";
export { /* auto-registered */ } from "./PushHandler";
export { /* auto-registered */ } from "./AnalyticsHandler";