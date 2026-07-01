/**
 * NotificationHandler — Auto-registered handler that creates in-app notification
 * records in the public.notifications table.
 *
 * Checks event.realtime !== false before processing (default: true).
 */
import { supabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createLogger } from "@/lib/logger";
import { routeEvent } from "./RecipientRouter";
import { registerEventHandler } from "./EventService";
import type { BusinessEvent, EventHandler } from "./eventTypes";

const logger = createLogger("NotificationHandler");

type NotificationTemplate = {
  title: string;
  body: string;
  dbType: string;
  severity: string;
};

function getTemplate(event: BusinessEvent): NotificationTemplate {
  const subjectLabel =
    typeof event.metadata?.subjectName === "string"
      ? event.metadata.subjectName
      : event.subjectId.slice(0, 8);

  switch (event.type) {
    case "contractor_registered":
      return { title: "New Contractor", body: `${subjectLabel} has registered.`, dbType: "system", severity: "info" };
    case "kyc_submitted":
      return { title: "KYC Submitted", body: `${subjectLabel} has uploaded verification documents.`, dbType: "system", severity: "info" };
    case "kyc_approved":
      return { title: "KYC Approved", body: `${subjectLabel}'s documents have been approved.`, dbType: "system", severity: "info" };
    case "kyc_rejected":
      return { title: "KYC Rejected", body: `${subjectLabel}'s documents were rejected.`, dbType: "system", severity: "warning" };
    case "contractor_suspended":
      return { title: "Contractor Suspended", body: `${subjectLabel} has been suspended.`, dbType: "system", severity: "warning" };
    case "contractor_restored":
      return { title: "Contractor Restored", body: `${subjectLabel} has been restored.`, dbType: "system", severity: "info" };
    case "job_created":
      return { title: "New Job Created", body: `A new ${subjectLabel} job has been created.`, dbType: "system", severity: "info" };
    case "job_broadcast":
      return { title: "Job Broadcast", body: `Job ${subjectLabel} is searching for a contractor.`, dbType: "system", severity: "info" };
    case "job_assigned":
      return { title: "Job Assigned", body: `Job ${subjectLabel} has been assigned to a contractor.`, dbType: "system", severity: "info" };
    case "job_accepted":
      return { title: "Job Accepted", body: `Contractor accepted job ${subjectLabel}.`, dbType: "system", severity: "info" };
    case "job_contractor_en_route":
      return { title: "Contractor En Route", body: `Contractor is on the way for job ${subjectLabel}.`, dbType: "system", severity: "info" };
    case "job_arrived":
      return { title: "Contractor Arrived", body: `Contractor arrived at job ${subjectLabel}.`, dbType: "system", severity: "info" };
    case "job_in_progress":
      return { title: "Job In Progress", body: `Service has started for job ${subjectLabel}.`, dbType: "system", severity: "info" };
    case "job_started":
      return { title: "Job Started", body: `Job ${subjectLabel} is now in progress.`, dbType: "system", severity: "info" };
    case "job_completed":
      return { title: "Job Completed", body: `Job ${subjectLabel} has been completed.`, dbType: "system", severity: "info" };
    case "job_cancelled":
      return { title: "Job Cancelled", body: `Job ${subjectLabel} has been cancelled.`, dbType: "system", severity: "warning" };
    case "job_expired":
      return { title: "Job Expired", body: `Job ${subjectLabel} has expired.`, dbType: "system", severity: "warning" };
    case "job_no_show":
      return { title: "Job No-Show", body: `Contractor did not show for job ${subjectLabel}.`, dbType: "system", severity: "warning" };
    case "dispute_created":
      return { title: "Dispute Created", body: `A new dispute has been opened for ${subjectLabel}.`, dbType: "system", severity: "warning" };
    case "dispute_resolved":
      return { title: "Dispute Resolved", body: `Dispute for ${subjectLabel} has been resolved.`, dbType: "system", severity: "info" };
    case "dispute_rejected":
      return { title: "Dispute Rejected", body: `Dispute for ${subjectLabel} was rejected.`, dbType: "system", severity: "warning" };
    case "payment_failed":
      return { title: "Payment Failed", body: `A payment for ${subjectLabel} has failed.`, dbType: "system", severity: "critical" };
    case "payment_cancelled":
      return { title: "Payment Cancelled", body: `Payment ${subjectLabel} has been cancelled.`, dbType: "system", severity: "warning" };
    case "payment_refunded":
      return { title: "Payment Refunded", body: `Payment ${subjectLabel} has been refunded.`, dbType: "system", severity: "info" };
    case "refund_initiated":
      return { title: "Refund Initiated", body: `Refund has been initiated for ${subjectLabel}.`, dbType: "system", severity: "info" };
    case "refund_requested":
      return { title: "Refund Requested", body: `A refund has been requested for ${subjectLabel}.`, dbType: "system", severity: "warning" };
    case "refund_completed":
      return { title: "Refund Completed", body: `Refund for ${subjectLabel} has been completed.`, dbType: "system", severity: "info" };
    case "refund_failed":
      return { title: "Refund Failed", body: `Refund for ${subjectLabel} has failed.`, dbType: "system", severity: "critical" };
    case "withdrawal_requested":
      return { title: "Withdrawal Requested", body: `${subjectLabel} has requested a withdrawal.`, dbType: "system", severity: "info" };
    case "withdrawal_completed":
      return { title: "Withdrawal Completed", body: `Withdrawal for ${subjectLabel} has been processed.`, dbType: "system", severity: "info" };
    case "withdrawal_failed":
      return { title: "Withdrawal Failed", body: `Withdrawal for ${subjectLabel} has failed.`, dbType: "system", severity: "critical" };
    case "withdrawal_cancelled":
      return { title: "Withdrawal Cancelled", body: `Withdrawal ${subjectLabel} has been cancelled.`, dbType: "system", severity: "warning" };
    case "support_ticket_created":
      return { title: "Support Ticket Created", body: `A new support ticket has been opened.`, dbType: "system", severity: "info" };
    case "support_ticket_resolved":
      return { title: "Support Ticket Resolved", body: `Support ticket has been resolved.`, dbType: "system", severity: "info" };
    case "promotion_created":
      return { title: "Promotion Created", body: `Promotion "${subjectLabel}" has been created.`, dbType: "system", severity: "info" };
    case "promotion_updated":
      return { title: "Promotion Updated", body: `Promotion "${subjectLabel}" has been updated.`, dbType: "system", severity: "info" };
    case "promotion_deleted":
      return { title: "Promotion Deleted", body: `Promotion "${subjectLabel}" has been deleted.`, dbType: "system", severity: "warning" };
    case "system_warning":
      return { title: "System Warning", body: `${subjectLabel}`, dbType: "system", severity: "warning" };
    case "system_error":
      return { title: "System Error", body: `${subjectLabel}`, dbType: "system", severity: "critical" };
    default:
      return { title: "Notification", body: `${subjectLabel}`, dbType: "system", severity: "info" };
  }
}

async function insertNotification(
  recipientId: string,
  event: BusinessEvent,
  template: NotificationTemplate,
): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;

  try {
    const { error } = await supabase.from("notifications").insert({
      recipient_id: recipientId,
      title: template.title,
      body: template.body,
      type: template.dbType,
      data: {
        eventType: event.type,
        subjectId: event.subjectId,
        secondarySubjectId: event.secondarySubjectId ?? null,
        severity: template.severity,
        actorId: event.actorId,
        correlationId: event.correlationId ?? null,
        occurredAt: event.occurredAt ?? null,
        ...(event.metadata ?? {}),
      },
    });

    if (error) {
      logger.warn("Failed to insert notification", {
        recipientId,
        eventType: event.type,
        error: error.message,
      });
    }
  } catch (err) {
    logger.error("Error inserting notification", err);
  }
}

const handleEvent: EventHandler = async (event) => {
  // Respect the realtime delivery flag (default: true)
  if (event.realtime === false) return;
  if (!isSupabaseConfigured() || !supabase) return;

  const template = getTemplate(event);
  const recipients = await routeEvent(event);

  if (recipients.length === 0) {
    logger.debug("No recipients for event", { eventType: event.type });
    return;
  }

  await Promise.allSettled(
    recipients.map((recipientId) =>
      insertNotification(recipientId, event, template),
    ),
  );
};

// Auto-register on import — fires for every emitEvent() call
registerEventHandler("NotificationHandler", handleEvent);
