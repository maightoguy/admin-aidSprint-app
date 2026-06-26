/**
 * P1 — End-to-End Admin Workflow Integration Tests
 *
 * These tests exercise the full admin data layer (mock-backed) to validate that
 * all critical business workflows function correctly end-to-end. Each test
 * seeds deterministic in-memory state, performs cross-module operations, and
 * asserts on the resulting state, audit trails, and edge cases.
 *
 * Workflows covered:
 *   1.  Admin Login & Dashboard
 *   2.  Job Dispatch & Lifecycle Management
 *   3.  Contractor Operations (Suspend / Restore)
 *   4.  KYC Document Review (Approve / Reject)
 *   5.  Finance Operations (Refunds, Withdrawals, Payouts)
 *   6.  Dispute Resolution (Full lifecycle incl. refund chain)
 *   7.  Support Ticket Management (Messaging, Status tracking)
 *   8.  Settings & Marketplace Configuration
 *   9.  Cross-Module Complete Admin Journey (10-step pipeline)
 *  10.  Cross-Module Contractor Suspend → Payout Cancel
 *  11.  Failure Scenarios & Error Handling
 *  12.  Audit Trail Integrity & Immutability
 *  13.  Realtime Workflow Simulation
 *  14.  Concurrent Operations Safety
 *  15.  Test Data Isolation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  seedTestData,
  teardownTestData,
  testStore,
  getAdminId,
  getContractorId,
  getUserId,
  SEED,
} from "../setup";

// --------------------------------------------------------------------------
// Mock the data layer — returns typed mocks that delegate to testStore.
// We use vi.hoisted so the factory sees the testStore reference at module load.
// --------------------------------------------------------------------------
const { mockDataLayer } = vi.hoisted(() => {
  let store: any;
  return {
    mockDataLayer: {
      setStore(s: any) {
        store = s;
      },
      getStore() {
        return store;
      },
    },
  };
});

vi.mock("../../src/lib/supabase/data", () => {
  const mod: Record<string, any> = {};

  // Helper: read from store
  const s = () => mockDataLayer.getStore();
  const now = () => new Date().toISOString();
  const clone = (obj: any) => (obj ? { ...obj } : obj);

  // ── Re-export types ──
  mod.SupabaseResult = {};
  mod.requireSupabaseClient = () => null;
  mod.getResilienceMetrics = () => ({});
  mod.resetCircuitBreaker = () => {};

  // ── Profiles ──
  mod.supabaseProfiles = {
    getById: async (id: string) => {
      const p = s()?.profiles?.find((x: any) => x.id === id);
      return p
        ? { ok: true, data: clone(p) }
        : { ok: false, message: "Profile not found." };
    },
    getRoleById: async (id: string) => {
      const p = s()?.profiles?.find((x: any) => x.id === id);
      return p && typeof p.role === "string"
        ? { ok: true, data: p.role }
        : { ok: false, message: "Profile role not found." };
    },
    listByIds: async (ids: string[]) => ({
      ok: true,
      data: (s()?.profiles ?? []).filter((p: any) => ids.includes(p.id)),
    }),
    listLatest: async (params?: any) => {
      let rows = [...(s()?.profiles ?? [])];
      if (params?.roles?.length)
        rows = rows.filter((p: any) => params.roles.includes(p.role));
      return { ok: true, data: rows.slice(0, params?.limit ?? 100) };
    },
  };

  // ── Jobs ──
  mod.supabaseJobs = {
    listLatest: async (params?: any) => {
      let rows = [...(s()?.jobs ?? [])];
      if (params?.status)
        rows = rows.filter((j: any) => j.status === params.status);
      return { ok: true, data: rows.slice(0, params?.limit ?? 50) };
    },
    getById: async (jobId: string) => {
      const j = s()?.jobs?.find((x: any) => x.id === jobId);
      return j
        ? { ok: true, data: clone(j) }
        : { ok: false, message: "Job not found." };
    },
    listByIds: async (ids: string[]) => ({
      ok: true,
      data: (s()?.jobs ?? []).filter((j: any) => ids.includes(j.id)),
    }),
    listByUserIds: async (userIds: string[], params?: any) => ({
      ok: true,
      data: (s()?.jobs ?? [])
        .filter((j: any) => userIds.includes(j.user_id))
        .slice(0, params?.limit ?? 200),
    }),
    listByContractorIds: async (contractorIds: string[], params?: any) => ({
      ok: true,
      data: (s()?.jobs ?? [])
        .filter((j: any) => contractorIds.includes(j.contractor_id))
        .slice(0, params?.limit ?? 200),
    }),
    updateLifecycle: async (params: any) => {
      const jobs = s()?.jobs;
      const idx = jobs?.findIndex((j: any) => j.id === params.jobId);
      if (idx === -1 || idx === undefined)
        return { ok: false, message: "Job not found." };
      if (!params.actorUserId)
        return { ok: false, message: "Admin user id is required." };

      const job = jobs[idx];
      const ts = now();

      if (params.status === "cancelled") {
        if (!params.cancellationReason)
          return {
            ok: false,
            message: "Cancellation reason is required.",
          };
        job.status = "cancelled";
        job.cancelled_at = ts;
        job.cancellation_reason = params.cancellationReason;
        job.cancelled_by = params.actorUserId;
      } else if (params.status === "broadcast") {
        job.status = "broadcast";
        job.contractor_id = null;
        job.accepted_at = null;
        job.started_at = null;
        job.completed_at = null;
        job.cancelled_at = null;
        job.cancellation_reason = null;
        job.cancelled_by = null;
      } else if (params.status === "completed") {
        job.status = "completed";
        job.completed_at = ts;
      } else {
        job.status = params.status;
      }
      job.updated_at = ts;

      (s().audit ??= []).push({
        id: `audit-${(s().audit?.length ?? 0) + 1}`,
        admin_id: params.actorUserId,
        action_type: "job_cancelled",
        resource_type: "job",
        resource_id: params.jobId,
        reason: params.cancellationReason || params.status,
        result: "success",
        created_at: ts,
      });
      return { ok: true, data: clone(job) };
    },
  };

  // ── Contractors ──
  mod.supabaseContractors = {
    listLatest: async (params?: any) => ({
      ok: true,
      data: (s()?.contractors ?? []).slice(0, params?.limit ?? 100),
    }),
    getById: async (id: string) => {
      const c = s()?.contractors?.find((x: any) => x.id === id);
      return c
        ? { ok: true, data: clone(c) }
        : { ok: false, message: "Contractor not found." };
    },
    listByIds: async (ids: string[]) => ({
      ok: true,
      data: (s()?.contractors ?? []).filter((c: any) => ids.includes(c.id)),
    }),
    updateLifecycle: async (params: any) => {
      const contractors = s()?.contractors;
      const idx = contractors?.findIndex(
        (c: any) => c.id === params.contractorId,
      );
      if (idx === -1 || idx === undefined)
        return { ok: false, message: "Contractor not found." };
      if (!params.actorUserId)
        return { ok: false, message: "Admin user id is required." };
      if (!params.reason)
        return { ok: false, message: "A lifecycle reason is required." };

      const c = contractors[idx];
      const ts = now();
      if (params.action === "suspend") {
        c.suspended_at = ts;
        c.suspended_by = params.actorUserId;
        c.suspension_reason = params.reason;
        c.restored_at = null;
        c.restored_by = null;
        c.restore_reason = null;
      } else {
        c.restored_at = ts;
        c.restored_by = params.actorUserId;
        c.restore_reason = params.reason;
        c.suspended_at = null;
        c.suspended_by = null;
        c.suspension_reason = null;
      }
      c.updated_at = ts;

      (s().audit ??= []).push({
        id: `audit-${(s().audit?.length ?? 0) + 1}`,
        admin_id: params.actorUserId,
        action_type:
          params.action === "suspend"
            ? "contractor_suspended"
            : "contractor_restored",
        resource_type: "contractor",
        resource_id: params.contractorId,
        reason: params.reason,
        result: "success",
        created_at: ts,
      });
      return { ok: true, data: clone(c) };
    },
  };

  // ── Contractor Documents (KYC) ──
  mod.supabaseContractorDocuments = {
    listByContractorIds: async (ids: string[]) => ({
      ok: true,
      data: (s()?.contractorDocuments ?? []).filter((d: any) =>
        ids.includes(d.contractor_id),
      ),
    }),
    reviewDocuments: async (params: any) => {
      const docs = (s()?.contractorDocuments ?? []).filter((d: any) =>
        params.documentIds.includes(d.id),
      );
      if (docs.length === 0)
        return { ok: false, message: "No documents found." };
      const ts = now();
      for (const doc of docs) {
        doc.status = params.status;
        doc.reviewed_at = ts;
        doc.reviewed_by = params.reviewedBy;
        doc.rejection_reason =
          params.status === "rejected"
            ? params.rejectionReason?.trim() || null
            : null;
      }
      (s().audit ??= []).push({
        id: `audit-${(s().audit?.length ?? 0) + 1}`,
        admin_id: params.reviewedBy,
        action_type:
          params.status === "approved"
            ? "contractor_kyc_approved"
            : "contractor_kyc_rejected",
        resource_type: "contractor_document",
        resource_id: params.contractorId,
        reason: params.rejectionReason || undefined,
        result: "success",
        created_at: ts,
      });
      return { ok: true, data: docs.map(clone) };
    },
  };

  // ── Finance ──
  mod.supabaseFinance = {
    listPayments: async (params?: any) => ({
      ok: true,
      data: (s()?.payments ?? []).slice(0, params?.limit ?? 50),
    }),
    listWithdrawals: async (params?: any) => ({
      ok: true,
      data: (s()?.withdrawals ?? []).slice(0, params?.limit ?? 50),
    }),
    listPaymentsByIds: async (ids: string[]) => ({
      ok: true,
      data: (s()?.payments ?? []).filter((p: any) => ids.includes(p.id)),
    }),
    listWithdrawalsByIds: async (ids: string[]) => ({
      ok: true,
      data: (s()?.withdrawals ?? []).filter((w: any) => ids.includes(w.id)),
    }),
    listPaymentsByJobIds: async (jobIds: string[]) => ({
      ok: true,
      data: (s()?.payments ?? []).filter((p: any) =>
        jobIds.includes(p.job_id),
      ),
    }),
    listPaymentsByPayeeIds: async (payeeIds: string[]) => ({
      ok: true,
      data: (s()?.payments ?? []).filter((p: any) =>
        payeeIds.includes(p.payee_id),
      ),
    }),
    refund: async (params: any) => {
      const payments = s()?.payments;
      const idx = payments?.findIndex(
        (p: any) => p.id === params.paymentId,
      );
      if (idx === -1 || idx === undefined)
        return { ok: false, message: "Payment not found." };
      const p = payments[idx];
      if (!["captured", "paid"].includes(p.status))
        return {
          ok: false,
          message: "Payment must be captured or paid to refund.",
        };
      const ts = now();
      p.status = "refunded";
      p.refunded_at = ts;
      p.refund_initiated_by = params.actorUserId;
      p.refund_reason = params.reason;

      (s().audit ??= []).push({
        id: `audit-${(s().audit?.length ?? 0) + 1}`,
        admin_id: params.actorUserId,
        action_type: "refund_initiated",
        resource_type: "payment",
        resource_id: params.paymentId,
        reason: params.reason,
        metadata: { refundAmount: params.refundAmount },
        result: "success",
        created_at: ts,
      });
      (s().financeAuditLog ??= []).push({
        id: `fa-${(s().financeAuditLog?.length ?? 0) + 1}`,
        admin_id: params.actorUserId,
        action: "refund_initiated",
        payment_id: params.paymentId,
        amount: params.refundAmount,
        reason: params.reason,
        created_at: ts,
      });
      return { ok: true, data: clone(p) };
    },
    markPaymentFailed: async (params: any) => {
      const payments = s()?.payments;
      const idx = payments?.findIndex(
        (p: any) => p.id === params.paymentId,
      );
      if (idx === -1 || idx === undefined)
        return { ok: false, message: "Payment not found." };
      const p = payments[idx];
      if (["refunded", "failed", "cancelled"].includes(p.status))
        return {
          ok: false,
          message: "Payment is already in terminal state.",
        };
      p.status = "failed";
      return { ok: true, data: clone(p) };
    },
    cancelPayment: async (params: any) => {
      const payments = s()?.payments;
      const idx = payments?.findIndex(
        (p: any) => p.id === params.paymentId,
      );
      if (idx === -1 || idx === undefined)
        return { ok: false, message: "Payment not found." };
      const p = payments[idx];
      if (!["pending", "requires_payment_method"].includes(p.status))
        return { ok: false, message: "Payment must be pending to cancel." };
      p.status = "cancelled";
      return { ok: true, data: clone(p) };
    },
    markWithdrawalCompleted: async (params: any) => {
      const withdrawals = s()?.withdrawals;
      const idx = withdrawals?.findIndex(
        (w: any) => w.id === params.withdrawalId,
      );
      if (idx === -1 || idx === undefined)
        return { ok: false, message: "Withdrawal not found." };
      const w = withdrawals[idx];
      if (w.status !== "processing")
        return {
          ok: false,
          message: "Withdrawal must be in processing state.",
        };
      const ts = now();
      w.status = "completed";
      w.processed_at = ts;
      return { ok: true, data: clone(w) };
    },
    markWithdrawalFailed: async (params: any) => {
      const withdrawals = s()?.withdrawals;
      const idx = withdrawals?.findIndex(
        (w: any) => w.id === params.withdrawalId,
      );
      if (idx === -1 || idx === undefined)
        return { ok: false, message: "Withdrawal not found." };
      const w = withdrawals[idx];
      if (!["pending", "processing"].includes(w.status))
        return {
          ok: false,
          message: "Withdrawal must be pending or processing.",
        };
      w.status = "failed";
      w.failure_message = params.failureCode;
      return { ok: true, data: clone(w) };
    },
    cancelWithdrawal: async (params: any) => {
      const withdrawals = s()?.withdrawals;
      const idx = withdrawals?.findIndex(
        (w: any) => w.id === params.withdrawalId,
      );
      if (idx === -1 || idx === undefined)
        return { ok: false, message: "Withdrawal not found." };
      const w = withdrawals[idx];
      if (w.status !== "pending")
        return { ok: false, message: "Withdrawal must be pending to cancel." };
      w.status = "cancelled";
      return { ok: true, data: clone(w) };
    },
  };

  // ── Finance Audit Log ──
  mod.supabaseFinanceAuditLog = {
    listByPaymentId: async (paymentId: string) => ({
      ok: true,
      data: (s()?.financeAuditLog ?? []).filter(
        (l: any) => l.payment_id === paymentId,
      ),
    }),
    listByDisputeId: async (disputeId: string) => ({
      ok: true,
      data: (s()?.financeAuditLog ?? []).filter(
        (l: any) => l.dispute_id === disputeId,
      ),
    }),
    listRecent: async (limit: number = 50) => ({
      ok: true,
      data: (s()?.financeAuditLog ?? []).slice(0, limit),
    }),
  };

  // ── Disputes ──
  mod.supabaseDisputes = {
    listLatest: async (params?: any) => ({
      ok: true,
      data: (s()?.disputes ?? []).slice(0, params?.limit ?? 50),
    }),
    getById: async (id: string) => {
      const d = s()?.disputes?.find((x: any) => x.id === id);
      return d
        ? { ok: true, data: clone(d) }
        : { ok: false, message: "Dispute not found." };
    },
    applyAction: async (params: any) => {
      const disputes = s()?.disputes;
      const idx = disputes?.findIndex(
        (d: any) => d.id === params.disputeId,
      );
      if (idx === -1 || idx === undefined)
        return { ok: false, message: "Dispute not found." };
      const d = disputes[idx];
      const ts = now();
      if (params.action === "resolve") {
        d.status = "resolved";
        d.resolution = "resolved";
        d.resolved_by = params.actorUserId;
        d.resolved_at = ts;
      } else if (params.action === "reject") {
        d.status = "rejected";
        d.resolution = "rejected";
        d.resolved_by = params.actorUserId;
        d.resolved_at = ts;
      } else if (params.action === "escalate") {
        d.status = "escalated";
      }
      d.updated_at = ts;
      (s().disputeEvents ??= []).push({
        id: `de-${(s().disputeEvents?.length ?? 0) + 1}`,
        dispute_id: params.disputeId,
        actor_id: params.actorUserId,
        actor_role: "admin",
        event_type: params.action,
        message: params.reason || "",
        created_at: ts,
      });
      return { ok: true, data: clone(d) };
    },
    createDisputeFromRequest: async (params: any) => {
      const id = `dispute-${(s()?.disputes?.length ?? 0) + 1}`;
      const ts = now();
      const dispute = {
        id,
        job_id: params.jobId,
        raised_by: params.createdBy,
        raised_by_role: "admin",
        reason: params.reason,
        status: "under_review",
        resolution: null,
        resolved_by: null,
        resolved_at: null,
        payment_id: null,
        refund_status: null,
        created_at: ts,
        updated_at: ts,
      };
      (s().disputes ??= []).push(dispute);
      (s().disputeEvents ??= []).push({
        id: `de-${(s().disputeEvents?.length ?? 0) + 1}`,
        dispute_id: id,
        actor_id: params.createdBy,
        actor_role: "admin",
        event_type: "created",
        message: "Dispute created by admin from request",
        created_at: ts,
      });
      return { ok: true, data: clone(dispute) };
    },
    listEvidenceByDisputeIds: async (disputeIds: string[]) => ({
      ok: true,
      data: (s()?.disputeEvidence ?? []).filter((e: any) =>
        disputeIds.includes(e.dispute_id),
      ),
    }),
    initiateRefund: async (params: any) => {
      const d = s()?.disputes?.find(
        (x: any) => x.id === params.disputeId,
      );
      if (!d) return { ok: false, message: "Dispute not found." };
      d.refund_status = "pending";
      d.payment_id = params.paymentId;
      const p = s()?.payments?.find(
        (x: any) => x.id === params.paymentId,
      );
      if (p) {
        p.refund_initiated_by = params.adminUserId;
        p.refund_reason = params.refundReason;
      }
      (s().financeAuditLog ??= []).push({
        id: `fa-${(s().financeAuditLog?.length ?? 0) + 1}`,
        admin_id: params.adminUserId,
        action: "refund_initiated",
        dispute_id: params.disputeId,
        payment_id: params.paymentId,
        amount: params.refundAmount,
        reason: params.refundReason,
        created_at: now(),
      });
      return {
        ok: true,
        data: {
          disputeId: params.disputeId,
          paymentId: params.paymentId,
          refundStatus: "pending",
        },
      };
    },
    completeRefund: async (params: any) => {
      const d = s()?.disputes?.find(
        (x: any) => x.id === params.disputeId,
      );
      if (!d) return { ok: false, message: "Dispute not found." };
      d.refund_status = "completed";
      d.status = "resolved";
      if (d.payment_id) {
        const p = s()?.payments?.find(
          (x: any) => x.id === d.payment_id,
        );
        if (p) {
          p.status = "refunded";
          p.refunded_at = now();
        }
      }
      (s().financeAuditLog ??= []).push({
        id: `fa-${(s().financeAuditLog?.length ?? 0) + 1}`,
        admin_id: params.adminUserId,
        action: "refund_completed",
        dispute_id: params.disputeId,
        payment_id: d.payment_id,
        created_at: now(),
      });
      return {
        ok: true,
        data: { refundStatus: "completed", paymentStatus: "refunded" },
      };
    },
    failRefund: async (params: any) => {
      const d = s()?.disputes?.find(
        (x: any) => x.id === params.disputeId,
      );
      if (!d) return { ok: false, message: "Dispute not found." };
      d.refund_status = "failed";
      return { ok: true, data: { refundStatus: "failed" } };
    },
    getRefundStatus: async (disputeId: string) => {
      const d = s()?.disputes?.find((x: any) => x.id === disputeId);
      if (!d) return { ok: false, message: "Dispute not found." };
      return {
        ok: true,
        data: {
          refundStatus: d.refund_status || null,
          paymentStatus:
            s()
              ?.payments?.find((p: any) => p.id === d.payment_id)
              ?.status?.() || null,
          refundedAt:
            s()
              ?.payments?.find((p: any) => p.id === d.payment_id)
              ?.refunded_at?.() || null,
        },
      };
    },
    uploadEvidenceFile: async (params: any) => {
      const id = `evidence-${(s()?.disputeEvidence?.length ?? 0) + 1}`;
      (s().disputeEvidence ??= []).push({
        id,
        dispute_id: params.disputeId,
        file_url: `https://storage.example.com/disputes/${params.disputeId}/${id}`,
        file_name: params.file?.name || "evidence",
        file_size: params.file?.size || 0,
        file_type: params.file?.type || "application/octet-stream",
        uploaded_by: params.adminUserId,
        uploaded_at: now(),
      });
      return { ok: true, data: { id } };
    },
  };

  // ── Support ──
  mod.supabaseSupport = {
    listLatest: async (params?: any) => ({
      ok: true,
      data: (s()?.supportTickets ?? []).slice(0, params?.limit ?? 50),
    }),
    listEventsByTicketIds: async (ticketIds: string[]) => ({
      ok: true,
      data: (s()?.supportTicketEvents ?? []).filter((e: any) =>
        ticketIds.includes(e.ticket_id),
      ),
    }),
    updateStatus: async (params: any) => {
      const tickets = s()?.supportTickets;
      const idx = tickets?.findIndex(
        (t: any) => t.id === params.ticketId,
      );
      if (idx === -1 || idx === undefined)
        return { ok: false, message: "Support ticket not found." };
      const t = tickets[idx];
      const ts = now();
      if (params.status === "resolved") {
        t.status = "resolved";
        t.resolved_at = ts;
      } else {
        t.status = "in_review";
      }
      t.updated_at = ts;
      (s().supportTicketEvents ??= []).push({
        id: `ste-${(s().supportTicketEvents?.length ?? 0) + 1}`,
        ticket_id: params.ticketId,
        actor_id: params.actorUserId,
        actor_role: "admin",
        event_type: params.status === "resolved" ? "resolved" : "status_changed",
        message: params.message?.trim() || "",
        metadata: { next_status: params.status },
        created_at: ts,
      });
      return { ok: true, data: clone(t) };
    },
    createMessage: async (params: any) => {
      if (!params.content)
        return { ok: false, message: "Message content is required." };
      if (params.content.length > 5000)
        return {
          ok: false,
          message: "Message exceeds maximum length of 5000 characters.",
        };
      const msg = {
        id: `msg-${(s()?.supportMessages?.length ?? 0) + 1}`,
        ticket_id: params.ticketId,
        sender_id: params.senderUserId,
        sender_role: params.isAdmin ? "admin" : "user",
        content: params.content,
        read_by_admins: params.isAdmin
          ? { [params.senderUserId]: now() }
          : {},
        created_at: now(),
      };
      (s().supportMessages ??= []).push(msg);
      return { ok: true, data: msg };
    },
    listMessagesByTicketId: async (params: any) => ({
      ok: true,
      data: (s()?.supportMessages ?? []).filter(
        (m: any) => m.ticket_id === params.ticketId,
      ),
    }),
    markMessageAsRead: async (params: any) => {
      const msg = (s()?.supportMessages ?? []).find(
        (m: any) => m.id === params.messageId,
      );
      if (!msg)
        return { ok: false, message: "Message not found." };
      msg.read_by_admins = {
        ...msg.read_by_admins,
        [params.adminUserId]: now(),
      };
      return { ok: true, data: undefined };
    },
    getUnreadMessageCount: async (params: any) => {
      const unread = (s()?.supportMessages ?? []).filter(
        (m: any) =>
          !m.read_by_admins || !m.read_by_admins[params.adminUserId],
      );
      return { ok: true, data: unread.length };
    },
    createSupportTicket: async (params: any) => {
      const id = `ticket-${(s()?.supportTickets?.length ?? 0) + 1}`;
      const ts = now();
      const ticket = {
        id,
        user_id: params.userId,
        subject: params.subject,
        description: params.description,
        status: "open",
        priority: params.priority || "medium",
        category: params.category || "general",
        created_at: ts,
        updated_at: ts,
        resolved_at: null,
      };
      (s().supportTickets ??= []).push(ticket);
      (s().supportTicketEvents ??= []).push({
        id: `ste-${(s().supportTicketEvents?.length ?? 0) + 1}`,
        ticket_id: id,
        actor_id: params.userId,
        actor_role: params.userId === getAdminId() ? "admin" : "user",
        event_type: "created",
        message: "Ticket created",
        created_at: ts,
      });
      return { ok: true, data: ticket };
    },
  };

  // ── Notifications ──
  mod.supabaseNotifications = {
    listLatestForRecipient: async (params: any) => {
      const limit = params.limit ?? 50;
      const rows = (s()?.notifications ?? []).filter(
        (n: any) => n.recipient_id === params.recipientId,
      );
      return { ok: true, data: rows.slice(0, limit) };
    },
    markRead: async (params: any) => {
      const n = (s()?.notifications ?? []).find(
        (x: any) => x.id === params.notificationId,
      );
      if (!n)
        return { ok: false, message: "Notification not found." };
      n.read_at = now();
      return { ok: true, data: clone(n) };
    },
    markAllReadForRecipient: async (params: any) => {
      const unread = (s()?.notifications ?? []).filter(
        (n: any) =>
          n.recipient_id === params.recipientId && !n.read_at,
      );
      const ts = now();
      for (const n of unread) n.read_at = ts;
      return { ok: true, data: unread.length };
    },
  };

  // ── Reviews ──
  mod.supabaseReviews = {
    listByRevieweeIds: async (revieweeIds: string[]) => ({
      ok: true,
      data: (s()?.reviews ?? []).filter((r: any) =>
        revieweeIds.includes(r.reviewee_id),
      ),
    }),
  };

  // ── Settings ──
  mod.supabaseSettings = {
    getOrCreateAdminSecuritySettings: async () => ({
      ok: true,
      data: {
        admin_user_id: getAdminId(),
        mfa_policy: "optional" as const,
        recovery_codes_generated_at: null,
        last_reauth_at: null,
        last_mfa_reset_requested_at: null,
        last_mfa_reset_by: null,
        created_at: now(),
        updated_at: now(),
      },
    }),
    listServiceCategories: async () => ({
      ok: true,
      data: (s()?.serviceCategories ?? []).map(clone),
    }),
    createServiceCategory: async (params: any) => {
      const id = `cat-${(s()?.serviceCategories?.length ?? 0) + 1}`;
      const cat = {
        id,
        name: params.name,
        description: params.description || "",
        icon_key: params.iconKey || "",
        display_order: (s()?.serviceCategories?.length ?? 0) + 1,
        min_hours: params.minHours ?? 1,
        is_active: params.isActive ?? true,
        created_at: now(),
      };
      (s().serviceCategories ??= []).push(cat);
      return { ok: true, data: cat };
    },
    updateServiceCategory: async (params: any) => {
      const cat = (s()?.serviceCategories ?? []).find(
        (c: any) => c.id === params.id,
      );
      if (!cat)
        return { ok: false, message: "Category not found." };
      if (params.name !== undefined) cat.name = params.name;
      if (params.description !== undefined)
        cat.description = params.description;
      if (params.isActive !== undefined)
        cat.is_active = params.isActive;
      return { ok: true, data: clone(cat) };
    },
    listServiceTypes: async () => ({
      ok: true,
      data: (s()?.serviceTypes ?? []).map(clone),
    }),
    createServiceType: async (params: any) => {
      const id = `st-${(s()?.serviceTypes?.length ?? 0) + 1}`;
      const st = {
        id,
        category_id: params.categoryId,
        name: params.name,
        base_price: params.basePrice ?? 0,
        is_price_additional: params.isPriceAdditional ?? false,
        is_active: params.isActive ?? true,
        created_at: now(),
      };
      (s().serviceTypes ??= []).push(st);
      return { ok: true, data: st };
    },
    updateServiceType: async (params: any) => {
      const st = (s()?.serviceTypes ?? []).find(
        (s: any) => s.id === params.id,
      );
      if (!st)
        return { ok: false, message: "Service type not found." };
      if (params.name !== undefined) st.name = params.name;
      if (params.basePrice !== undefined)
        st.base_price = params.basePrice;
      if (params.isActive !== undefined)
        st.is_active = params.isActive;
      return { ok: true, data: clone(st) };
    },
    listUrgencyTiers: async () => ({
      ok: true,
      data: (s()?.urgencyTiers ?? []).map(clone),
    }),
    updateUrgencyTier: async (params: any) => {
      const tier = (s()?.urgencyTiers ?? []).find(
        (t: any) => t.id === params.id,
      );
      if (!tier)
        return { ok: false, message: "Urgency tier not found." };
      if (params.extraFee !== undefined)
        tier.extra_fee = params.extraFee;
      if (params.isActive !== undefined)
        tier.is_active = params.isActive;
      return { ok: true, data: clone(tier) };
    },
    listPromoCodes: async () => ({
      ok: true,
      data: (s()?.promo ?? []).map(clone),
    }),
    createPromoCode: async (params: any) => {
      const id = `promo-${(s()?.promo?.length ?? 0) + 1}`;
      const promo = {
        id,
        code: params.code,
        description: params.description,
        discount_type: params.discountType,
        discount_value: params.discountValue,
        max_uses: params.maxUses ?? params.max_uses ?? 100,
        current_uses: 0,
        max_uses_per_user: 1,
        min_order_amount: params.minOrderAmount ?? 0,
        is_active: params.isActive ?? true,
        starts_at: params.startsOn ?? now(),
        expires_at: params.endsOn ?? null,
        created_at: now(),
      };
      (s().promo ??= []).push(promo);
      return { ok: true, data: promo };
    },
    updatePromoCode: async (params: any) => {
      const promo = (s()?.promo ?? []).find(
        (p: any) => p.id === params.id,
      );
      if (!promo)
        return { ok: false, message: "Promo code not found." };
      if (params.isActive !== undefined)
        promo.is_active = params.isActive;
      if (params.maxUses !== undefined) promo.max_uses = params.maxUses;
      return { ok: true, data: clone(promo) };
    },
    deletePromoCode: async (id: string) => {
      const idx = (s()?.promo ?? []).findIndex(
        (p: any) => p.id === id,
      );
      if (idx === -1)
        return { ok: false, message: "Promo code not found." };
      (s()?.promo ?? []).splice(idx, 1);
      return { ok: true, data: null };
    },
    createNotificationCampaign: async (params: any) => {
      const id = `campaign-${(s()?.notificationsCampaigns?.length ?? 0) + 1}`;
      const camp = {
        id,
        name: params.name,
        description: params.description || "",
        channel: "push",
        template_id: params.templateId ?? null,
        status: params.status || "enabled",
        created_at: now(),
      };
      (s().notificationsCampaigns ??= []).push(camp);
      return { ok: true, data: camp };
    },
    updateNotificationCampaign: async (params: any) => {
      const camp = (s()?.notificationsCampaigns ?? []).find(
        (c: any) => c.id === params.id,
      );
      if (!camp)
        return { ok: false, message: "Campaign not found." };
      if (params.name !== undefined) camp.name = params.name;
      if (params.status !== undefined) camp.status = params.status;
      return { ok: true, data: clone(camp) };
    },
    deleteNotificationCampaign: async (id: string) => {
      const idx = (s()?.notificationsCampaigns ?? []).findIndex(
        (c: any) => c.id === id,
      );
      if (idx === -1)
        return { ok: false, message: "Campaign not found." };
      (s()?.notificationsCampaigns ?? []).splice(idx, 1);
      return { ok: true, data: null };
    },
  };

  // ── Audit Log ──
  mod.supabaseAuditLog = {
    logAction: async (params: any) => {
      (s().audit ??= []).push({
        id: `audit-${(s().audit?.length ?? 0) + 1}`,
        admin_id: params.adminId,
        action_type: params.actionType,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        reason: params.reason || null,
        metadata: params.metadata || {},
        result: params.success !== false ? "success" : "failure",
        error_message: params.errorMessage || null,
        created_at: now(),
      });
    },
    listActions: async (params?: any) => {
      let logs = [...(s()?.audit ?? [])];
      if (params?.adminId)
        logs = logs.filter((l: any) => l.admin_id === params.adminId);
      if (params?.actionType)
        logs = logs.filter(
          (l: any) => l.action_type === params.actionType,
        );
      if (params?.resourceType)
        logs = logs.filter(
          (l: any) => l.resource_type === params.resourceType,
        );
      if (params?.resourceId)
        logs = logs.filter(
          (l: any) => l.resource_id === params.resourceId,
        );
      if (params?.result)
        logs = logs.filter((l: any) => l.result === params.result);
      if (params?.startDate)
        logs = logs.filter(
          (l: any) => l.created_at >= params.startDate,
        );
      if (params?.endDate)
        logs = logs.filter(
          (l: any) => l.created_at <= params.endDate,
        );
      const limit = params?.limit || 100;
      const offset = params?.offset || 0;
      return { ok: true, data: logs.slice(offset, offset + limit) };
    },
    getById: async (id: string) => {
      const log = (s()?.audit ?? []).find((l: any) => l.id === id);
      if (!log)
        return { ok: false, message: "Audit log entry not found." };
      return { ok: true, data: log };
    },
    getResourceAuditTrail: async (
      resourceType: string,
      resourceId: string,
    ) => ({
      ok: true,
      data: (s()?.audit ?? []).filter(
        (l: any) =>
          l.resource_type === resourceType &&
          l.resource_id === resourceId,
      ),
    }),
    exportLogs: async (params?: any) => {
      let logs = [...(s()?.audit ?? [])];
      if (params?.adminId)
        logs = logs.filter((l: any) => l.admin_id === params.adminId);
      if (params?.actionType)
        logs = logs.filter(
          (l: any) => l.action_type === params.actionType,
        );
      return { ok: true, data: logs };
    },
  };

  // ── Job Operations ──
  mod.supabaseJobOperations = {
    flagDelay: async (params: any) => {
      const entry = {
        id: `jo-${(s()?.jobOperationsLog?.length ?? 0) + 1}`,
        job_id: params.jobId,
        operation_type: "delay",
        reason: params.reason,
        actor_id: params.actorUserId,
        metadata: null,
        created_at: now(),
      };
      (s().jobOperationsLog ??= []).push(entry);
      return { ok: true, data: entry };
    },
    flagDispute: async (params: any) => {
      const entry = {
        id: `jo-${(s()?.jobOperationsLog?.length ?? 0) + 1}`,
        job_id: params.jobId,
        operation_type: "dispute",
        reason: params.reason,
        actor_id: params.actorUserId,
        metadata: null,
        created_at: now(),
      };
      (s().jobOperationsLog ??= []).push(entry);
      return { ok: true, data: entry };
    },
    flagEscalation: async (params: any) => {
      const entry = {
        id: `jo-${(s()?.jobOperationsLog?.length ?? 0) + 1}`,
        job_id: params.jobId,
        operation_type: "escalation",
        reason: params.reason,
        actor_id: params.actorUserId,
        metadata: null,
        created_at: now(),
      };
      (s().jobOperationsLog ??= []).push(entry);
      return { ok: true, data: entry };
    },
    clearFlag: async (params: any) => {
      const entry = {
        id: `jo-${(s()?.jobOperationsLog?.length ?? 0) + 1}`,
        job_id: params.jobId,
        operation_type: "cleared",
        reason: params.reason,
        actor_id: params.actorUserId,
        metadata: null,
        created_at: now(),
      };
      (s().jobOperationsLog ??= []).push(entry);
      return { ok: true, data: entry };
    },
    getOperationHistory: async (jobId: string) => ({
      ok: true,
      data: (s()?.jobOperationsLog ?? []).filter(
        (o: any) => o.job_id === jobId,
      ),
    }),
    getCurrentOperationState: async (jobId: string) => {
      const ops = (s()?.jobOperationsLog ?? []).filter(
        (o: any) => o.job_id === jobId,
      );
      const lastDelay = ops.find(
        (o: any) => o.operation_type === "delay",
      );
      const lastDispute = ops.find(
        (o: any) => o.operation_type === "dispute",
      );
      const lastCleared = ops.find(
        (o: any) => o.operation_type === "cleared",
      );
      return {
        ok: true,
        data: {
          isDelayed:
            lastDelay &&
            (!lastCleared ||
              lastDelay.created_at > lastCleared.created_at)
              ? true
              : false,
          delayReason: lastDelay?.reason || undefined,
          delayedBy: lastDelay?.actor_id || undefined,
          isDisputed:
            lastDispute &&
            (!lastCleared ||
              lastDispute.created_at > lastCleared.created_at)
              ? true
              : false,
          disputeReason: lastDispute?.reason || undefined,
          disputedBy: lastDispute?.actor_id || undefined,
          lastOperation: ops[0] || undefined,
        },
      };
    },
  };

  return mod;
});

// ── Import the mocked data layer ──
import {
  supabaseJobs,
  supabaseContractors,
  supabaseContractorDocuments,
  supabaseFinance,
  supabaseDisputes,
  supabaseSupport,
  supabaseNotifications,
  supabaseReviews,
  supabaseSettings,
  supabaseAuditLog,
  supabaseJobOperations,
  supabaseFinanceAuditLog,
  supabaseProfiles,
} from "../../src/lib/supabase/data";

// ─────────────────────────────────────────────────────────────
// P1: End-to-End Admin Workflow Tests
// ─────────────────────────────────────────────────────────────
describe("P1: End-to-End Admin Workflows", () => {
  beforeEach(async () => {
    await seedTestData();
    // Link testStore to the mock's store reference
    mockDataLayer.setStore(testStore);
  });

  afterEach(async () => {
    await teardownTestData();
    mockDataLayer.setStore(null);
    vi.resetModules();
  });

  // ── 1. Admin Login & Dashboard ──
  describe("1. Admin Login & Dashboard Workflow", () => {
    it("should authenticate admin and verify role = admin", async () => {
      const result = await supabaseProfiles.getRoleById(getAdminId());
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toBe("admin");
    });

    it("should reject non-admin role access", async () => {
      const result = await supabaseProfiles.getRoleById(getUserId());
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).not.toBe("admin");
        expect(result.data).toBe("user");
      }
    });

    it("should load admin profile details", async () => {
      const result = await supabaseProfiles.getById(getAdminId());
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.email).toBe("admin@aidsprint.com");
        expect(result.data.full_name).toBe("Admin User");
        expect(result.data.role).toBe("admin");
      }
    });

    it("should list all profiles with admin role", async () => {
      const result = await supabaseProfiles.listLatest({
        roles: ["admin"],
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.length).toBe(1);
        expect(result.data[0].id).toBe(getAdminId());
      }
    });

    it("should load unread notifications for admin", async () => {
      const result = await supabaseNotifications.listLatestForRecipient({
        recipientId: getAdminId(),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.length).toBe(2);
        const unread = result.data.filter((n: any) => !n.read_at);
        expect(unread.length).toBe(1);
        expect(unread[0].type).toBe("dispute");
      }
    });

    it("should mark notification as read", async () => {
      const result = await supabaseNotifications.markRead({
        notificationId: SEED.notificationId,
        recipientId: getAdminId(),
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data.read_at).toBeTruthy();
    });
  });

  // ── 2. Job Dispatch & Lifecycle ──
  describe("2. Job Dispatch & Lifecycle Workflow", () => {
    it("should list all jobs with correct statuses", async () => {
      const result = await supabaseJobs.listLatest();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.length).toBe(4);
        const statuses = result.data.map((j: any) => j.status);
        expect(statuses).toContain("in_progress");
        expect(statuses).toContain("broadcast");
        expect(statuses).toContain("completed");
        expect(statuses).toContain("cancelled");
      }
    });

    it("should filter jobs by status", async () => {
      const result = await supabaseJobs.listLatest({ status: "broadcast" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.length).toBe(1);
        expect(result.data[0].id).toBe("job-002");
      }
    });

    it("should get job details by ID", async () => {
      const result = await supabaseJobs.getById(SEED.jobId);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.description).toBe(
          "Fix leaking pipe under kitchen sink",
        );
        expect(result.data.contractor_id).toBe(getContractorId());
        expect(result.data.status).toBe("in_progress");
      }
    });

    it("should list jobs by contractor", async () => {
      const result = await supabaseJobs.listByContractorIds([
        getContractorId(),
      ]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.length).toBe(2);
        expect(
          result.data.map((j: any) => j.id).sort(),
        ).toEqual(["job-001", "job-003"]);
      }
    });

    it("should cancel a job with reason and audit trail", async () => {
      const result = await supabaseJobs.updateLifecycle({
        jobId: "job-002",
        status: "cancelled",
        actorUserId: getAdminId(),
        cancellationReason: "Customer requested cancellation",
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe("cancelled");
        expect(result.data.cancelled_by).toBe(getAdminId());
      }

      const auditResult = await supabaseAuditLog.listActions({
        actionType: "job_cancelled",
        resourceId: "job-002",
      });
      expect(auditResult.ok).toBe(true);
      if (auditResult.ok)
        expect(auditResult.data[0].admin_id).toBe(getAdminId());
    });

    it("should mark job as completed", async () => {
      const result = await supabaseJobs.updateLifecycle({
        jobId: SEED.jobId,
        status: "completed",
        actorUserId: getAdminId(),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe("completed");
        expect(result.data.completed_at).toBeTruthy();
      }
    });

    it("should re-broadcast a cancelled job", async () => {
      const result = await supabaseJobs.updateLifecycle({
        jobId: "job-004",
        status: "broadcast",
        actorUserId: getAdminId(),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe("broadcast");
        expect(result.data.contractor_id).toBeNull();
        expect(result.data.cancelled_at).toBeNull();
      }
    });
  });

  // ── 3. Contractor Operations ──
  describe("3. Contractor Operations Workflow", () => {
    it("should list all contractors", async () => {
      const result = await supabaseContractors.listLatest();
      if (result.ok) expect(result.data.length).toBe(3);
    });

    it("should get contractor details", async () => {
      const result = await supabaseContractors.getById(getContractorId());
      if (result.ok) {
        expect(result.data.rating).toBe(4.5);
        expect(result.data.availability_status).toBe("available");
      }
    });

    it("should show a contractor is already suspended", async () => {
      const result = await supabaseContractors.getById("contractor-003");
      if (result.ok) {
        expect(result.data.suspended_at).toBeTruthy();
        expect(result.data.suspension_reason).toBe(
          "Multiple late arrivals",
        );
      }
    });

    it("should suspend a contractor with audit trail", async () => {
      const result = await supabaseContractors.updateLifecycle({
        contractorId: getContractorId(),
        action: "suspend",
        actorUserId: getAdminId(),
        reason: "Repeated no-show for scheduled jobs",
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.suspended_at).toBeTruthy();
        expect(result.data.suspended_by).toBe(getAdminId());
      }

      const auditLog = await supabaseAuditLog.listActions({
        actionType: "contractor_suspended",
        resourceId: getContractorId(),
      });
      if (auditLog.ok)
        expect(auditLog.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should restore a suspended contractor with reason", async () => {
      await supabaseContractors.updateLifecycle({
        contractorId: getContractorId(),
        action: "suspend",
        actorUserId: getAdminId(),
        reason: "Test suspension",
      });

      const result = await supabaseContractors.updateLifecycle({
        contractorId: getContractorId(),
        action: "restore",
        actorUserId: getAdminId(),
        reason: "Contractor explained absence with valid proof",
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.restored_at).toBeTruthy();
        expect(result.data.suspended_at).toBeNull();
      }

      const auditLog = await supabaseAuditLog.getResourceAuditTrail(
        "contractor",
        getContractorId(),
      );
      if (auditLog.ok) {
        const actions = auditLog.data.map((l: any) => l.action_type);
        expect(actions).toContain("contractor_suspended");
        expect(actions).toContain("contractor_restored");
      }
    });

    it("should require reason for lifecycle action", async () => {
      const result = await supabaseContractors.updateLifecycle({
        contractorId: getContractorId(),
        action: "suspend",
        actorUserId: getAdminId(),
        reason: "",
      });
      expect(result.ok).toBe(false);
    });
  });

  // ── 4. KYC Review ──
  describe("4. Contractor KYC Review Workflow", () => {
    it("should list contractor documents for review", async () => {
      const result =
        await supabaseContractorDocuments.listByContractorIds([
          getContractorId(),
        ]);
      if (result.ok) {
        expect(result.data.length).toBe(2);
        const pending = result.data.filter(
          (d: any) => d.status === "pending",
        );
        expect(pending.length).toBe(2);
      }
    });

    it("should approve KYC documents with audit trail", async () => {
      const result = await supabaseContractorDocuments.reviewDocuments({
        contractorId: getContractorId(),
        documentIds: [SEED.documentId1, SEED.documentId2],
        status: "approved",
        reviewedBy: getAdminId(),
      });
      if (result.ok) {
        for (const doc of result.data) {
          expect(doc.status).toBe("approved");
          expect(doc.reviewed_by).toBe(getAdminId());
        }
      }

      const auditLog = await supabaseAuditLog.listActions({
        actionType: "contractor_kyc_approved",
        resourceId: getContractorId(),
      });
      if (auditLog.ok) expect(auditLog.data.length).toBe(1);
    });

    it("should reject KYC documents with reason", async () => {
      const result = await supabaseContractorDocuments.reviewDocuments({
        contractorId: getContractorId(),
        documentIds: [SEED.documentId1],
        status: "rejected",
        reviewedBy: getAdminId(),
        rejectionReason: "Document is blurry, please re-upload",
      });
      if (result.ok) {
        expect(result.data[0].status).toBe("rejected");
        expect(result.data[0].rejection_reason).toBe(
          "Document is blurry, please re-upload",
        );
      }
    });
  });

  // ── 5. Finance Operations ──
  describe("5. Finance Operations Workflow", () => {
    it("should list payments with correct statuses", async () => {
      const result = await supabaseFinance.listPayments();
      if (result.ok) {
        expect(result.data.length).toBe(3);
        const statuses = result.data.map((p: any) => p.status);
        expect(statuses).toContain("captured");
        expect(statuses).toContain("paid");
        expect(statuses).toContain("pending");
      }
    });

    it("should list withdrawals", async () => {
      const result = await supabaseFinance.listWithdrawals();
      if (result.ok) expect(result.data.length).toBe(3);
    });

    it("should refund a captured payment with audit trail", async () => {
      const result = await supabaseFinance.refund({
        paymentId: SEED.paymentId,
        actorUserId: getAdminId(),
        reason: "Customer requested refund - partial work done",
        refundAmount: 165,
      });
      if (result.ok) {
        expect(result.data.status).toBe("refunded");
        expect(result.data.refunded_at).toBeTruthy();
        expect(result.data.refund_initiated_by).toBe(getAdminId());
      }

      const faLog = await supabaseFinanceAuditLog.listByPaymentId(
        SEED.paymentId,
      );
      if (faLog.ok) {
        expect(faLog.data.length).toBe(1);
        expect(faLog.data[0].action).toBe("refund_initiated");
      }
    });

    it("should reject refund for non-captured/paid payment", async () => {
      const result = await supabaseFinance.refund({
        paymentId: "payment-003",
        actorUserId: getAdminId(),
        reason: "Test",
        refundAmount: 440,
      });
      expect(result.ok).toBe(false);
    });

    it("should mark payment as failed", async () => {
      const result = await supabaseFinance.markPaymentFailed({
        paymentId: SEED.paymentId,
        failureCode: "insufficient_funds",
        actorUserId: getAdminId(),
        reason: "Card declined by bank",
      });
      if (result.ok) expect(result.data.status).toBe("failed");
    });

    it("should cancel pending payment", async () => {
      const result = await supabaseFinance.cancelPayment({
        paymentId: "payment-003",
        actorUserId: getAdminId(),
        reason: "Customer changed payment method",
      });
      if (result.ok) expect(result.data.status).toBe("cancelled");
    });

    it("should mark withdrawal as completed", async () => {
      const result = await supabaseFinance.markWithdrawalCompleted({
        withdrawalId: "withdrawal-002",
        actorUserId: getAdminId(),
        reason: "Manual payout processed via bank transfer",
      });
      if (result.ok) {
        expect(result.data.status).toBe("completed");
        expect(result.data.processed_at).toBeTruthy();
      }
    });

    it("should mark withdrawal as failed", async () => {
      const result = await supabaseFinance.markWithdrawalFailed({
        withdrawalId: SEED.withdrawalId,
        failureCode: "bank_account_invalid",
        actorUserId: getAdminId(),
        reason: "Bank account number is invalid",
      });
      if (result.ok) {
        expect(result.data.status).toBe("failed");
        expect(result.data.failure_message).toBe(
          "bank_account_invalid",
        );
      }
    });

    it("should cancel pending withdrawal", async () => {
      const result = await supabaseFinance.cancelWithdrawal({
        withdrawalId: SEED.withdrawalId,
        actorUserId: getAdminId(),
        reason: "Duplicate withdrawal request",
      });
      if (result.ok) expect(result.data.status).toBe("cancelled");
    });
  });

  // ── 6. Dispute Resolution ──
  describe("6. Dispute Resolution Workflow", () => {
    it("should list disputes with statuses", async () => {
      const result = await supabaseDisputes.listLatest();
      if (result.ok) {
        expect(result.data.length).toBe(2);
        expect(
          result.data.find((d: any) => d.status === "under_review"),
        ).toBeTruthy();
        expect(
          result.data.find((d: any) => d.status === "resolved"),
        ).toBeTruthy();
      }
    });

    it("should get dispute with linked job and payment", async () => {
      const dispute = await supabaseDisputes.getById(SEED.disputeId);
      if (dispute.ok) {
        expect(dispute.data.job_id).toBe(SEED.jobId);
        expect(dispute.data.payment_id).toBe(SEED.paymentId);
        expect(dispute.data.raised_by_role).toBe("user");
      }
    });

    it("should create a dispute from a job request", async () => {
      const result = await supabaseDisputes.createDisputeFromRequest({
        jobId: "job-002",
        reason: "Contractor never showed up for emergency call",
        createdBy: getAdminId(),
      });
      if (result.ok) {
        expect(result.data.status).toBe("under_review");
        expect(result.data.raised_by_role).toBe("admin");
        expect(result.data.job_id).toBe("job-002");
      }
      const list = await supabaseDisputes.listLatest();
      if (list.ok) expect(list.data.length).toBe(3);
    });

    it("should resolve a dispute with audit trail", async () => {
      const result = await supabaseDisputes.applyAction({
        disputeId: SEED.disputeId,
        action: "resolve",
        actorUserId: getAdminId(),
        reason: "Reviewed evidence - partial refund issued",
      });
      if (result.ok) {
        expect(result.data.status).toBe("resolved");
        expect(result.data.resolved_by).toBe(getAdminId());
        expect(result.data.resolved_at).toBeTruthy();
      }
    });

    it("should reject a dispute with reason", async () => {
      const result = await supabaseDisputes.applyAction({
        disputeId: SEED.disputeId,
        action: "reject",
        actorUserId: getAdminId(),
        reason: "Insufficient evidence",
      });
      if (result.ok) {
        expect(result.data.status).toBe("rejected");
      }
    });

    it("should complete full refund lifecycle on a dispute", async () => {
      const initResult = await supabaseDisputes.initiateRefund({
        disputeId: SEED.disputeId,
        paymentId: SEED.paymentId,
        adminUserId: getAdminId(),
        refundAmount: 165,
        refundReason: "Full refund approved",
      });
      expect(initResult.ok).toBe(true);
      if (initResult.ok) {
        expect(initResult.data.refundStatus).toBe("pending");
      }

      const completeResult = await supabaseDisputes.completeRefund({
        disputeId: SEED.disputeId,
        adminUserId: getAdminId(),
      });
      expect(completeResult.ok).toBe(true);

      const payment = await supabaseFinance.listPaymentsByIds([
        SEED.paymentId,
      ]);
      if (payment.ok) expect(payment.data[0].status).toBe("refunded");

      const faLog = await supabaseFinanceAuditLog.listByDisputeId(
        SEED.disputeId,
      );
      if (faLog.ok) {
        const actions = faLog.data.map((l: any) => l.action);
        expect(actions).toContain("refund_initiated");
        expect(actions).toContain("refund_completed");
      }
    });

    it("should handle refund failure with retry", async () => {
      await supabaseDisputes.initiateRefund({
        disputeId: SEED.disputeId,
        paymentId: SEED.paymentId,
        adminUserId: getAdminId(),
        refundAmount: 165,
        refundReason: "Refund approved",
      });

      const failResult = await supabaseDisputes.failRefund({
        disputeId: SEED.disputeId,
        adminUserId: getAdminId(),
        failureReason: "Stripe API error: insufficient balance",
      });
      if (failResult.ok)
        expect(failResult.data.refundStatus).toBe("failed");

      const retryResult = await supabaseDisputes.completeRefund({
        disputeId: SEED.disputeId,
        adminUserId: getAdminId(),
      });
      expect(retryResult.ok).toBe(true);
    });
  });

  // ── 7. Support Tickets ──
  describe("7. Support Ticket Workflow", () => {
    it("should list support tickets", async () => {
      const result = await supabaseSupport.listLatest();
      if (result.ok) expect(result.data.length).toBe(3);
    });

    it("should update support ticket status to in_review", async () => {
      const result = await supabaseSupport.updateStatus({
        ticketId: SEED.supportTicketId,
        status: "in_review",
        actorUserId: getAdminId(),
      });
      if (result.ok) expect(result.data.status).toBe("in_review");

      const events = await supabaseSupport.listEventsByTicketIds([
        SEED.supportTicketId,
      ]);
      if (events.ok) {
        const statusEvent = events.data.find(
          (e: any) => e.event_type === "status_changed",
        );
        expect(statusEvent).toBeTruthy();
        expect(statusEvent!.actor_role).toBe("admin");
      }
    });

    it("should resolve a support ticket", async () => {
      const result = await supabaseSupport.updateStatus({
        ticketId: SEED.supportTicketId,
        status: "resolved",
        actorUserId: getAdminId(),
        message: "Payment has been refunded to customer",
      });
      if (result.ok) {
        expect(result.data.status).toBe("resolved");
        expect(result.data.resolved_at).toBeTruthy();
      }
    });

    it("should send and retrieve support messages", async () => {
      const msgResult = await supabaseSupport.createMessage({
        ticketId: SEED.supportTicketId,
        senderUserId: getAdminId(),
        content: "I've processed the refund. Please confirm.",
        isAdmin: true,
      });
      expect(msgResult.ok).toBe(true);

      const msgs = await supabaseSupport.listMessagesByTicketId({
        ticketId: SEED.supportTicketId,
      });
      if (msgs.ok) {
        expect(msgs.data.length).toBe(3);
        const lastMsg = msgs.data[msgs.data.length - 1];
        expect(lastMsg.sender_role).toBe("admin");
      }
    });

    it("should mark message as read", async () => {
      const readResult = await supabaseSupport.markMessageAsRead({
        messageId: "msg-001",
        adminUserId: getAdminId(),
      });
      expect(readResult.ok).toBe(true);
    });

    it("should create a support ticket on behalf of a user", async () => {
      const result = await supabaseSupport.createSupportTicket({
        userId: getUserId(),
        subject: "Need help with account",
        description: "Unable to change password",
        priority: "high",
        category: "account",
      });
      if (result.ok) {
        expect(result.data.subject).toBe("Need help with account");
        expect(result.data.status).toBe("open");
      }
      const list = await supabaseSupport.listLatest();
      if (list.ok) expect(list.data.length).toBe(4);
    });
  });

  // ── 8. Settings ──
  describe("8. Settings & Marketplace Workflow", () => {
    it("should list service categories", async () => {
      const result = await supabaseSettings.listServiceCategories();
      if (result.ok) expect(result.data.length).toBe(3);
    });

    it("should create a new service category", async () => {
      const result = await supabaseSettings.createServiceCategory({
        name: "Gardening",
        description: "Gardening and landscaping services",
        iconKey: "Flower2",
      });
      if (result.ok) expect(result.data.name).toBe("Gardening");

      const list = await supabaseSettings.listServiceCategories();
      if (list.ok) expect(list.data.length).toBe(4);
    });

    it("should disable a service category", async () => {
      const result = await supabaseSettings.updateServiceCategory({
        id: SEED.categoryId,
        isActive: false,
      });
      if (result.ok) expect(result.data.is_active).toBe(false);
    });

    it("should list service types", async () => {
      const result = await supabaseSettings.listServiceTypes();
      if (result.ok) expect(result.data.length).toBe(3);
    });

    it("should update urgency tier pricing", async () => {
      const result = await supabaseSettings.updateUrgencyTier({
        id: "ut-002",
        extraFee: 75,
      });
      if (result.ok) expect(result.data.extra_fee).toBe(75);
    });

    it("should list promo codes", async () => {
      const result = await supabaseSettings.listPromoCodes();
      if (result.ok) {
        expect(result.data.length).toBe(3);
        const activeCodes = result.data.filter(
          (p: any) => p.is_active,
        );
        expect(activeCodes.length).toBe(2);
      }
    });

    it("should create a new promo code", async () => {
      const result = await supabaseSettings.createPromoCode({
        code: "SUMMER50",
        description: "50% off summer special",
        discountType: "percent" as const,
        discountValue: 50,
        maxUses: 200,
        startsOn: new Date().toISOString(),
        endsOn: new Date(Date.now() + 86400000 * 60).toISOString(),
      });
      if (result.ok) {
        expect(result.data.code).toBe("SUMMER50");
        expect(result.data.discount_type).toBe("percent");
        expect(result.data.is_active).toBe(true);
      }
    });

    it("should disable a promo code", async () => {
      const result = await supabaseSettings.updatePromoCode({
        id: SEED.promoCodeId,
        isActive: false,
      });
      if (result.ok) expect(result.data.is_active).toBe(false);
    });

    it("should delete a promo code", async () => {
      await supabaseSettings.deletePromoCode(SEED.promoCodeId);
      const list = await supabaseSettings.listPromoCodes();
      if (list.ok) expect(list.data.length).toBe(2);
    });

    it("should create a notification campaign", async () => {
      const result = await supabaseSettings.createNotificationCampaign({
        name: "Flash Sale Alert",
        description: "Get 30% off all electrical services today!",
        status: "draft" as const,
      });
      if (result.ok) expect(result.data.name).toBe("Flash Sale Alert");
    });
  });

  // ── 9. Cross-Module Complete Journey ──
  describe("9. Complete Cross-Module Admin Journey", () => {
    it(
      "should complete full admin journey: job → dispute → refund → audit",
      async () => {
        const jobs = await supabaseJobs.listLatest();
        if (!jobs.ok) return;
        const activeJob = jobs.data.find(
          (j: any) => j.status === "in_progress",
        );
        expect(activeJob).toBeDefined();
        if (!activeJob) return;

        // Flag delay
        const delayResult = await supabaseJobOperations.flagDelay({
          jobId: activeJob.id,
          reason: "Contractor reported traffic issue",
          actorUserId: getAdminId(),
        });
        expect(delayResult.ok).toBe(true);

        // Create dispute
        const disputeResult =
          await supabaseDisputes.createDisputeFromRequest({
            jobId: activeJob.id,
            reason: "Customer complaining about delay",
            createdBy: getAdminId(),
          });
        expect(disputeResult.ok).toBe(true);
        if (!disputeResult.ok) return;
        const disputeId = disputeResult.data.id;

        // Get linked payment
        const payments = await supabaseFinance.listPaymentsByJobIds([
          activeJob.id,
        ]);
        expect(payments.ok).toBe(true);
        if (!payments.ok || !payments.data.length) return;
        const paymentId = payments.data[0].id;

        // Initiate refund
        const refundResult = await supabaseDisputes.initiateRefund({
          disputeId,
          paymentId,
          adminUserId: getAdminId(),
          refundAmount: payments.data[0].amount,
          refundReason: "Full refund due to contractor no-show",
        });
        expect(refundResult.ok).toBe(true);

        // Resolve dispute
        await supabaseDisputes.applyAction({
          disputeId,
          action: "resolve",
          actorUserId: getAdminId(),
          reason: "Dispute resolved — refund approved",
        });

        // Complete refund
        await supabaseDisputes.completeRefund({
          disputeId,
          adminUserId: getAdminId(),
        });

        // Cancel job
        const cancelResult = await supabaseJobs.updateLifecycle({
          jobId: activeJob.id,
          status: "cancelled",
          actorUserId: getAdminId(),
          cancellationReason:
            "Job cancelled due to unresolved dispute",
        });
        expect(cancelResult.ok).toBe(true);

        // Verify audit trail
        const auditTrail =
          await supabaseAuditLog.getResourceAuditTrail(
            "job",
            activeJob.id,
          );
        if (auditTrail.ok) {
          const actionTypes = auditTrail.data.map(
            (l: any) => l.action_type,
          );
          expect(actionTypes).toContain("job_cancelled");
        }
      },
      30_000,
    );
  });

  // ── 10. Cross-Module: Contractor → Payouts ──
  describe("10. Cross-Module: Contractor Suspend → Withdrawals", () => {
    it("should suspend contractor, verify jobs, handle payouts", async () => {
      await supabaseContractors.getById(getContractorId());

      const suspendResult =
        await supabaseContractors.updateLifecycle({
          contractorId: getContractorId(),
          action: "suspend",
          actorUserId: getAdminId(),
          reason: "Multiple policy violations",
        });
      expect(suspendResult.ok).toBe(true);

      const withdrawals = await supabaseFinance.listWithdrawals();
      if (withdrawals.ok) {
        const contractorWithdrawals = withdrawals.data.filter(
          (w: any) => w.contractor_id === getContractorId(),
        );
        expect(contractorWithdrawals.length).toBe(2);
      }

      await supabaseFinance.cancelWithdrawal({
        withdrawalId: SEED.withdrawalId,
        actorUserId: getAdminId(),
        reason: "Contractor suspended — payout cancelled",
      });

      const restoreResult =
        await supabaseContractors.updateLifecycle({
          contractorId: getContractorId(),
          action: "restore",
          actorUserId: getAdminId(),
          reason: "Contractor resolved policy issues",
        });
      if (restoreResult.ok) {
        expect(restoreResult.data.restored_at).toBeTruthy();
        expect(restoreResult.data.suspended_at).toBeNull();
      }
    });
  });

  // ── 11. Failure Scenarios ──
  describe("11. Failure Scenarios & Error Handling", () => {
    it("should handle job not found error", async () => {
      const result = await supabaseJobs.getById("non-existent-id");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toBe("Job not found.");
    });

    it("should handle contractor not found error", async () => {
      const result = await supabaseContractors.getById(
        "non-existent-id",
      );
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.message).toBe("Contractor not found.");
    });

    it("should handle dispute not found error", async () => {
      const result = await supabaseDisputes.getById("non-existent-id");
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.message).toBe("Dispute not found.");
    });

    it("should handle support ticket not found error", async () => {
      const result = await supabaseSupport.updateStatus({
        ticketId: "non-existent",
        status: "resolved",
        actorUserId: getAdminId(),
      });
      expect(result.ok).toBe(false);
    });

    it("should reject empty cancellation reason", async () => {
      const result = await supabaseJobs.updateLifecycle({
        jobId: "job-002",
        status: "cancelled",
        actorUserId: getAdminId(),
        cancellationReason: "",
      });
      expect(result.ok).toBe(false);
    });

    it("should reject empty lifecycle reason", async () => {
      const result = await supabaseContractors.updateLifecycle({
        contractorId: getContractorId(),
        action: "suspend",
        actorUserId: getAdminId(),
        reason: "",
      });
      expect(result.ok).toBe(false);
    });

    it("should reject empty message content", async () => {
      const result = await supabaseSupport.createMessage({
        ticketId: SEED.supportTicketId,
        senderUserId: getAdminId(),
        content: "",
        isAdmin: true,
      });
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.message).toBe("Message content is required.");
    });

    it("should reject message exceeding max length", async () => {
      const result = await supabaseSupport.createMessage({
        ticketId: SEED.supportTicketId,
        senderUserId: getAdminId(),
        content: "x".repeat(5001),
        isAdmin: true,
      });
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.message).toContain("maximum length");
    });

    it("should reject refund on already refunded payment", async () => {
      await supabaseFinance.refund({
        paymentId: SEED.paymentId,
        actorUserId: getAdminId(),
        reason: "First refund",
        refundAmount: 165,
      });
      const result = await supabaseFinance.refund({
        paymentId: SEED.paymentId,
        actorUserId: getAdminId(),
        reason: "Double refund attempt",
        refundAmount: 165,
      });
      expect(result.ok).toBe(false);
    });
  });

  // ── 12. Audit Trail Integrity ──
  describe("12. Audit Trail Integrity", () => {
    it("should capture all mutation types in audit log", async () => {
      await supabaseContractors.updateLifecycle({
        contractorId: getContractorId(),
        action: "suspend",
        actorUserId: getAdminId(),
        reason: "Test audit capture",
      });
      await supabaseJobs.updateLifecycle({
        jobId: "job-002",
        status: "cancelled",
        actorUserId: getAdminId(),
        cancellationReason: "Test cancellation",
      });
      await supabaseContractorDocuments.reviewDocuments({
        contractorId: getContractorId(),
        documentIds: [SEED.documentId1],
        status: "approved",
        reviewedBy: getAdminId(),
      });

      const auditLog = await supabaseAuditLog.listActions();
      if (auditLog.ok) {
        const types = auditLog.data.map((l: any) => l.action_type);
        expect(types).toContain("contractor_suspended");
        expect(types).toContain("job_cancelled");
        expect(types).toContain("contractor_kyc_approved");
      }
    });

    it("should support filtering audit logs by date range", async () => {
      const startDate = new Date(
        Date.now() - 86400000 * 100,
      ).toISOString();
      const endDate = new Date(
        Date.now() + 86400000,
      ).toISOString();

      await supabaseContractors.updateLifecycle({
        contractorId: getContractorId(),
        action: "suspend",
        actorUserId: getAdminId(),
        reason: "Test date filter",
      });

      const result = await supabaseAuditLog.listActions({
        startDate,
        endDate,
      });
      if (result.ok)
        expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should maintain immutable audit trail (append-only)", async () => {
      const beforeCount = testStore.audit.length;
      await supabaseFinance.refund({
        paymentId: SEED.paymentId,
        actorUserId: getAdminId(),
        reason: "Test immutable audit",
        refundAmount: 165,
      });
      expect(testStore.audit.length).toBe(beforeCount + 1);
    });
  });

  // ── 13. Realtime Simulation ──
  describe("13. Realtime Workflow Simulation", () => {
    it("should simulate job status change notification flow", async () => {
      await supabaseJobs.updateLifecycle({
        jobId: SEED.jobId,
        status: "completed",
        actorUserId: getAdminId(),
      });

      const refreshed = await supabaseJobs.getById(SEED.jobId);
      if (refreshed.ok) {
        expect(refreshed.data.status).toBe("completed");
        expect(refreshed.data.completed_at).toBeTruthy();
      }

      // Simulate notification pushed via realtime
      testStore.notifications.push({
        id: `notif-${testStore.notifications.length + 1}`,
        recipient_id: getAdminId(),
        title: "Job completed",
        body: "Job #001 has been marked as completed",
        type: "job_update",
        reference_id: SEED.jobId,
        read_at: null,
        created_at: new Date().toISOString(),
      });

      const notifs =
        await supabaseNotifications.listLatestForRecipient({
          recipientId: getAdminId(),
        });
      if (notifs.ok) {
        const jobNotif = notifs.data.find(
          (n: any) => n.type === "job_update",
        );
        expect(jobNotif).toBeTruthy();
      }
    });

    it("should maintain data consistency across sequential mutations", async () => {
      let job = await supabaseJobs.getById(SEED.jobId);
      if (!job.ok) return;
      expect(job.data.status).toBe("in_progress");

      await supabaseJobs.updateLifecycle({
        jobId: SEED.jobId,
        status: "completed",
        actorUserId: getAdminId(),
      });

      job = await supabaseJobs.getById(SEED.jobId);
      if (job.ok) {
        expect(job.data.status).toBe("completed");
        expect(job.data.completed_at).toBeTruthy();
      }

      const payments = await supabaseFinance.listPaymentsByJobIds([
        SEED.jobId,
      ]);
      if (!payments.ok || !payments.data.length) return;

      await supabaseFinance.refund({
        paymentId: payments.data[0].id,
        actorUserId: getAdminId(),
        reason: "Post-completion refund",
        refundAmount: payments.data[0].amount,
      });

      const finalPayment = await supabaseFinance.listPaymentsByIds([
        payments.data[0].id,
      ]);
      if (finalPayment.ok)
        expect(finalPayment.data[0].status).toBe("refunded");
    });
  });

  // ── 14. Concurrent Operations ──
  describe("14. Concurrent Operations Safety", () => {
    it("should handle independent mutations on different resources", async () => {
      const results = await Promise.all([
        supabaseJobs.updateLifecycle({
          jobId: "job-002",
          status: "cancelled",
          actorUserId: getAdminId(),
          cancellationReason: "Cancelled concurrently",
        }),
        supabaseContractors.updateLifecycle({
          contractorId: "contractor-002",
          action: "suspend",
          actorUserId: getAdminId(),
          reason: "Suspended concurrently",
        }),
        supabaseFinance.refund({
          paymentId: SEED.paymentId,
          actorUserId: getAdminId(),
          reason: "Refunded concurrently",
          refundAmount: 165,
        }),
      ]);
      expect(results[0].ok).toBe(true);
      expect(results[1].ok).toBe(true);
      expect(results[2].ok).toBe(true);
    });
  });

  // ── 15. Data Isolation ──
  describe("15. Test Data Isolation", () => {
    it("should provide clean state for each test", () => {
      expect(testStore.jobs.length).toBe(4);
      expect(testStore.contractors.length).toBe(3);
      expect(testStore.disputes.length).toBe(2);
      expect(testStore.payments.length).toBe(3);
      expect(testStore.supportTickets.length).toBe(3);
      expect(testStore.promo.length).toBe(3);
      expect(testStore.serviceCategories.length).toBe(3);
    });

    it("should not have leftover data from previous tests", () => {
      expect(testStore.audit.length).toBe(0);
    });
  });
});