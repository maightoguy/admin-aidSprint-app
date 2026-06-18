import { describe, expect, it } from "vitest";
import type { ContractorDocumentRow, ContractorRow, ProfileRow } from "./data";
import {
  deriveContractorVerificationState,
  isContractorCurrentlySuspended,
  mapContractorRowToContractorRecord,
} from "./mappers";

function buildContractorRow(
  overrides: Partial<ContractorRow> = {},
): ContractorRow {
  return {
    id: "contractor-1",
    services: ["plumbing"],
    certifications: [],
    rating: 4.5,
    total_ratings: 12,
    acceptance_rate: 0.9,
    total_jobs_offered: 20,
    total_jobs_accepted: 18,
    availability_status: "online",
    current_latitude: null,
    current_longitude: null,
    location_updated_at: "2026-06-11T08:00:00.000Z",
    is_verified: true,
    id_verification_complete: true,
    police_check_complete: true,
    service_licences_complete: true,
    created_at: "2026-06-01T08:00:00.000Z",
    updated_at: "2026-06-11T08:00:00.000Z",
    stripe_account_id: null,
    stripe_onboarding_completed: true,
    stripe_charges_enabled: true,
    stripe_payouts_enabled: true,
    payouts_blocked_reason: null,
    suspended_at: null,
    suspended_by: null,
    suspension_reason: null,
    restored_at: null,
    restored_by: null,
    restore_reason: null,
    ...overrides,
  };
}

const profile: ProfileRow = {
  id: "contractor-1",
  email: "contractor@example.com",
  phone: "+2348000000000",
  full_name: "Ada Contractor",
  first_name: "Ada",
  last_name: "Contractor",
  gender: "Female",
  avatar_url: null,
  role: "contractor",
  fcm_token: null,
  created_at: "2026-06-01T08:00:00.000Z",
  updated_at: "2026-06-11T08:00:00.000Z",
  linked_auth_methods: [],
  stripe_customer_id: null,
};

function buildContractorDocumentRow(
  overrides: Partial<ContractorDocumentRow> = {},
): ContractorDocumentRow {
  return {
    id: crypto.randomUUID(),
    contractor_id: "contractor-1",
    document_type: "government_id",
    storage_path: "contractor-documents/contractor-1/id.pdf",
    file_name: "id.pdf",
    mime_type: "application/pdf",
    status: "pending",
    reviewed_at: null,
    reviewed_by: null,
    rejection_reason: null,
    created_at: "2026-06-18T08:00:00.000Z",
    ...overrides,
  };
}

describe("contractor lifecycle mapping", () => {
  it("treats a contractor as suspended when suspended_at is newer than restored_at", () => {
    const contractor = buildContractorRow({
      suspended_at: "2026-06-11T10:00:00.000Z",
      suspension_reason: "Quality escalation under review.",
    });

    expect(isContractorCurrentlySuspended(contractor)).toBe(true);

    const record = mapContractorRowToContractorRecord({
      contractor,
      profile,
    });

    expect(record.accountStatus).toBe("Deactivated");
    expect(record.lifecycleState).toBe("Suspended");
    expect(record.suspensionReason).toBe(
      "Quality escalation under review.",
    );
  });

  it("treats a contractor as restored when restored_at is newer than suspended_at", () => {
    const contractor = buildContractorRow({
      suspended_at: "2026-06-10T10:00:00.000Z",
      suspension_reason: "Temporary quality review.",
      restored_at: "2026-06-11T12:00:00.000Z",
      restore_reason: "Quality checks cleared.",
    });

    expect(isContractorCurrentlySuspended(contractor)).toBe(false);

    const record = mapContractorRowToContractorRecord({
      contractor,
      profile,
    });

    expect(record.accountStatus).toBe("Active");
    expect(record.lifecycleState).toBe("Active");
    expect(record.suspensionReason).toBeUndefined();
    expect(record.restoreReason).toBe("Quality checks cleared.");
  });
});

describe("contractor verification mapping", () => {
  it("keeps verification pending when contractor flags are true but documents are still pending", () => {
    const contractor = buildContractorRow({
      is_verified: true,
      id_verification_complete: true,
      police_check_complete: true,
      service_licences_complete: true,
    });
    const documents: ContractorDocumentRow[] = [
      buildContractorDocumentRow({ document_type: "government_id", status: "pending" }),
      buildContractorDocumentRow({ document_type: "police_check", status: "pending" }),
      buildContractorDocumentRow({ document_type: "service_licence", status: "pending" }),
    ];

    expect(
      deriveContractorVerificationState({
        contractor,
        documents,
      }),
    ).toBe("Pending review");
  });

  it("marks verification as verified once all required document categories are approved", () => {
    const contractor = buildContractorRow({
      is_verified: true,
      id_verification_complete: true,
      police_check_complete: true,
      service_licences_complete: true,
    });
    const documents: ContractorDocumentRow[] = [
      buildContractorDocumentRow({ document_type: "government_id", status: "approved" }),
      buildContractorDocumentRow({ document_type: "police_check", status: "approved" }),
      buildContractorDocumentRow({ document_type: "service_licence", status: "approved" }),
    ];

    expect(
      deriveContractorVerificationState({
        contractor,
        documents,
      }),
    ).toBe("Verified");
  });

  it("marks verification as rejected when any required document is rejected", () => {
    const contractor = buildContractorRow({
      is_verified: true,
    });
    const documents: ContractorDocumentRow[] = [
      buildContractorDocumentRow({ document_type: "government_id", status: "approved" }),
      buildContractorDocumentRow({
        document_type: "police_check",
        status: "rejected",
        rejection_reason: "Image is unreadable.",
      }),
      buildContractorDocumentRow({ document_type: "service_licence", status: "approved" }),
    ];

    expect(
      deriveContractorVerificationState({
        contractor,
        documents,
      }),
    ).toBe("Rejected");
  });
});
