/**
 * AuditHandler — Auto-registered handler that writes to admin_action_log
 * via the existing supabaseAuditLog infrastructure.
 *
 * Checks event.audit === true before processing. No-op otherwise.
 */
import { supabaseAuditLog, type AdminActionType, type AdminResourceType } from "@/lib/supabase/data";
import { registerEventHandler } from "./EventService";
import type { EventHandler } from "./eventTypes";
import { createLogger } from "@/lib/logger";

const logger = createLogger("AuditHandler");

const handleEvent: EventHandler = async (event) => {
  if (event.audit !== true) return;

  try {
    const actionType = mapEventTypeToActionType(event.type);
    const resourceType = mapEventTypeToResourceType(event.type);

    await supabaseAuditLog.logAction({
      adminId: event.actorId,
      actionType,
      resourceType,
      resourceId: event.subjectId,
      reason: typeof event.metadata?.reason === "string" ? event.metadata.reason : undefined,
      metadata: {
        eventType: event.type,
        correlationId: event.correlationId,
        occurredAt: event.occurredAt,
        ...(event.metadata ?? {}),
      },
      success: true,
    });
  } catch (err) {
    logger.error("AuditHandler failed", { eventType: event.type, error: err });
  }
};

function mapEventTypeToActionType(eventType: string): AdminActionType {
  switch (eventType) {
    case "contractor_suspended": return "contractor_suspended";
    case "contractor_restored": return "contractor_restored";
    case "kyc_approved": return "contractor_kyc_approved";
    case "kyc_rejected": return "contractor_kyc_rejected";
    case "job_cancelled": return "job_cancelled";
    case "job_completed": return "job_status_updated";
    case "dispute_created": return "dispute_created";
    case "dispute_resolved": return "dispute_resolved";
    case "dispute_rejected": return "dispute_rejected";
    case "support_ticket_created": return "support_ticket_created";
    case "support_ticket_resolved": return "support_ticket_resolved";
    case "refund_requested": return "refund_initiated";
    case "refund_completed": return "refund_completed";
    case "payment_failed": return "payment_failed";
    case "withdrawal_failed": return "withdrawal_failed";
    case "withdrawal_completed": return "withdrawal_completed";
    case "promotion_created": return "settings_promo_code_created";
    case "promotion_deleted": return "settings_promo_code_deleted";
    default: return "job_status_updated";
  }
}

function mapEventTypeToResourceType(eventType: string): AdminResourceType {
  if (eventType.startsWith("contractor") || eventType.startsWith("kyc")) return "contractor";
  if (eventType.startsWith("job")) return "job";
  if (eventType.startsWith("dispute")) return "dispute";
  if (eventType.startsWith("support")) return "support_ticket";
  if (eventType.startsWith("payment") || eventType.startsWith("refund")) return "payment";
  if (eventType.startsWith("withdrawal")) return "withdrawal";
  if (eventType.startsWith("promotion")) return "promo_code";
  return "job";
}

// Auto-register on import
registerEventHandler("AuditHandler", handleEvent);
