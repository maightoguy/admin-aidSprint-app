/**
 * Event-driven notification type definitions for AidSprint Admin Dashboard.
 *
 * Every event carries:
 *   - schemaVersion: schema version for future migrations (default: 1)
 *   - source: which system emitted the event (default: "admin-dashboard")
 *   - priority: metadata-only signal for future delivery decisions (default: "normal")
 *   - correlationId: links all side-effects of one business action
 *   - occurredAt: when the event actually happened
 */

// =============================================================================
// Strongly typed event type constants
// Use: BusinessEventType.KYC_APPROVED instead of the string "kyc_approved"
// =============================================================================
export const BusinessEventType = {
  // Contractor lifecycle
  CONTRACTOR_REGISTERED: "contractor_registered",
  KYC_SUBMITTED: "kyc_submitted",
  KYC_APPROVED: "kyc_approved",
  KYC_REJECTED: "kyc_rejected",
  CONTRACTOR_SUSPENDED: "contractor_suspended",
  CONTRACTOR_RESTORED: "contractor_restored",
  // Job lifecycle
  JOB_CREATED: "job_created",
  JOB_ASSIGNED: "job_assigned",
  JOB_ACCEPTED: "job_accepted",
  JOB_STARTED: "job_started",
  JOB_COMPLETED: "job_completed",
  JOB_CANCELLED: "job_cancelled",
  // Dispute lifecycle
  DISPUTE_CREATED: "dispute_created",
  DISPUTE_RESOLVED: "dispute_resolved",
  DISPUTE_REJECTED: "dispute_rejected",
  // Payment lifecycle
  PAYMENT_FAILED: "payment_failed",
  REFUND_REQUESTED: "refund_requested",
  REFUND_COMPLETED: "refund_completed",
  // Withdrawal lifecycle
  WITHDRAWAL_REQUESTED: "withdrawal_requested",
  WITHDRAWAL_COMPLETED: "withdrawal_completed",
  WITHDRAWAL_FAILED: "withdrawal_failed",
  // Support lifecycle
  SUPPORT_TICKET_CREATED: "support_ticket_created",
  SUPPORT_TICKET_RESOLVED: "support_ticket_resolved",
  // Promotion lifecycle
  PROMOTION_CREATED: "promotion_created",
  PROMOTION_DELETED: "promotion_deleted",
  // System events
  SYSTEM_WARNING: "system_warning",
  SYSTEM_ERROR: "system_error",
} as const;

/** Union of all valid event type string values */
export type AdminNotificationType = (typeof BusinessEventType)[keyof typeof BusinessEventType];

export type NotificationSeverity = "info" | "warning" | "critical";

export type RecipientStrategy =
  | "acting_admin"
  | "all_admins"
  | "assigned_admin";

/** Event schema version — increment when fields are added/changed */
export type EventSchemaVersion = 1;

/** Which system/client emitted the event */
export type EventSource =
  | "admin-dashboard"
  | "customer-app"
  | "contractor-app"
  | "edge-function"
  | "cron"
  | "system"
  | "api";

/** Metadata-only priority signal for future handlers (email, push, etc.) */
export type EventPriority = "low" | "normal" | "high" | "critical";

/**
 * Result of a single handler's execution.
 * Returned as part of EventResult[] from emitEvent().
 */
export type EventResult = {
  /** Human-readable handler name for diagnostics */
  handler: string;
  /** Whether the handler completed without throwing */
  success: boolean;
  /** Execution time in milliseconds */
  durationMs: number;
  /** Captured error if the handler threw */
  error?: string;
};

export type BusinessEvent = {
  // === Event identity ===
  /**
   * Schema version for this event shape.
   * Default: 1. Increase when fields are added/removed.
   * Handlers can check schemaVersion for backward compatibility.
   */
  schemaVersion?: EventSchemaVersion;

  /** Unique event type identifier. Use BusinessEventType constants. */
  type: AdminNotificationType;

  // === Event origin ===
  /** Which system/client emitted this event. Default: "admin-dashboard" */
  source?: EventSource;

  /** User ID of the actor who triggered the event */
  actorId: string;

  /** The primary subject/resource ID this event concerns */
  subjectId: string;

  /** Optional secondary subject (e.g., payment linked to a job) */
  secondarySubjectId?: string;

  // === Routing & delivery ===
  /** Severity level for UI/priority */
  severity?: NotificationSeverity;

  /** Metadata-only priority for future handler decisions. Default: "normal" */
  priority?: EventPriority;

  /** Who should receive notifications about this event */
  notify?: RecipientStrategy;

  /** Whether to also write an audit log entry */
  audit?: boolean;

  /** Enable in-app notification (bell dropdown). Default: true */
  realtime?: boolean;

  /** Enable email delivery. Default: false (stub) */
  email?: boolean;

  /** Enable push notification. Default: false (stub) */
  push?: boolean;

  /** Arbitrary metadata payload */
  metadata?: Record<string, unknown>;

  // === Tracing & observability ===
  /** Unique ID linking all side-effects of a single business action (e.g., KYC approval) */
  correlationId?: string;

  /** When the event actually occurred. Default: now */
  occurredAt?: string;
};

export type EventHandler = (event: BusinessEvent) => Promise<void> | void;