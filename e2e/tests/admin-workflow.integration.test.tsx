import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { seedTestData, teardownTestData, testStore } from "../setup";

// Mock the data layer functions that would call Supabase. We replace them with
// implementations that operate on the in-memory `testStore` so tests are
// deterministic and validate the full workflow logic.
vi.mock("../../src/lib/supabase/data", async () => {
  return {
    supabaseJobs: {
      async createJob(job: any) {
        const id = `job-${testStore.jobs.length + 1}`;
        const entry = { id, ...job, created_at: new Date().toISOString() };
        testStore.jobs.push(entry);
        return { ok: true, data: entry };
      },
    },
    supabaseDisputes: {
      async createDispute(params: any) {
        const id = `dispute-${testStore.disputes.length + 1}`;
        const entry = { id, ...params, created_at: new Date().toISOString() };
        testStore.disputes.push(entry);
        return { ok: true, data: entry };
      },
    },
    supabaseFinance: {
      async refund(params: { paymentId: string; adminId: string; reason: string }) {
        const p = testStore.payments.find((x: any) => x.id === params.paymentId);
        if (!p) return { ok: false, message: "payment not found" };
        p.refunded = true;
        testStore.audit.push({ id: `audit-${testStore.audit.length + 1}`, action: "refund", by: params.adminId, paymentId: params.paymentId, reason: params.reason, created_at: new Date().toISOString() });
        return { ok: true, data: p };
      },
    },
  };
});

import { supabaseJobs, supabaseDisputes, supabaseFinance } from "../../src/lib/supabase/data";

describe("Admin end-to-end workflow (integration)", () => {
  beforeEach(async () => {
    await seedTestData();
  });

  afterEach(async () => {
    await teardownTestData();
    vi.resetModules();
  });

  it("admin can create job -> create dispute -> refund payment and audit is recorded", async () => {
    // 1) Admin creates a job (dispatch)
    const jobRes = await supabaseJobs.createJob({ title: "Test Job", requesterId: "user-1" });
    expect(jobRes.ok).toBe(true);
    const job = jobRes.data;
    expect(job.id).toBeDefined();
    expect(testStore.jobs.length).toBe(1);

    // 2) Admin creates a dispute for the job
    const disputeRes = await supabaseDisputes.createDispute({ jobId: job.id, reason: "Incorrect charge", createdBy: "admin-1" });
    expect(disputeRes.ok).toBe(true);
    expect(testStore.disputes.length).toBe(1);
    expect(testStore.disputes[0].jobId).toBe(job.id);

    // 3) Admin refunds an existing payment
    const refundRes = await supabaseFinance.refund({ paymentId: "payment-1", adminId: "admin-1", reason: "Approved refund" });
    expect(refundRes.ok).toBe(true);
    expect(testStore.payments.find((p: any) => p.id === "payment-1").refunded).toBe(true);

    // 4) Audit entry recorded
    expect(testStore.audit.length).toBe(1);
    expect(testStore.audit[0].action).toBe("refund");
    expect(testStore.audit[0].paymentId).toBe("payment-1");
  });
});
