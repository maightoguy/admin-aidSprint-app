import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";

export type SupabaseResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

const ADMIN_UNAUTHORIZED_MESSAGE =
  "Your account is not authorized to access the admin portal.";
const ADMIN_SESSION_REQUIRED_MESSAGE = "Please sign in again to continue.";
const ADMIN_SESSION_MISMATCH_MESSAGE =
  "Your admin session no longer matches this action. Please sign in again.";
const ADMIN_ACCESS_CACHE_TTL_MS = 30_000;

let cachedAdminAccess:
  | {
      userId: string;
      checkedAtMs: number;
    }
  | null = null;

function clearCachedAdminAccess() {
  cachedAdminAccess = null;
}

function isPermissionDeniedError(error: PostgrestError | null) {
  const combined = [
    error?.code,
    error?.message,
    error?.details,
    error?.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    error?.code === "42501" ||
    combined.includes("permission denied") ||
    combined.includes("row-level security") ||
    combined.includes("not authorized") ||
    combined.includes("not allowed") ||
    combined.includes("insufficient privilege")
  );
}

function formatPostgrestError(error: PostgrestError | null) {
  if (!error) return "Something went wrong. Please try again.";
  if (isPermissionDeniedError(error)) {
    return ADMIN_UNAUTHORIZED_MESSAGE;
  }
  const message = error.message?.trim();
  if (message) return message;
  return "Something went wrong. Please try again.";
}

export function requireSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}

async function requireAdminAccess(params?: {
  expectedUserId?: string;
}): Promise<SupabaseResult<{ userId: string }>> {
  const client = requireSupabaseClient();
  const expectedUserId = params?.expectedUserId?.trim() ?? "";
  const {
    data: sessionData,
    error: sessionError,
  } = await client.auth.getSession();
  const sessionUserId = sessionData.session?.user?.id?.trim() ?? "";

  if (sessionError || !sessionUserId) {
    clearCachedAdminAccess();
    return {
      ok: false,
      message: sessionError?.message?.trim() || ADMIN_SESSION_REQUIRED_MESSAGE,
    };
  }

  if (expectedUserId && expectedUserId !== sessionUserId) {
    clearCachedAdminAccess();
    return { ok: false, message: ADMIN_SESSION_MISMATCH_MESSAGE };
  }

  if (
    cachedAdminAccess &&
    cachedAdminAccess.userId === sessionUserId &&
    Date.now() - cachedAdminAccess.checkedAtMs < ADMIN_ACCESS_CACHE_TTL_MS
  ) {
    return {
      ok: true,
      data: {
        userId: sessionUserId,
      },
    };
  }

  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", sessionUserId)
    .single();

  if (error) {
    clearCachedAdminAccess();
    return { ok: false, message: formatPostgrestError(error) };
  }

  const role =
    typeof data?.role === "string" ? data.role.trim().toLowerCase() : "";
  if (role !== "admin") {
    clearCachedAdminAccess();
    return { ok: false, message: ADMIN_UNAUTHORIZED_MESSAGE };
  }

  cachedAdminAccess = {
    userId: sessionUserId,
    checkedAtMs: Date.now(),
  };

  return {
    ok: true,
    data: {
      userId: sessionUserId,
    },
  };
}

export type JobRow = {
  id: string;
  user_id: string;
  contractor_id: string | null;
  service_category_id: string | null;
  service_type_id: string | null;
  service_type: string;
  urgency_tier: string;
  description: string;
  hours: number;
  base_price: number;
  urgency_fee: number;
  platform_fee: number;
  price_estimate: number;
  final_price: number | null;
  status: string;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  latitude: number;
  longitude: number;
  address: string;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
};

export type ProfileRow = {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  first_name: string;
  last_name: string;
  gender: string | null;
  avatar_url: string | null;
  role: string;
  fcm_token: string | null;
  created_at: string;
  updated_at: string;
  linked_auth_methods: string[];
  stripe_customer_id: string | null;
};

export type ContractorRow = {
  id: string;
  services: string[];
  certifications: string[];
  rating: number;
  total_ratings: number;
  acceptance_rate: number;
  total_jobs_offered: number;
  total_jobs_accepted: number;
  availability_status: string;
  current_latitude: number | null;
  current_longitude: number | null;
  location_updated_at: string | null;
  is_verified: boolean;
  id_verification_complete: boolean;
  police_check_complete: boolean;
  service_licences_complete: boolean;
  created_at: string;
  updated_at: string;
  stripe_account_id: string | null;
  stripe_onboarding_completed: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  payouts_blocked_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  suspension_reason: string | null;
  restored_at: string | null;
  restored_by: string | null;
  restore_reason: string | null;
};

export type ContractorBankAccountRow = {
  id: string;
  contractor_id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
  created_at: string;
};

export type ContractorDocumentRow = {
  id: string;
  contractor_id: string;
  document_type: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
};

export type ContractorDocumentReviewStatus = "approved" | "rejected";
export type ContractorLifecycleWriteAction = "suspend" | "restore";
export type JobLifecycleWriteStatus =
  | "broadcast"
  | "completed"
  | "cancelled";

export type PaymentRow = {
  id: string;
  job_id: string;
  payer_id: string;
  payee_id: string | null;
  amount: number;
  platform_fee: number;
  contractor_payout: number;
  status: string;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  stripe_charge_id: string | null;
  stripe_application_fee_amount: number | null;
  capture_method: string;
  currency: string;
  created_at: string;
  updated_at: string;
  captured_at: string | null;
  refunded_at: string | null;
};

export type WithdrawalRow = {
  id: string;
  contractor_id: string;
  bank_account_id: string | null;
  amount: number;
  status: string;
  reference: string | null;
  created_at: string;
  processed_at: string | null;
  stripe_payout_id: string | null;
  failure_code: string | null;
  failure_message: string | null;
};

export type SupportTicketRow = {
  id: string;
  requester_id: string;
  requester_role: string;
  job_id: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assigned_admin_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
};

export type SupportTicketEventRow = {
  id: string;
  ticket_id: string;
  actor_id: string;
  actor_role: string;
  event_type: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type DisputeRow = {
  id: string;
  job_id: string;
  opened_by_id: string;
  opened_by_role: string;
  dispute_type: string;
  status: string;
  priority: string;
  reason: string;
  requested_resolution: string;
  assigned_admin_id: string | null;
  related_payment_id: string | null;
  related_withdrawal_id: string | null;
  resolution_type: string | null;
  resolution_amount: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  rejected_at: string | null;
};

export type DisputeEvidenceRow = {
  id: string;
  dispute_id: string;
  submitted_by_id: string;
  submitted_by_role: string;
  evidence_type: string;
  url: string | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type DisputeEventRow = {
  id: string;
  dispute_id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  reason: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ReviewRow = {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type PlatformConfigRow = {
  key: string;
  value: string;
  description: string;
  updated_at: string;
};

export type ServiceCategoryRow = {
  id: string;
  name: string;
  icon_key: string;
  description: string;
  display_order: number;
  is_active: boolean;
  min_hours: number;
  created_at: string;
};

export type ServiceTypeRow = {
  id: string;
  category_id: string;
  name: string;
  base_price: number;
  is_price_additional: boolean;
  is_active: boolean;
  created_at: string;
};

export type UrgencyTierRow = {
  id: string;
  name: string;
  label: string;
  description: string;
  extra_fee: number;
  contractor_share_percent: number;
  platform_share_percent: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export const supabaseProfiles = {
  async getRoleById(userId: string): Promise<SupabaseResult<string>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const { data, error } = await client
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data || typeof data.role !== "string") {
      return { ok: false, message: "Profile role not found." };
    }
    return { ok: true, data: data.role };
  },

  async listByIds(ids: string[]): Promise<SupabaseResult<ProfileRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const uniqueIds = Array.from(
      new Set(ids.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (uniqueIds.length === 0) {
      return { ok: true, data: [] };
    }

    const batches: string[][] = [];
    for (let index = 0; index < uniqueIds.length; index += 100) {
      batches.push(uniqueIds.slice(index, index + 100));
    }

    const rows: ProfileRow[] = [];
    for (const batch of batches) {
      const { data, error } = await client
        .from("profiles")
        .select(
          "id,email,phone,full_name,first_name,last_name,gender,avatar_url,role,fcm_token,created_at,updated_at,linked_auth_methods,stripe_customer_id",
        )
        .in("id", batch);

      if (error) return { ok: false, message: formatPostgrestError(error) };
      rows.push(...((data ?? []) as ProfileRow[]));
    }

    return { ok: true, data: rows };
  },
};

export const supabaseJobs = {
  async listLatest(params?: {
    limit?: number;
    status?: string;
  }): Promise<SupabaseResult<JobRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const limit = Math.max(1, Math.min(200, params?.limit ?? 50));

    let query = client.from("jobs").select("*").order("created_at", {
      ascending: false,
    });

    if (params?.status) {
      query = query.eq("status", params.status);
    }

    const { data, error } = await query.limit(limit);
    if (error) return { ok: false, message: formatPostgrestError(error) };

    return { ok: true, data: (data ?? []) as JobRow[] };
  },

  async getById(jobId: string): Promise<SupabaseResult<JobRow>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const { data, error } = await client
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Job not found." };
    return { ok: true, data: data as JobRow };
  },

  async listByIds(jobIds: string[]): Promise<SupabaseResult<JobRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(jobIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const { data, error } = await client
      .from("jobs")
      .select("*")
      .in("id", ids);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as JobRow[] };
  },

  async listByContractorIds(
    contractorIds: string[],
    params?: { limit?: number },
  ): Promise<SupabaseResult<JobRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(contractorIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const limit = Math.max(1, Math.min(500, params?.limit ?? 200));
    const { data, error } = await client
      .from("jobs")
      .select("*")
      .in("contractor_id", ids)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as JobRow[] };
  },

  async updateLifecycle(params: {
    jobId: string;
    status: JobLifecycleWriteStatus;
    actorUserId?: string;
    cancellationReason?: string | null;
  }): Promise<SupabaseResult<JobRow>> {
    const client = requireSupabaseClient();
    const jobId = params.jobId.trim();

    if (!jobId) {
      return { ok: false, message: "Job id is required." };
    }

    const adminCheck = await requireAdminAccess({
      expectedUserId: params.actorUserId,
    });
    if (adminCheck.ok === false) return adminCheck;

    const now = new Date().toISOString();
    const payload =
      params.status === "broadcast"
        ? {
            status: "broadcast",
            contractor_id: null,
            accepted_at: null,
            started_at: null,
            completed_at: null,
            cancelled_at: null,
            cancellation_reason: null,
            cancelled_by: null,
          }
        : params.status === "completed"
          ? {
              status: "completed",
              completed_at: now,
              cancelled_at: null,
              cancellation_reason: null,
              cancelled_by: null,
            }
          : (() => {
              const actorUserId = params.actorUserId?.trim() ?? "";
              const cancellationReason =
                params.cancellationReason?.trim() ?? "";

              if (!actorUserId) {
                throw new Error("Admin user id is required to cancel a job.");
              }

              if (!cancellationReason) {
                throw new Error("Cancellation reason is required.");
              }

              return {
                status: "cancelled",
                cancelled_at: now,
                cancellation_reason: cancellationReason,
                cancelled_by: actorUserId,
              };
            })();

    const { data, error } = await client
      .from("jobs")
      .update(payload)
      .eq("id", jobId)
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Job not found." };
    return { ok: true, data: data as JobRow };
  },
};

export const supabaseContractors = {
  async listLatest(params?: { limit?: number }): Promise<SupabaseResult<ContractorRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const limit = Math.max(1, Math.min(200, params?.limit ?? 50));

    const { data, error } = await client
      .from("contractors")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as ContractorRow[] };
  },

  async getById(contractorId: string): Promise<SupabaseResult<ContractorRow>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const { data, error } = await client
      .from("contractors")
      .select("*")
      .eq("id", contractorId)
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Contractor not found." };
    return { ok: true, data: data as ContractorRow };
  },

  async updateLifecycle(params: {
    contractorId: string;
    action: ContractorLifecycleWriteAction;
    actorUserId: string;
    reason: string;
  }): Promise<SupabaseResult<ContractorRow>> {
    const client = requireSupabaseClient();
    const contractorId = params.contractorId.trim();
    const actorUserId = params.actorUserId.trim();
    const reason = params.reason.trim();

    if (!contractorId) {
      return { ok: false, message: "Contractor id is required." };
    }

    if (!actorUserId) {
      return { ok: false, message: "Admin user id is required." };
    }

    if (!reason) {
      return { ok: false, message: "A lifecycle reason is required." };
    }

    const adminCheck = await requireAdminAccess({
      expectedUserId: actorUserId,
    });
    if (adminCheck.ok === false) return adminCheck;

    const now = new Date().toISOString();
    const payload =
      params.action === "suspend"
        ? {
            suspended_at: now,
            suspended_by: actorUserId,
            suspension_reason: reason,
          }
        : {
            restored_at: now,
            restored_by: actorUserId,
            restore_reason: reason,
          };

    const { data, error } = await client
      .from("contractors")
      .update(payload)
      .eq("id", contractorId)
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Contractor not found." };
    return { ok: true, data: data as ContractorRow };
  },
};

export const supabaseFinance = {
  async listPayments(params?: { limit?: number }): Promise<SupabaseResult<PaymentRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const limit = Math.max(1, Math.min(200, params?.limit ?? 50));

    const { data, error } = await client
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as PaymentRow[] };
  },

  async listWithdrawals(params?: {
    limit?: number;
  }): Promise<SupabaseResult<WithdrawalRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const limit = Math.max(1, Math.min(200, params?.limit ?? 50));

    const { data, error } = await client
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as WithdrawalRow[] };
  },

  async listPaymentsByIds(
    paymentIds: string[],
  ): Promise<SupabaseResult<PaymentRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(paymentIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const { data, error } = await client
      .from("payments")
      .select("*")
      .in("id", ids);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as PaymentRow[] };
  },

  async listWithdrawalsByIds(
    withdrawalIds: string[],
  ): Promise<SupabaseResult<WithdrawalRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(withdrawalIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const { data, error } = await client
      .from("withdrawals")
      .select("*")
      .in("id", ids);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as WithdrawalRow[] };
  },

  async listPaymentsByPayeeIds(
    payeeIds: string[],
    params?: { limit?: number },
  ): Promise<SupabaseResult<PaymentRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(payeeIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const limit = Math.max(1, Math.min(500, params?.limit ?? 200));
    const { data, error } = await client
      .from("payments")
      .select("*")
      .in("payee_id", ids)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as PaymentRow[] };
  },

  async listWithdrawalsByContractorIds(
    contractorIds: string[],
    params?: { limit?: number },
  ): Promise<SupabaseResult<WithdrawalRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(contractorIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const limit = Math.max(1, Math.min(500, params?.limit ?? 200));
    const { data, error } = await client
      .from("withdrawals")
      .select("*")
      .in("contractor_id", ids)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as WithdrawalRow[] };
  },
};

export const supabaseContractorBankAccounts = {
  async listByContractorIds(
    contractorIds: string[],
  ): Promise<SupabaseResult<ContractorBankAccountRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(contractorIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const { data, error } = await client
      .from("contractor_bank_accounts")
      .select("*")
      .in("contractor_id", ids)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as ContractorBankAccountRow[] };
  },
};

export const supabaseContractorDocuments = {
  async listByContractorIds(
    contractorIds: string[],
  ): Promise<SupabaseResult<ContractorDocumentRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(contractorIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const { data, error } = await client
      .from("contractor_documents")
      .select("*")
      .in("contractor_id", ids)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as ContractorDocumentRow[] };
  },

  async reviewDocuments(params: {
    contractorId: string;
    documentIds: string[];
    status: ContractorDocumentReviewStatus;
    reviewedBy: string;
    rejectionReason?: string | null;
  }): Promise<SupabaseResult<ContractorDocumentRow[]>> {
    const client = requireSupabaseClient();
    const contractorId = params.contractorId.trim();
    const reviewedBy = params.reviewedBy.trim();
    const documentIds = Array.from(
      new Set(params.documentIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (!contractorId) {
      return { ok: false, message: "Contractor id is required." };
    }

    if (documentIds.length === 0) {
      return { ok: false, message: "No contractor documents were selected for review." };
    }

    if (!reviewedBy) {
      return { ok: false, message: "Reviewer id is required." };
    }

    const adminCheck = await requireAdminAccess({
      expectedUserId: reviewedBy,
    });
    if (adminCheck.ok === false) return adminCheck;

    const { data, error } = await client
      .from("contractor_documents")
      .update({
        status: params.status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        rejection_reason:
          params.status === "rejected" ? params.rejectionReason?.trim() || null : null,
      })
      .eq("contractor_id", contractorId)
      .in("id", documentIds)
      .select("*");

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as ContractorDocumentRow[] };
  },
};

export const supabaseReviews = {
  async listByRevieweeIds(
    revieweeIds: string[],
  ): Promise<SupabaseResult<ReviewRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(revieweeIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const { data, error } = await client
      .from("reviews")
      .select("*")
      .in("reviewee_id", ids)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as ReviewRow[] };
  },
};

export const supabaseNotifications = {
  async listLatestForRecipient(params: {
    recipientId: string;
    limit?: number;
  }): Promise<SupabaseResult<NotificationRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess({
      expectedUserId: params.recipientId,
    });
    if (adminCheck.ok === false) return adminCheck;
    const limit = Math.max(1, Math.min(200, params.limit ?? 50));

    const { data, error } = await client
      .from("notifications")
      .select("*")
      .eq("recipient_id", params.recipientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as NotificationRow[] };
  },

  async markRead(params: {
    notificationId: string;
    recipientId: string;
    readAt?: string;
  }): Promise<SupabaseResult<NotificationRow>> {
    const client = requireSupabaseClient();
    const notificationId = params.notificationId.trim();
    const recipientId = params.recipientId.trim();

    if (!notificationId) {
      return { ok: false, message: "Notification id is required." };
    }

    if (!recipientId) {
      return { ok: false, message: "Recipient id is required." };
    }

    const adminCheck = await requireAdminAccess({
      expectedUserId: recipientId,
    });
    if (adminCheck.ok === false) return adminCheck;

    const readAt = params.readAt ?? new Date().toISOString();

    const { data, error } = await client
      .from("notifications")
      .update({ read_at: readAt })
      .eq("id", notificationId)
      .eq("recipient_id", recipientId)
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: data as NotificationRow };
  },

  async markAllReadForRecipient(params: {
    recipientId: string;
    readAt?: string;
  }): Promise<SupabaseResult<number>> {
    const client = requireSupabaseClient();
    const recipientId = params.recipientId.trim();

    if (!recipientId) {
      return { ok: false, message: "Recipient id is required." };
    }

    const adminCheck = await requireAdminAccess({
      expectedUserId: recipientId,
    });
    if (adminCheck.ok === false) return adminCheck;

    const readAt = params.readAt ?? new Date().toISOString();

    const { data, error } = await client
      .from("notifications")
      .update({ read_at: readAt })
      .eq("recipient_id", recipientId)
      .is("read_at", null)
      .select("id");

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []).length };
  },
};

export const supabaseSupport = {
  async listLatest(params?: {
    limit?: number;
  }): Promise<SupabaseResult<SupportTicketRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const limit = Math.max(1, Math.min(200, params?.limit ?? 50));

    const { data, error } = await client
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as SupportTicketRow[] };
  },

  async listEventsByTicketIds(
    ticketIds: string[],
  ): Promise<SupabaseResult<SupportTicketEventRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(ticketIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const { data, error } = await client
      .from("support_ticket_events")
      .select("*")
      .in("ticket_id", ids)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as SupportTicketEventRow[] };
  },

  async updateStatus(params: {
    ticketId: string;
    status: "in_review" | "resolved";
    actorUserId: string;
    message?: string | null;
  }): Promise<SupabaseResult<SupportTicketRow>> {
    const client = requireSupabaseClient();
    const ticketId = params.ticketId.trim();
    const actorUserId = params.actorUserId.trim();

    if (!ticketId) {
      return { ok: false, message: "Support ticket id is required." };
    }

    if (!actorUserId) {
      return { ok: false, message: "Admin user id is required." };
    }

    const adminCheck = await requireAdminAccess({
      expectedUserId: actorUserId,
    });
    if (adminCheck.ok === false) return adminCheck;

    const now = new Date().toISOString();
    const payload =
      params.status === "resolved"
        ? {
            status: "resolved",
            updated_at: now,
            resolved_at: now,
          }
        : {
            status: "in_review",
            updated_at: now,
          };

    const { data, error } = await client
      .from("support_tickets")
      .update(payload)
      .eq("id", ticketId)
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Support ticket not found." };

    const eventType = params.status === "resolved" ? "resolved" : "status_changed";
    const { error: eventError } = await client.from("support_ticket_events").insert({
      ticket_id: ticketId,
      actor_id: actorUserId,
      actor_role: "admin",
      event_type: eventType,
      message: params.message?.trim() || "",
      metadata: {
        next_status: params.status,
      },
    });

    if (eventError) return { ok: false, message: formatPostgrestError(eventError) };
    return { ok: true, data: data as SupportTicketRow };
  },
};

export const supabaseDisputes = {
  async listLatest(params?: { limit?: number }): Promise<SupabaseResult<DisputeRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const limit = Math.max(1, Math.min(200, params?.limit ?? 50));

    const { data, error } = await client
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as DisputeRow[] };
  },

  async listEvidenceByDisputeIds(
    disputeIds: string[],
  ): Promise<SupabaseResult<DisputeEvidenceRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(disputeIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const { data, error } = await client
      .from("dispute_evidence")
      .select("*")
      .in("dispute_id", ids)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as DisputeEvidenceRow[] };
  },

  async listEventsByDisputeIds(
    disputeIds: string[],
  ): Promise<SupabaseResult<DisputeEventRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(disputeIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const { data, error } = await client
      .from("dispute_events")
      .select("*")
      .in("dispute_id", ids)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as DisputeEventRow[] };
  },

  async applyAction(params: {
    disputeId: string;
    actorUserId: string;
    action: "request_evidence" | "propose_resolution" | "resolve" | "reject";
    reason: string;
    message?: string | null;
    resolutionType?: "no_action" | "refund" | "partial_refund" | "payout_block" | "chargeback";
  }): Promise<SupabaseResult<DisputeRow>> {
    const client = requireSupabaseClient();
    const disputeId = params.disputeId.trim();
    const actorUserId = params.actorUserId.trim();
    const reason = params.reason.trim();

    if (!disputeId) {
      return { ok: false, message: "Dispute id is required." };
    }

    if (!actorUserId) {
      return { ok: false, message: "Admin user id is required." };
    }

    if (!reason) {
      return { ok: false, message: "A dispute action reason is required." };
    }

    const adminCheck = await requireAdminAccess({
      expectedUserId: actorUserId,
    });
    if (adminCheck.ok === false) return adminCheck;

    const now = new Date().toISOString();
    const payload =
      params.action === "request_evidence"
        ? {
            status: "awaiting_evidence",
            updated_at: now,
          }
        : params.action === "propose_resolution"
          ? {
              status: "proposed_resolution",
              updated_at: now,
              resolution_type: params.resolutionType ?? null,
              requested_resolution: reason,
            }
          : params.action === "resolve"
            ? {
                status: "resolved",
                updated_at: now,
                resolved_at: now,
                resolution_type: params.resolutionType ?? null,
                requested_resolution: reason,
              }
            : {
                status: "rejected",
                updated_at: now,
                rejected_at: now,
              };

    const { data, error } = await client
      .from("disputes")
      .update(payload)
      .eq("id", disputeId)
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Dispute not found." };

    const metadata: Record<string, unknown> = {};
    if (params.message?.trim()) {
      metadata.message = params.message.trim();
    }
    if (params.resolutionType) {
      metadata.resolution_type = params.resolutionType;
    }

    const { error: eventError } = await client.from("dispute_events").insert({
      dispute_id: disputeId,
      actor_id: actorUserId,
      actor_role: "admin",
      action: params.action,
      reason,
      metadata,
    });

    if (eventError) return { ok: false, message: formatPostgrestError(eventError) };
    return { ok: true, data: data as DisputeRow };
  },
};

export const supabaseSettings = {
  async listPlatformConfig(): Promise<SupabaseResult<PlatformConfigRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const { data, error } = await client
      .from("platform_config")
      .select("*")
      .order("key", { ascending: true });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as PlatformConfigRow[] };
  },

  async upsertPlatformConfig(params: {
    key: string;
    value: string;
    description?: string;
  }): Promise<SupabaseResult<PlatformConfigRow>> {
    const client = requireSupabaseClient();
    const key = params.key.trim();
    const value = params.value ?? "";
    const description = params.description?.trim() ?? "";

    if (!key) {
      return { ok: false, message: "Config key is required." };
    }

    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const { data, error } = await client
      .from("platform_config")
      .upsert(
        {
          key,
          value,
          description,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      )
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Platform config could not be saved." };
    return { ok: true, data: data as PlatformConfigRow };
  },

  async listServiceCategories(): Promise<SupabaseResult<ServiceCategoryRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const { data, error } = await client
      .from("service_categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as ServiceCategoryRow[] };
  },

  async createServiceCategory(params: {
    name: string;
    description?: string;
    iconKey?: string;
    displayOrder?: number;
    minHours?: number;
    isActive?: boolean;
  }): Promise<SupabaseResult<ServiceCategoryRow>> {
    const client = requireSupabaseClient();
    const name = params.name.trim();

    if (!name) {
      return { ok: false, message: "Category name is required." };
    }

    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const { data, error } = await client
      .from("service_categories")
      .insert({
        name,
        description: params.description?.trim() ?? "",
        icon_key: params.iconKey?.trim() ?? "",
        display_order: params.displayOrder ?? 0,
        min_hours: params.minHours ?? 1,
        is_active: params.isActive ?? true,
      })
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Category could not be created." };
    return { ok: true, data: data as ServiceCategoryRow };
  },

  async updateServiceCategory(params: {
    id: string;
    name?: string;
    description?: string;
    iconKey?: string;
    displayOrder?: number;
    minHours?: number;
    isActive?: boolean;
  }): Promise<SupabaseResult<ServiceCategoryRow>> {
    const client = requireSupabaseClient();
    const id = params.id.trim();

    if (!id) {
      return { ok: false, message: "Category id is required." };
    }

    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const payload: Partial<ServiceCategoryRow> & {
      icon_key?: string;
      display_order?: number;
      min_hours?: number;
      is_active?: boolean;
    } = {};

    if (typeof params.name === "string") payload.name = params.name.trim();
    if (typeof params.description === "string") payload.description = params.description.trim();
    if (typeof params.iconKey === "string") payload.icon_key = params.iconKey.trim();
    if (typeof params.displayOrder === "number") payload.display_order = params.displayOrder;
    if (typeof params.minHours === "number") payload.min_hours = params.minHours;
    if (typeof params.isActive === "boolean") payload.is_active = params.isActive;

    const { data, error } = await client
      .from("service_categories")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Category could not be updated." };
    return { ok: true, data: data as ServiceCategoryRow };
  },

  async listServiceTypes(): Promise<SupabaseResult<ServiceTypeRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const { data, error } = await client
      .from("service_types")
      .select("*")
      .order("name", { ascending: true });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as ServiceTypeRow[] };
  },

  async createServiceType(params: {
    categoryId: string;
    name: string;
    basePrice?: number;
    isPriceAdditional?: boolean;
    isActive?: boolean;
  }): Promise<SupabaseResult<ServiceTypeRow>> {
    const client = requireSupabaseClient();
    const categoryId = params.categoryId.trim();
    const name = params.name.trim();

    if (!categoryId) {
      return { ok: false, message: "Category id is required." };
    }

    if (!name) {
      return { ok: false, message: "Service type name is required." };
    }

    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const { data, error } = await client
      .from("service_types")
      .insert({
        category_id: categoryId,
        name,
        base_price: params.basePrice ?? 0,
        is_price_additional: params.isPriceAdditional ?? false,
        is_active: params.isActive ?? true,
      })
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Service type could not be created." };
    return { ok: true, data: data as ServiceTypeRow };
  },

  async updateServiceType(params: {
    id: string;
    categoryId?: string;
    name?: string;
    basePrice?: number;
    isPriceAdditional?: boolean;
    isActive?: boolean;
  }): Promise<SupabaseResult<ServiceTypeRow>> {
    const client = requireSupabaseClient();
    const id = params.id.trim();

    if (!id) {
      return { ok: false, message: "Service type id is required." };
    }

    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const payload: Partial<ServiceTypeRow> & {
      category_id?: string;
      base_price?: number;
      is_price_additional?: boolean;
      is_active?: boolean;
    } = {};

    if (typeof params.categoryId === "string") payload.category_id = params.categoryId.trim();
    if (typeof params.name === "string") payload.name = params.name.trim();
    if (typeof params.basePrice === "number") payload.base_price = params.basePrice;
    if (typeof params.isPriceAdditional === "boolean") {
      payload.is_price_additional = params.isPriceAdditional;
    }
    if (typeof params.isActive === "boolean") payload.is_active = params.isActive;

    const { data, error } = await client
      .from("service_types")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Service type could not be updated." };
    return { ok: true, data: data as ServiceTypeRow };
  },

  async listUrgencyTiers(): Promise<SupabaseResult<UrgencyTierRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const { data, error } = await client
      .from("urgency_tiers")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as UrgencyTierRow[] };
  },

  async updateUrgencyTier(params: {
    id: string;
    label?: string;
    description?: string;
    extraFee?: number;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<SupabaseResult<UrgencyTierRow>> {
    const client = requireSupabaseClient();
    const id = params.id.trim();

    if (!id) {
      return { ok: false, message: "Urgency tier id is required." };
    }

    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const payload: Partial<UrgencyTierRow> & {
      extra_fee?: number;
      display_order?: number;
      is_active?: boolean;
    } = {};

    if (typeof params.label === "string") payload.label = params.label.trim();
    if (typeof params.description === "string") payload.description = params.description.trim();
    if (typeof params.extraFee === "number") payload.extra_fee = params.extraFee;
    if (typeof params.displayOrder === "number") payload.display_order = params.displayOrder;
    if (typeof params.isActive === "boolean") payload.is_active = params.isActive;

    const { data, error } = await client
      .from("urgency_tiers")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Urgency tier could not be updated." };
    return { ok: true, data: data as UrgencyTierRow };
  },
};

