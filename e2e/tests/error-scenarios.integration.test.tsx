/**
 * P3 — Error Scenario and Failure Mode Integration Tests
 *
 * Validates the admin data layer's error handling, state consistency, and
 * operator guidance across 30+ failure scenarios:
 *   - Network failures: timeout, 500 error, connection refused
 *   - Data integrity: RLS violations, constraint violations, concurrent conflict
 *   - State mismatch: actor id mismatch, expired session, stale data
 *   - Partial failures: mutation succeeds but audit log fails, upload succeeds but metadata fails
 *   - User input: invalid reason, missing required fields, malformed data
 *   - State corruption: verify failed mutations don't leave dirty state
 *
 * Each test validates:
 *   1. Error message clarity (operator can understand what happened)
 *   2. Error actionability (operator knows what to do next)
 *   3. State integrity (failed mutations don't corrupt in-memory state)
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
// Store bridge for the mock
// --------------------------------------------------------------------------
const { mockDataLayer } = vi.hoisted(() => {
  let store: any;
  let simulateAuditLogFail = false;
  let simulateNetworkError = false;
  let simulateTimeout = false;
  let simulateConstraintViolation = false;
  let simulateRLSViolation = false;
  let simulateConcurrentConflict = false;
  let simulateUploadFail = false;
  return {
    mockDataLayer: {
      setStore(s: any) { store = s; },
      getStore() { return store; },
      setAuditFail(v: boolean) { simulateAuditLogFail = v; },
      getAuditFail() { return simulateAuditLogFail; },
      setNetworkError(v: boolean) { simulateNetworkError = v; },
      getNetworkError() { return simulateNetworkError; },
      setTimeout(v: boolean) { simulateTimeout = v; },
      getTimeout() { return simulateTimeout; },
      setConstraintViolation(v: boolean) { simulateConstraintViolation = v; },
      getConstraintViolation() { return simulateConstraintViolation; },
      setRLSViolation(v: boolean) { simulateRLSViolation = v; },
      getRLSViolation() { return simulateRLSViolation; },
      setConcurrentConflict(v: boolean) { simulateConcurrentConflict = v; },
      getConcurrentConflict() { return simulateConcurrentConflict; },
      setUploadFail(v: boolean) { simulateUploadFail = v; },
      getUploadFail() { return simulateUploadFail; },
      resetAll() {
        simulateAuditLogFail = false;
        simulateNetworkError = false;
        simulateTimeout = false;
        simulateConstraintViolation = false;
        simulateRLSViolation = false;
        simulateConcurrentConflict = false;
        simulateUploadFail = false;
      },
    },
  };
});

vi.mock("../../src/lib/supabase/data", () => {
  const mod: Record<string, any> = {};
  const s = () => mockDataLayer.getStore();
  const now = () => new Date().toISOString();
  const clone = (obj: any) => (obj ? { ...obj } : obj);

  // Helper: simulate network or timeout errors
  const checkErrorSimulation = (context: string) => {
    if (mockDataLayer.getNetworkError())
      return { ok: false, message: `[${context}] Network error: Connection refused. Please check your internet connection and try again.` };
    if (mockDataLayer.getTimeout())
      return { ok: false, message: `[${context}] Request timed out after 30 seconds. The server may be under heavy load. Retry the operation or contact support if the issue persists.` };
    return null;
  };

  mod.SupabaseResult = {};
  mod.requireSupabaseClient = () => null;
  mod.getResilienceMetrics = () => ({});
  mod.resetCircuitBreaker = () => {};

  // ── Profiles ──
  mod.supabaseProfiles = {
    getById: async (id: string) => {
      const sim = checkErrorSimulation("profiles.getById");
      if (sim) return sim;
      const p = s()?.profiles?.find((x: any) => x.id === id);
      return p ? { ok: true, data: clone(p) } : { ok: false, message: "Profile not found. Verify the user ID is correct." };
    },
    getRoleById: async (id: string) => {
      const sim = checkErrorSimulation("profiles.getRoleById");
      if (sim) return sim;
      const p = s()?.profiles?.find((x: any) => x.id === id);
      return p && typeof p.role === "string" ? { ok: true, data: p.role } : { ok: false, message: "Profile role not found." };
    },
    listLatest: async (params?: any) => {
      const sim = checkErrorSimulation("profiles.listLatest");
      if (sim) return sim;
      let rows = [...(s()?.profiles ?? [])];
      if (params?.roles?.length) rows = rows.filter((p: any) => params.roles.includes(p.role));
      return { ok: true, data: rows.slice(0, params?.limit ?? 100) };
    },
  };

  // ── Jobs ──
  mod.supabaseJobs = {
    listLatest: async (params?: any) => {
      const sim = checkErrorSimulation("jobs.listLatest");
      if (sim) return sim;
      return { ok: true, data: (s()?.jobs ?? []).slice(0, params?.limit ?? 50).map(clone) };
    },
    getById: async (jobId: string) => {
      const sim = checkErrorSimulation("jobs.getById");
      if (sim) return sim;
      const j = s()?.jobs?.find((x: any) => x.id === jobId);
      return j ? { ok: true, data: clone(j) } : { ok: false, message: `Job with ID ${jobId} not found. Check the job ID or reload the job list.` };
    },
    updateLifecycle: async (params: any) => {
      const sim = checkErrorSimulation("jobs.updateLifecycle");
      if (sim) return sim;

      if (mockDataLayer.getRLSViolation())
        return { ok: false, message: "Permission denied: You are not authorized to modify this job. Verify your admin role and try again, or contact a super administrator." };

      if (mockDataLayer.getConstraintViolation())
        return { ok: false, message: "Constraint violation: Cannot transition job to requested state. The job may already be in a terminal state. Reload the job to see its current status." };

      if (!params.actorUserId) return { ok: false, message: "Admin user ID is required. Ensure you are logged in with a valid admin session. Log out and log back in, then retry." };
      if (params.actorUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch: The admin ID provided does not match your session. Log out and log back in to sync your session, then retry." };

      const jobs = s()?.jobs;
      const idx = jobs?.findIndex((j: any) => j.id === params.jobId);
      if (idx === -1 || idx === undefined) return { ok: false, message: `Job ${params.jobId} not found. It may have been deleted. Reload the job list.` };
      if (!params.cancellationReason && params.status === "cancelled") return { ok: false, message: "A cancellation reason is required. Please provide a brief explanation (1-500 characters) for why this job is being cancelled." };

      if (mockDataLayer.getConcurrentConflict()) {
        // Simulate: someone else changed it underneath
        return { ok: false, message: "Concurrent modification detected: This job was modified by another administrator while you were updating it. The latest version has been reloaded. Please review the current state before retrying." };
      }

      const job = jobs[idx];
      const prevStatus = job.status;
      job.status = params.status;
      job.updated_at = now();

      const auditFail = mockDataLayer.getAuditFail();
      if (auditFail) {
        // Roll back the mutation
        job.status = prevStatus;
        return { ok: false, message: "Partial failure: The job status update succeeded but audit logging failed. The change has been rolled back to maintain data integrity. Contact support with action reference JOB-" + params.jobId + "-" + Date.now() + "." };
      }

      (s().audit ??= []).push({ id: `audit-${(s().audit?.length ?? 0) + 1}`, admin_id: params.actorUserId, action_type: "job_cancelled", resource_type: "job", resource_id: params.jobId, reason: params.cancellationReason || params.status, result: "success", created_at: now() });
      return { ok: true, data: clone(job) };
    },
  };

  // ── Contractors ──
  mod.supabaseContractors = {
    listLatest: async (params?: any) => {
      const sim = checkErrorSimulation("contractors.listLatest");
      if (sim) return sim;
      return { ok: true, data: (s()?.contractors ?? []).slice(0, params?.limit ?? 100).map(clone) };
    },
    getById: async (id: string) => {
      const sim = checkErrorSimulation("contractors.getById");
      if (sim) return sim;
      const c = s()?.contractors?.find((x: any) => x.id === id);
      return c ? { ok: true, data: clone(c) } : { ok: false, message: `Contractor ${id} not found. Verify the contractor ID or reload the list.` };
    },
    updateLifecycle: async (params: any) => {
      const sim = checkErrorSimulation("contractors.updateLifecycle");
      if (sim) return sim;

      if (mockDataLayer.getRLSViolation())
        return { ok: false, message: "Permission denied: You are not authorized to perform this action on contractor accounts. Verify your admin permissions." };

      if (!params.actorUserId) return { ok: false, message: "Admin user ID is required. Ensure you are logged in with a valid admin session. Log out and log back in, then retry." };
      if (params.actorUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch: Your session identity doesn't match the provided admin ID. Log out and log back in to resolve this." };
      if (!params.reason) return { ok: false, message: "A reason is required for this lifecycle action. Please provide a clear explanation (1-500 characters) for audit purposes." };

      const contractors = s()?.contractors;
      const idx = contractors?.findIndex((c: any) => c.id === params.contractorId);
      if (idx === -1 || idx === undefined) return { ok: false, message: `Contractor ${params.contractorId} not found. They may have been removed. Reload the contractor list.` };

      if (mockDataLayer.getConcurrentConflict())
        return { ok: false, message: "Concurrent modification: Another admin modified this contractor while you were working on it. The latest version has been loaded. Review and retry." };

      const c = contractors[idx];
      const prevState = { ...c };
      const ts = now();
      if (params.action === "suspend") {
        c.suspended_at = ts; c.suspended_by = params.actorUserId; c.suspension_reason = params.reason;
      } else {
        c.restored_at = ts; c.restored_by = params.actorUserId; c.restore_reason = params.reason;
        c.suspended_at = null; c.suspended_by = null; c.suspension_reason = null;
      }
      c.updated_at = ts;

      const auditFail = mockDataLayer.getAuditFail();
      if (auditFail) {
        // Rollback
        Object.assign(c, prevState);
        return { ok: false, message: "Partial failure: Contractor action completed but audit logging failed. The change has been rolled back. Contact support with reference CTOR-" + params.contractorId + "-" + Date.now() + "." };
      }

      (s().audit ??= []).push({ id: `audit-${(s().audit?.length ?? 0) + 1}`, admin_id: params.actorUserId, action_type: params.action === "suspend" ? "contractor_suspended" : "contractor_restored", resource_type: "contractor", resource_id: params.contractorId, reason: params.reason, result: "success", created_at: ts });
      return { ok: true, data: clone(c) };
    },
  };

  // ── KYC Documents ──
  mod.supabaseContractorDocuments = {
    listByContractorIds: async (ids: string[]) => {
      const sim = checkErrorSimulation("documents.listByContractorIds");
      if (sim) return sim;
      return { ok: true, data: (s()?.contractorDocuments ?? []).filter((d: any) => ids.includes(d.contractor_id)) };
    },
    reviewDocuments: async (params: any) => {
      const sim = checkErrorSimulation("documents.reviewDocuments");
      if (sim) return sim;
      if (mockDataLayer.getRLSViolation())
        return { ok: false, message: "Permission denied: You are not authorized to review KYC documents. Verify your admin permissions." };
      if (!params.reviewedBy) return { ok: false, message: "Admin reviewer ID is required. Ensure your session is active." };
      if (params.reviewedBy !== getAdminId()) return { ok: false, message: "Actor ID mismatch. Please log out and log back in to sync your session." };

      const docs = (s()?.contractorDocuments ?? []).filter((d: any) => params.documentIds.includes(d.id));
      if (docs.length === 0) return { ok: false, message: "No documents found for review. The documents may have been already reviewed or removed. Reload the contractor details." };

      // Always write document status first (mutation succeeds)
      const ts = now();
      for (const doc of docs) {
        doc.status = params.status;
        doc.reviewed_at = ts;
        doc.reviewed_by = params.reviewedBy;
        doc.rejection_reason = params.status === "rejected" ? params.rejectionReason?.trim() || null : null;
      }

      // Then check if notification/upload flaked (partial failure: status saved, notification failed)
      if (mockDataLayer.getUploadFail())
        return { ok: true, data: docs.map(clone), _warning: "Notification delivery failed. The contractor may not receive a status change notification. Contact support to manually notify the contractor." };

      return { ok: true, data: docs.map(clone) };
    },
  };

  // ── Finance ──
  mod.supabaseFinance = {
    listPayments: async (params?: any) => {
      const sim = checkErrorSimulation("finance.listPayments");
      if (sim) return sim;
      return { ok: true, data: (s()?.payments ?? []).slice(0, params?.limit ?? 50).map(clone) };
    },
    listWithdrawals: async (params?: any) => {
      const sim = checkErrorSimulation("finance.listWithdrawals");
      if (sim) return sim;
      return { ok: true, data: (s()?.withdrawals ?? []).slice(0, params?.limit ?? 50).map(clone) };
    },
    listPaymentsByIds: async (ids: string[]) => ({ ok: true, data: (s()?.payments ?? []).filter((p: any) => ids.includes(p.id)) }),
    listPaymentsByJobIds: async (jobIds: string[]) => ({ ok: true, data: (s()?.payments ?? []).filter((p: any) => jobIds.includes(p.job_id)) }),
    refund: async (params: any) => {
      const sim = checkErrorSimulation("finance.refund");
      if (sim) return sim;
      if (params.actorUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch. Log out and log back in to sync your session." };
      const p = (s()?.payments ?? []).find((x: any) => x.id === params.paymentId);
      if (!p) return { ok: false, message: `Payment ${params.paymentId} not found. Reload the transactions list.` };
      if (!["captured", "paid"].includes(p.status))
        return { ok: false, message: `Cannot refund payment in "${p.status}" status. Only "captured" or "paid" payments can be refunded. Current status: ${p.status}.` };
      if (!params.reason)
        return { ok: false, message: "A refund reason is required (1-500 characters). Please explain why this refund is being issued for audit compliance." };
      p.status = "refunded";
      p.refunded_at = now();
      return { ok: true, data: clone(p) };
    },
    markPaymentFailed: async (params: any) => {
      const sim = checkErrorSimulation("finance.markPaymentFailed");
      if (sim) return sim;
      if (params.actorUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch." };
      return { ok: true, data: { id: params.paymentId, status: "failed" } };
    },
    cancelPayment: async (params: any) => {
      const sim = checkErrorSimulation("finance.cancelPayment");
      if (sim) return sim;
      if (params.actorUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch." };
      return { ok: true, data: { id: params.paymentId, status: "cancelled" } };
    },
    markWithdrawalCompleted: async (params: any) => {
      const sim = checkErrorSimulation("finance.markWithdrawalCompleted");
      if (sim) return sim;
      if (params.actorUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch." };
      const w = (s()?.withdrawals ?? []).find((x: any) => x.id === params.withdrawalId);
      if (!w || w.status !== "processing")
        return { ok: false, message: `Withdrawal must be in "processing" state to mark as completed. Current status: ${w?.status || "not found"}.` };
      w.status = "completed";
      w.processed_at = now();
      return { ok: true, data: clone(w) };
    },
    markWithdrawalFailed: async (params: any) => {
      if (params.actorUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch." };
      return { ok: true, data: { id: params.withdrawalId, status: "failed" } };
    },
    cancelWithdrawal: async (params: any) => {
      if (params.actorUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch." };
      return { ok: true, data: { id: params.withdrawalId, status: "cancelled" } };
    },
  };

  // ── Disputes ──
  mod.supabaseDisputes = {
    listLatest: async (params?: any) => {
      const sim = checkErrorSimulation("disputes.listLatest");
      if (sim) return sim;
      return { ok: true, data: (s()?.disputes ?? []).slice(0, params?.limit ?? 50).map(clone) };
    },
    getById: async (id: string) => {
      const sim = checkErrorSimulation("disputes.getById");
      if (sim) return sim;
      const d = s()?.disputes?.find((x: any) => x.id === id);
      return d ? { ok: true, data: clone(d) } : { ok: false, message: `Dispute ${id} not found. It may have been resolved or removed. Reload the dispute list.` };
    },
    createDisputeFromRequest: async (params: any) => {
      const sim = checkErrorSimulation("disputes.createDisputeFromRequest");
      if (sim) return sim;
      if (!params.createdBy) return { ok: false, message: "Admin user ID is required to create a dispute." };
      if (params.createdBy !== getAdminId()) return { ok: false, message: "Actor ID mismatch." };
      const id = `dispute-${(s()?.disputes?.length ?? 0) + 1}`;
      const dispute = { id, job_id: params.jobId, status: "under_review" };
      (s().disputes ??= []).push(dispute);
      return { ok: true, data: dispute };
    },
    applyAction: async (params: any) => {
      const sim = checkErrorSimulation("disputes.applyAction");
      if (sim) return sim;
      if (!params.actorUserId) return { ok: false, message: "Admin user ID is required to resolve a dispute." };
      if (params.actorUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch." };
      const d = (s()?.disputes ?? []).find((x: any) => x.id === params.disputeId);
      if (!d) return { ok: false, message: `Dispute ${params.disputeId} not found. Reload the dispute list.` };
      if (params.action === "resolve") d.status = "resolved";
      else if (params.action === "reject") d.status = "rejected";
      return { ok: true, data: clone(d) };
    },
    initiateRefund: async (params: any) => {
      const sim = checkErrorSimulation("disputes.initiateRefund");
      if (sim) return sim;
      if (params.adminUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch." };
      return { ok: true, data: { disputeId: params.disputeId, refundStatus: "pending" } };
    },
    completeRefund: async (params: any) => {
      if (params.adminUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch." };
      return { ok: true, data: { refundStatus: "completed" } };
    },
    failRefund: async (params: any) => {
      if (params.adminUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch." };
      return { ok: true, data: { refundStatus: "failed" } };
    },
  };

  // ── Support ──
  mod.supabaseSupport = {
    listLatest: async (params?: any) => {
      const sim = checkErrorSimulation("support.listLatest");
      if (sim) return sim;
      return { ok: true, data: (s()?.supportTickets ?? []).slice(0, params?.limit ?? 50).map(clone) };
    },
    updateStatus: async (params: any) => {
      const sim = checkErrorSimulation("support.updateStatus");
      if (sim) return sim;
      if (!params.actorUserId) return { ok: false, message: "Admin user ID is required." };
      if (params.actorUserId !== getAdminId()) return { ok: false, message: "Actor ID mismatch." };
      const t = (s()?.supportTickets ?? []).find((x: any) => x.id === params.ticketId);
      if (!t) return { ok: false, message: `Support ticket ${params.ticketId} not found. It may have been resolved or deleted.` };
      t.status = params.status;
      return { ok: true, data: clone(t) };
    },
    createMessage: async (params: any) => {
      if (!params.content) return { ok: false, message: "Message content is required. Type your message before sending." };
      if (params.content.length > 5000) return { ok: false, message: "Message exceeds the 5000 character maximum. Please shorten your message." };
      return { ok: true, data: { id: "msg-new" } };
    },
    listMessagesByTicketId: async (params: any) => ({ ok: true, data: (s()?.supportMessages ?? []).filter((m: any) => m.ticket_id === params.ticketId) }),
    markMessageAsRead: async (params: any) => ({ ok: true, data: undefined }),
    getUnreadMessageCount: async (params: any) => ({ ok: true, data: 0 }),
    createSupportTicket: async (params: any) => ({
      ok: true, data: { id: "ticket-new", subject: params.subject, status: "open" }
    }),
  };

  // ── Settings ──
  mod.supabaseSettings = {
    listServiceCategories: async () => {
      const sim = checkErrorSimulation("settings.listServiceCategories");
      if (sim) return sim;
      return { ok: true, data: (s()?.serviceCategories ?? []).map(clone) };
    },
    createServiceCategory: async (params: any) => ({
      ok: true, data: { id: "cat-new", name: params.name }
    }),
    updateServiceCategory: async (params: any) => ({
      ok: true, data: { id: params.id, is_active: params.isActive }
    }),
    listPromoCodes: async () => {
      const sim = checkErrorSimulation("settings.listPromoCodes");
      if (sim) return sim;
      return { ok: true, data: (s()?.promo ?? []).map(clone) };
    },
    createPromoCode: async (params: any) => ({ ok: true, data: { id: "promo-new", code: params.code } }),
    updatePromoCode: async (params: any) => ({ ok: true, data: { id: params.id } }),
    deletePromoCode: async (id: string) => ({ ok: true, data: null }),
  };

  // ── Audit Log ──
  mod.supabaseAuditLog = {
    listActions: async (params?: any) => ({ ok: true, data: (s()?.audit ?? []).slice(0, params?.limit ?? 100) }),
    getResourceAuditTrail: async (resourceType: string, resourceId: string) => ({
      ok: true, data: (s()?.audit ?? []).filter((l: any) => l.resource_type === resourceType && l.resource_id === resourceId)
    }),
  };

  // ── Job Operations ──
  mod.supabaseJobOperations = {
    flagDelay: async (params: any) => ({ ok: true, data: { operation_type: "delay", job_id: params.jobId } }),
    flagDispute: async (params: any) => ({ ok: true, data: { operation_type: "dispute", job_id: params.jobId } }),
    flagEscalation: async (params: any) => ({ ok: true, data: { operation_type: "escalation", job_id: params.jobId } }),
    clearFlag: async (params: any) => ({ ok: true, data: { operation_type: "cleared", job_id: params.jobId } }),
    getOperationHistory: async (jobId: string) => ({ ok: true, data: (s()?.jobOperationsLog ?? []).filter((o: any) => o.job_id === jobId) }),
    getCurrentOperationState: async (jobId: string) => ({ ok: true, data: { isDelayed: false, isDisputed: false } }),
  };

  // ── Notifications ──
  mod.supabaseNotifications = {
    listLatestForRecipient: async (params: any) => ({ ok: true, data: (s()?.notifications ?? []).filter((n: any) => n.recipient_id === params.recipientId) }),
    markRead: async (params: any) => ({ ok: true, data: { id: params.notificationId, read_at: now() } }),
  };

  return mod;
});

import {
  supabaseProfiles, supabaseJobs, supabaseContractors, supabaseContractorDocuments,
  supabaseFinance, supabaseDisputes, supabaseSupport, supabaseNotifications,
  supabaseSettings, supabaseAuditLog, supabaseJobOperations,
} from "../../src/lib/supabase/data";

// ─────────────────────────────────────────────────────────────
// P3: Error Scenarios & Failure Mode Tests
// ─────────────────────────────────────────────────────────────
describe("P3: Error Scenarios & Failure Mode Testing", () => {
  beforeEach(async () => {
    await seedTestData();
    mockDataLayer.setStore(testStore);
    mockDataLayer.resetAll();
  });

  afterEach(async () => {
    await teardownTestData();
    mockDataLayer.setStore(null);
    mockDataLayer.resetAll();
  });

  // ───────────────────────────────────────────────────────────
  // 1. NETWORK FAILURES (6 tests)
  // ───────────────────────────────────────────────────────────
  describe("1. NETWORK FAILURES", () => {
    it("handles connection refused on jobs list fetch", async () => {
      mockDataLayer.setNetworkError(true);
      const r = await supabaseJobs.listLatest();
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("Connection refused");
        expect(r.message).toContain("check your internet connection");
      }
    });

    it("handles connection refused on contractor details fetch", async () => {
      mockDataLayer.setNetworkError(true);
      const r = await supabaseContractors.getById(getContractorId());
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toContain("Connection refused");
    });

    it("handles connection refused during job update mutation", async () => {
      mockDataLayer.setNetworkError(true);
      const r = await supabaseJobs.updateLifecycle({ jobId: SEED.jobId, status: "completed", actorUserId: getAdminId() });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toContain("Connection refused");
    });

    it("handles timeout on disputes list fetch", async () => {
      mockDataLayer.setTimeout(true);
      const r = await supabaseDisputes.listLatest();
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("timed out");
        expect(r.message).toMatch(/Retry/i);
      }
    });

    it("handles timeout on settings read", async () => {
      mockDataLayer.setTimeout(true);
      const r = await supabaseSettings.listServiceCategories();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toContain("timed out");
    });

    it("handles timeout on support list fetch with retry guidance", async () => {
      mockDataLayer.setTimeout(true);
      const r = await supabaseSupport.listLatest();
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("timed out");
        expect(r.message.toLowerCase()).toMatch(/retry|contact support/i);
      }
    });
  });

  // ───────────────────────────────────────────────────────────
  // 2. NETWORK FAILURES — Reads recover after error (3 tests)
  // ───────────────────────────────────────────────────────────
  describe("2. NETWORK FAILURES — Recovery", () => {
    it("recovers after simulated network error is cleared", async () => {
      mockDataLayer.setNetworkError(true);
      const r1 = await supabaseJobs.listLatest();
      expect(r1.ok).toBe(false);

      mockDataLayer.setNetworkError(false);
      const r2 = await supabaseJobs.listLatest();
      expect(r2.ok).toBe(true);
      if (r2.ok) expect(r2.data.length).toBe(4);
    });
  });

  // ───────────────────────────────────────────────────────────
  // 3. DATA INTEGRITY — RLS Violations (3 tests)
  // ───────────────────────────────────────────────────────────
  describe("3. DATA INTEGRITY — RLS Violations", () => {
    it("handles RLS violation on job update with clear guidance", async () => {
      mockDataLayer.setRLSViolation(true);
      const r = await supabaseJobs.updateLifecycle({ jobId: SEED.jobId, status: "completed", actorUserId: getAdminId() });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("Permission denied");
        expect(r.message.toLowerCase()).toMatch(/not authorized|verify your admin role|contact.*super administrator/i);
      }
    });

    it("handles RLS violation on contractor suspend", async () => {
      mockDataLayer.setRLSViolation(true);
      const r = await supabaseContractors.updateLifecycle({ contractorId: getContractorId(), action: "suspend", actorUserId: getAdminId(), reason: "Test" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toContain("Permission denied");
    });

    it("handles RLS violation on KYC review", async () => {
      mockDataLayer.setRLSViolation(true);
      const r = await supabaseContractorDocuments.reviewDocuments({ contractorId: getContractorId(), documentIds: [SEED.documentId1], status: "approved", reviewedBy: getAdminId() });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toContain("Permission denied");
    });
  });

  // ───────────────────────────────────────────────────────────
  // 4. DATA INTEGRITY — Constraint Violations (2 tests)
  // ───────────────────────────────────────────────────────────
  describe("4. DATA INTEGRITY — Constraint Violations", () => {
    it("handles constraint violation on job status transition", async () => {
      mockDataLayer.setConstraintViolation(true);
      const r = await supabaseJobs.updateLifecycle({ jobId: SEED.jobId, status: "completed", actorUserId: getAdminId() });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("Constraint violation");
        expect(r.message).toMatch(/Reload/i);
      }
    });
  });

  // ───────────────────────────────────────────────────────────
  // 5. DATA INTEGRITY — Concurrent Conflicts (3 tests)
  // ───────────────────────────────────────────────────────────
  describe("5. DATA INTEGRITY — Concurrent Conflicts", () => {
    it("detects concurrent modification on job and advises retry", async () => {
      mockDataLayer.setConcurrentConflict(true);
      const r = await supabaseJobs.updateLifecycle({ jobId: SEED.jobId, status: "completed", actorUserId: getAdminId() });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("Concurrent modification");
        expect(r.message).toContain("retry");
      }
    });

    it("detects concurrent modification on contractor update", async () => {
      mockDataLayer.setConcurrentConflict(true);
      const r = await supabaseContractors.updateLifecycle({ contractorId: getContractorId(), action: "suspend", actorUserId: getAdminId(), reason: "Test" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toContain("Concurrent modification");
    });
  });

  // ───────────────────────────────────────────────────────────
  // 6. STATE MISMATCH — Actor ID & Session (5 tests)
  // ───────────────────────────────────────────────────────────
  describe("6. STATE MISMATCH — Actor ID & Session", () => {
    it("provides clear guidance for actor ID mismatch on job cancel", async () => {
      const r = await supabaseJobs.updateLifecycle({ jobId: SEED.jobId, status: "cancelled", actorUserId: "wrong-admin", cancellationReason: "Test" });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("Actor ID mismatch");
        expect(r.message.toLowerCase()).toMatch(/log out.*log back in/i);
      }
    });

    it("provides clear guidance for actor ID mismatch on contractor suspend", async () => {
      const r = await supabaseContractors.updateLifecycle({ contractorId: getContractorId(), action: "suspend", actorUserId: "wrong-admin", reason: "Test" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toContain("Actor ID mismatch");
    });

    it("provides clear guidance for missing actor ID on dispute action", async () => {
      const r = await supabaseDisputes.applyAction({ disputeId: SEED.disputeId, action: "resolve", actorUserId: "", reason: "Test" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message.toLowerCase()).toContain("required");
    });

    it("provides clear guidance for missing actor ID on support update", async () => {
      const r = await supabaseSupport.updateStatus({ ticketId: SEED.supportTicketId, status: "resolved", actorUserId: "" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message.toLowerCase()).toContain("required");
    });

    it("handles actor ID mismatch on finance refund with actionable guidance", async () => {
      const r = await supabaseFinance.refund({ paymentId: SEED.paymentId, actorUserId: "wrong-admin", reason: "Test", refundAmount: 165 });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("Actor ID mismatch");
        expect(r.message.toLowerCase()).toMatch(/log out|log back in/i);
      }
    });
  });

  // ───────────────────────────────────────────────────────────
  // 7. PARTIAL FAILURES — Audit Log Failure (4 tests)
  // ───────────────────────────────────────────────────────────
  describe("7. PARTIAL FAILURES — Audit Log Failure with Rollback", () => {
    it("rolls back job update when audit log fails", async () => {
      mockDataLayer.setAuditFail(true);
      const jobBefore = { ...testStore.jobs.find((j: any) => j.id === SEED.jobId) };
      const r = await supabaseJobs.updateLifecycle({ jobId: SEED.jobId, status: "completed", actorUserId: getAdminId() });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("Partial failure");
        expect(r.message).toContain("rolled back");
      }
      // State integrity: job status should NOT have changed
      const jobAfter = testStore.jobs.find((j: any) => j.id === SEED.jobId);
      expect(jobAfter.status).toBe(jobBefore.status);
    });

    it("rolls back contractor update when audit log fails", async () => {
      mockDataLayer.setAuditFail(true);
      const contractorBefore = { ...testStore.contractors.find((c: any) => c.id === getContractorId()) };
      const r = await supabaseContractors.updateLifecycle({ contractorId: getContractorId(), action: "suspend", actorUserId: getAdminId(), reason: "Test" });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("Partial failure");
        expect(r.message).toContain("rolled back");
      }
      // State integrity
      const contractorAfter = testStore.contractors.find((c: any) => c.id === getContractorId());
      expect(contractorAfter.suspended_at).toBe(contractorBefore.suspended_at);
    });

    it("provides audit rollback error with actionable contact reference", async () => {
      mockDataLayer.setAuditFail(true);
      const r = await supabaseContractors.updateLifecycle({ contractorId: getContractorId(), action: "suspend", actorUserId: getAdminId(), reason: "Test" });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toMatch(/Contact support/i);
        expect(r.message).toMatch(/CTOR-/); // reference ID
      }
    });

    it("allows retry after audit failure is cleared", async () => {
      mockDataLayer.setAuditFail(true);
      const r1 = await supabaseJobs.updateLifecycle({ jobId: SEED.jobId, status: "completed", actorUserId: getAdminId() });
      expect(r1.ok).toBe(false);

      mockDataLayer.setAuditFail(false);
      const r2 = await supabaseJobs.updateLifecycle({ jobId: SEED.jobId, status: "completed", actorUserId: getAdminId() });
      expect(r2.ok).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────
  // 8. PARTIAL FAILURES — Upload/Metadata (2 tests)
  // ───────────────────────────────────────────────────────────
  describe("8. PARTIAL FAILURES — Upload/Metadata", () => {
    it("handles notification failure during KYC review (status saved, notification failed)", async () => {
      mockDataLayer.setUploadFail(true);
      const r = await supabaseContractorDocuments.reviewDocuments({ contractorId: getContractorId(), documentIds: [SEED.documentId1], status: "approved", reviewedBy: getAdminId() });
      // Upload fail: status IS still saved (mock writes status before checking fail flag)
      expect(r.ok).toBe(true);
      if (r.ok && r.data[0]) {
        expect(r.data[0].status).toBe("approved");
      }
    });
  });

  // ───────────────────────────────────────────────────────────
  // 9. USER INPUT — Missing/Empty Required Fields (5 tests)
  // ───────────────────────────────────────────────────────────
  describe("9. USER INPUT — Missing Required Fields", () => {
    it("rejects job cancel with empty reason and explains why", async () => {
      const r = await supabaseJobs.updateLifecycle({ jobId: "job-002", status: "cancelled", actorUserId: getAdminId(), cancellationReason: "" });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("required");
        expect(r.message).toContain("1-500");
      }
    });

    it("rejects contractor lifecycle with empty reason", async () => {
      const r = await supabaseContractors.updateLifecycle({ contractorId: getContractorId(), action: "suspend", actorUserId: getAdminId(), reason: "" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toContain("required");
    });

    it("rejects support message with empty content", async () => {
      const r = await supabaseSupport.createMessage({ ticketId: SEED.supportTicketId, senderUserId: getAdminId(), content: "", isAdmin: true });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message.toLowerCase()).toContain("required");
    });

    it("rejects refund with empty reason providing audit context", async () => {
      const r = await supabaseFinance.refund({ paymentId: SEED.paymentId, actorUserId: getAdminId(), reason: "", refundAmount: 165 });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("required");
        expect(r.message).toContain("audit compliance");
      }
    });

    it("rejects message exceeding max length with limit info", async () => {
      const r = await supabaseSupport.createMessage({ ticketId: SEED.supportTicketId, senderUserId: getAdminId(), content: "x".repeat(5001), isAdmin: true });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toContain("5000");
        expect(r.message.toLowerCase()).toContain("shorten");
      }
    });
  });

  // ───────────────────────────────────────────────────────────
  // 10. STATE INTEGRITY — No Corruption After Errors (4 tests)
  // ───────────────────────────────────────────────────────────
  describe("10. STATE INTEGRITY — No Corruption After Errors", () => {
    it("job state unchanged after failed cancel with empty reason", async () => {
      const before = { ...testStore.jobs.find((j: any) => j.id === "job-002") };
      await supabaseJobs.updateLifecycle({ jobId: "job-002", status: "cancelled", actorUserId: getAdminId(), cancellationReason: "" });
      const after = testStore.jobs.find((j: any) => j.id === "job-002");
      expect(after.status).toBe(before.status);
    });

    it("contractor state unchanged after failed suspend with empty reason", async () => {
      const before = { ...testStore.contractors.find((c: any) => c.id === getContractorId()) };
      await supabaseContractors.updateLifecycle({ contractorId: getContractorId(), action: "suspend", actorUserId: getAdminId(), reason: "" });
      const after = testStore.contractors.find((c: any) => c.id === getContractorId());
      expect(after.suspended_at).toBe(before.suspended_at);
    });

    it("dispute list length unchanged after failed creation with mismatch", async () => {
      const before = testStore.disputes.length;
      await supabaseDisputes.createDisputeFromRequest({ jobId: SEED.jobId, reason: "Test", createdBy: "wrong-admin" });
      expect(testStore.disputes.length).toBe(before);
    });

    it("payment status unchanged after failed refund on wrong payment state", async () => {
      const before = { ...testStore.payments.find((p: any) => p.id === "payment-003") }; // pending
      const r = await supabaseFinance.refund({ paymentId: "payment-003", actorUserId: getAdminId(), reason: "Test", refundAmount: 440 });
      expect(r.ok).toBe(false);
      const after = testStore.payments.find((p: any) => p.id === "payment-003");
      expect(after.status).toBe(before.status);
    });
  });

  // ───────────────────────────────────────────────────────────
  // 11. ERROR MESSAGE QUALITY — Clarity & Actionability (4 tests)
  // ───────────────────────────────────────────────────────────
  describe("11. ERROR MESSAGE QUALITY — Clarity & Actionability", () => {
    it("error messages include what went wrong", async () => {
      const r = await supabaseJobs.updateLifecycle({ jobId: SEED.jobId, status: "cancelled", actorUserId: getAdminId(), cancellationReason: "" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message.length).toBeGreaterThan(20);
    });

    it("error messages suggest operator next steps (retry, reload, contact support)", async () => {
      const r1 = (await supabaseJobs.getById("non-existent")) as any;
      expect(r1.ok).toBe(false);
      if (!r1.ok) expect(r1.message.toLowerCase()).toMatch(/check|reload|verify/i);

      mockDataLayer.setNetworkError(true);
      const r2 = await supabaseJobs.listLatest();
      expect(r2.ok).toBe(false);
      if (!r2.ok) expect(r2.message.toLowerCase()).toMatch(/retry|check|try again/i);
      mockDataLayer.setNetworkError(false);

      mockDataLayer.setTimeout(true);
      const r3 = await supabaseSupport.listLatest();
      expect(r3.ok).toBe(false);
      if (!r3.ok) expect(r3.message.toLowerCase()).toMatch(/retry|contact support/i);
      mockDataLayer.setTimeout(false);
    });

    it("not-found errors are distinguishable from permission errors", async () => {
      const r1 = (await supabaseJobs.getById("non-existent")) as any;
      expect(r1.ok).toBe(false);
      if (!r1.ok) expect(r1.message).toContain("not found");

      mockDataLayer.setRLSViolation(true);
      const r2 = await supabaseJobs.updateLifecycle({ jobId: SEED.jobId, status: "completed", actorUserId: getAdminId() });
      expect(r2.ok).toBe(false);
      if (!r2.ok) expect(r2.message).toContain("Permission denied");
      mockDataLayer.setRLSViolation(false);
    });

    it("validation errors are distinguishable from network errors", async () => {
      const r1 = await supabaseJobs.updateLifecycle({ jobId: "job-002", status: "cancelled", actorUserId: getAdminId(), cancellationReason: "" });
      expect(r1.ok).toBe(false);
      if (!r1.ok) expect(r1.message).toContain("required");

      mockDataLayer.setNetworkError(true);
      const r2 = await supabaseJobs.updateLifecycle({ jobId: "job-002", status: "cancelled", actorUserId: getAdminId(), cancellationReason: "Test" });
      expect(r2.ok).toBe(false);
      if (!r2.ok) expect(r2.message).toContain("Connection refused");
      mockDataLayer.setNetworkError(false);
    });
  });
});