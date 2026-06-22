import { describe, expect, it } from "vitest";
import {
  mapJobStatusToLifecycleStatus,
  mapJobStatusToUserRequestStatus,
  mapPaymentRowToTransactionFilterableRecord,
  mapUrgencyTierToUrgencyLabel,
  mapWithdrawalRowToTransactionFilterableRecord,
} from "./mappers";

describe("supabase mappers", () => {
  it("maps job status to request status", () => {
    expect(mapJobStatusToUserRequestStatus("requested")).toBe("Pending");
    expect(mapJobStatusToUserRequestStatus("broadcast")).toBe("Pending");
    expect(mapJobStatusToUserRequestStatus("accepted")).toBe("Active");
    expect(mapJobStatusToUserRequestStatus("in_progress")).toBe("Active");
    expect(mapJobStatusToUserRequestStatus("completed")).toBe("Completed");
    expect(mapJobStatusToUserRequestStatus("cancelled")).toBe("Cancelled");
  });

  it("maps job status to lifecycle status", () => {
    expect(mapJobStatusToLifecycleStatus("requested")).toBe("Current");
    expect(mapJobStatusToLifecycleStatus("accepted")).toBe("Assigned");
    expect(mapJobStatusToLifecycleStatus("arrived")).toBe("Assigned");
    expect(mapJobStatusToLifecycleStatus("completed")).toBe("Completed");
    expect(mapJobStatusToLifecycleStatus("cancelled")).toBe("Cancelled");
  });

  it("maps urgency tier to label", () => {
    expect(mapUrgencyTierToUrgencyLabel("standard")).toBe("Standard");
    expect(mapUrgencyTierToUrgencyLabel("urgent")).toBe("Emergency");
    expect(mapUrgencyTierToUrgencyLabel("critical")).toBe("Emergency");
  });

  it("maps payment and withdrawal rows to transaction filter records", () => {
    const paymentRecord = mapPaymentRowToTransactionFilterableRecord({
      payment: {
        id: "payment-id",
        job_id: "job",
        payer_id: "payer",
        payee_id: "payee",
        amount: 100,
        platform_fee: 5,
        contractor_payout: 95,
        status: "captured",
        stripe_payment_intent_id: null,
        stripe_transfer_id: null,
        stripe_charge_id: null,
        stripe_application_fee_amount: null,
        capture_method: "manual",
        currency: "usd",
        created_at: "2026-06-10T00:00:00.000Z",
        updated_at: "2026-06-10T00:00:00.000Z",
        captured_at: null,
        refunded_at: null,
        refund_initiated_by: null,
        refund_reason: null,
      },
      contractorProfile: { full_name: "Ada Lovelace", email: "ada@example.com" },
    });

    expect(paymentRecord.type).toBe("Service payment");
    expect(paymentRecord.status).toBe("Captured");

    const withdrawalRecord = mapWithdrawalRowToTransactionFilterableRecord({
      withdrawal: {
        id: "withdrawal-id",
        contractor_id: "contractor",
        bank_account_id: null,
        amount: 40,
        status: "processing",
        reference: null,
        created_at: "2026-06-10T00:00:00.000Z",
        processed_at: null,
        stripe_payout_id: null,
        failure_code: null,
        failure_message: null,
      },
      contractorProfile: { full_name: "Ada Lovelace", email: "ada@example.com" },
    });

    expect(withdrawalRecord.type).toBe("Withdrawal");
    expect(withdrawalRecord.amount).toBe(-40);
    expect(withdrawalRecord.status).toBe("Processing");
  });
});

