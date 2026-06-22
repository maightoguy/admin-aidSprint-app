import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";
import { validateEvidenceFile } from "./evidence";

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
  refund_status: string | null;
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

export type PromoCodeRow = {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  discount_currency: string | null;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationTemplateRow = {
  id: string;
  name: string;
  channel: string;
  title_template: string | null;
  body_template: string;
  payload_template: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationCampaignRow = {
  id: string;
  name: string;
  description: string;
  channel: string;
  template_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
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
  async getById(userId: string): Promise<SupabaseResult<ProfileRow>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
      return { ok: false, message: "Profile id is required." };
    }

    const { data, error } = await client
      .from("profiles")
      .select(
        "id,email,phone,full_name,first_name,last_name,gender,avatar_url,role,fcm_token,created_at,updated_at,linked_auth_methods,stripe_customer_id",
      )
      .eq("id", normalizedUserId)
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Profile not found." };
    return { ok: true, data: data as ProfileRow };
  },

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

  async listLatest(params?: {
    limit?: number;
    roles?: string[];
  }): Promise<SupabaseResult<ProfileRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const limit = Math.max(1, Math.min(500, params?.limit ?? 100));
    const normalizedRoles = Array.from(
      new Set(
        (params?.roles ?? [])
          .map((role) => String(role).trim().toLowerCase())
          .filter(Boolean),
      ),
    );

    let query = client
      .from("profiles")
      .select(
        "id,email,phone,full_name,first_name,last_name,gender,avatar_url,role,fcm_token,created_at,updated_at,linked_auth_methods,stripe_customer_id",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (normalizedRoles.length > 0) {
      query = query.in("role", normalizedRoles);
    }

    const { data, error } = await query;
    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as ProfileRow[] };
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

  async listByUserIds(
    userIds: string[],
    params?: { limit?: number },
  ): Promise<SupabaseResult<JobRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const ids = Array.from(
      new Set(userIds.map((id) => String(id).trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return { ok: true, data: [] };
    }

    const limit = Math.max(1, Math.min(500, params?.limit ?? 200));
    const { data, error } = await client
      .from("jobs")
      .select("*")
      .in("user_id", ids)
      .order("created_at", { ascending: false })
      .limit(limit);

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

  async createMessage(params: {
    ticketId: string;
    senderUserId: string;
    content: string;
    isAdmin?: boolean;
  }): Promise<SupabaseResult<{
    id: string;
    ticket_id: string;
    sender_id: string;
    sender_role: string;
    content: string;
    read_by_admins: Record<string, string>;
    created_at: string;
  }>> {
    const client = requireSupabaseClient();
    const ticketId = params.ticketId.trim();
    const senderUserId = params.senderUserId.trim();
    const content = params.content.trim();

    if (!ticketId) return { ok: false, message: "Ticket ID is required." };
    if (!senderUserId) return { ok: false, message: "Sender user ID is required." };
    if (!content) return { ok: false, message: "Message content is required." };
    if (content.length > 5000) return { ok: false, message: "Message exceeds maximum length of 5000 characters." };

    const senderRole = params.isAdmin ? "admin" : "user";

    // If admin, verify admin access
    if (params.isAdmin) {
      const adminCheck = await requireAdminAccess({ expectedUserId: senderUserId });
      if (adminCheck.ok === false) return adminCheck;
    }

    try {
      const { data, error } = await client
        .from("support_ticket_messages")
        .insert({
          ticket_id: ticketId,
          sender_id: senderUserId,
          sender_role: senderRole,
          content: content,
        })
        .select("*")
        .single();

      if (error) return { ok: false, message: formatPostgrestError(error) };
      return { ok: true, data: data as any };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to create message." };
    }
  },

  async listMessagesByTicketId(params: {
    ticketId: string;
  }): Promise<SupabaseResult<Array<{
    id: string;
    ticket_id: string;
    sender_id: string;
    sender_role: string;
    content: string;
    read_by_admins: Record<string, string>;
    created_at: string;
  }>>> {
    const client = requireSupabaseClient();
    const ticketId = params.ticketId.trim();

    if (!ticketId) return { ok: false, message: "Ticket ID is required." };

    try {
      const { data, error } = await client
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) return { ok: false, message: formatPostgrestError(error) };
      return { ok: true, data: (data || []) as any };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to list messages." };
    }
  },

  async markMessageAsRead(params: {
    messageId: string;
    adminUserId: string;
  }): Promise<SupabaseResult<void>> {
    const client = requireSupabaseClient();
    const messageId = params.messageId.trim();
    const adminUserId = params.adminUserId.trim();

    if (!messageId) return { ok: false, message: "Message ID is required." };
    if (!adminUserId) return { ok: false, message: "Admin user ID is required." };

    const adminCheck = await requireAdminAccess({ expectedUserId: adminUserId });
    if (adminCheck.ok === false) return adminCheck;

    try {
      // Fetch the current message to get read_by_admins
      const { data: messageData, error: fetchError } = await client
        .from("support_ticket_messages")
        .select("read_by_admins")
        .eq("id", messageId)
        .single();

      if (fetchError) return { ok: false, message: formatPostgrestError(fetchError) };

      // Update read_by_admins with current admin and timestamp
      const readByAdmins = (messageData?.read_by_admins || {}) as Record<string, string>;
      readByAdmins[adminUserId] = new Date().toISOString();

      const { error: updateError } = await client
        .from("support_ticket_messages")
        .update({ read_by_admins: readByAdmins })
        .eq("id", messageId);

      if (updateError) return { ok: false, message: formatPostgrestError(updateError) };
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to mark message as read." };
    }
  },

  async getUnreadMessageCount(params: {
    ticketId: string;
    adminUserId: string;
  }): Promise<SupabaseResult<number>> {
    const client = requireSupabaseClient();
    const ticketId = params.ticketId.trim();
    const adminUserId = params.adminUserId.trim();

    if (!ticketId) return { ok: false, message: "Ticket ID is required." };
    if (!adminUserId) return { ok: false, message: "Admin user ID is required." };

    try {
      const { data, error } = await client
        .from("support_ticket_messages")
        .select("id, read_by_admins")
        .eq("ticket_id", ticketId);

      if (error) return { ok: false, message: formatPostgrestError(error) };

      // Count messages where adminUserId is NOT in read_by_admins
      const unreadCount = (data || []).filter(msg => {
        const readByAdmins = (msg.read_by_admins as Record<string, string>) || {};
        return !readByAdmins[adminUserId];
      }).length;

      return { ok: true, data: unreadCount };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to count unread messages." };
    }
  },

  async createSupportTicket(params: {
    requestId: string;
    requesterUserId: string;
    requesterRole: string;
    escalationReason: string;
  }): Promise<SupabaseResult<{ id: string }>> {
    const client = requireSupabaseClient();
    const requestId = params.requestId.trim();
    const requesterUserId = params.requesterUserId.trim();
    const requesterRole = params.requesterRole.trim();
    const escalationReason = params.escalationReason.trim();

    // Validation
    if (!requestId) return { ok: false, message: "Request ID is required." };
    if (!requesterUserId) return { ok: false, message: "Requester user ID is required." };
    if (!requesterRole) return { ok: false, message: "Requester role is required." };
    if (!escalationReason || escalationReason.length === 0)
      return { ok: false, message: "Escalation reason cannot be empty." };
    if (escalationReason.length > 5000)
      return { ok: false, message: "Escalation reason cannot exceed 5000 characters." };

    try {
      const { data, error } = await client
        .from("support_tickets")
        .insert({
          requester_id: requesterUserId,
          requester_role: requesterRole,
          job_id: requestId,
          subject: `Support escalation from ${requesterRole}`,
          description: escalationReason,
          status: "open",
          priority: "high",
        })
        .select("id")
        .single();

      if (error) return { ok: false, message: formatPostgrestError(error) };
      if (!data) return { ok: false, message: "Failed to create support ticket." };

      return { ok: true, data: { id: data.id } };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to create support ticket." };
    }
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

  async uploadEvidenceFile(params: {
    disputeId: string;
    actorUserId: string;
    file: File | Blob;
    description?: string;
    maxFileSizeBytes?: number;
    bucketName?: string;
  }): Promise<SupabaseResult<DisputeEvidenceRow>> {
    const client = requireSupabaseClient();
    const disputeId = params.disputeId.trim();
    const actorUserId = params.actorUserId.trim();

    if (!disputeId) return { ok: false, message: "Dispute id is required." };
    if (!actorUserId) return { ok: false, message: "Admin user id is required." };

    const adminCheck = await requireAdminAccess({ expectedUserId: actorUserId });
    if (adminCheck.ok === false) return adminCheck;

    const maxBytes = params.maxFileSizeBytes ?? 10 * 1024 * 1024; // 10MB default
    const file = params.file as File | Blob;
    const fileSize = (file as any).size ?? null;
    if (fileSize && fileSize > maxBytes) return { ok: false, message: `File exceeds maximum size of ${Math.round(maxBytes / 1024 / 1024)}MB.` };

    // Validate file type and size (server-side validation on client for UX)
    if (file instanceof File) {
      const validationResult = validateEvidenceFile(file);
      if (!validationResult.ok) {
        return { 
          ok: false, 
          message: (validationResult as any).message || "File validation failed."
        };
      }
    }

    const bucket = (params.bucketName || process.env.VITE_SUPABASE_ADMIN_DISPUTES_BUCKET || 'admin-disputes').trim();
    const timestamp = Date.now();
    const originalName = (file as any).name || `evidence-${timestamp}`;
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `admin/disputes/${disputeId}/${timestamp}-${safeName}`;

    // Upload to Supabase Storage
    try {
      const { data: uploadData, error: uploadError } = await client.storage
        .from(bucket)
        .upload(path, file as any, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        return { ok: false, message: uploadError.message || 'Upload failed.' };
      }

      // Create a short-lived signed URL for immediate viewing (3600s)
      const expireSeconds = 60 * 60; // 1 hour
      const { data: signedData, error: signedError } = await client.storage
        .from(bucket)
        .createSignedUrl(path, expireSeconds);
      if (signedError) {
        return { ok: false, message: signedError.message || 'Could not generate download URL.' };
      }

      const fileType = (file as any).type ?? null;
      const fileSizeNum = fileSize ?? null;

      // Persist evidence row to dispute_evidence table
      const { data: rowData, error: insertError } = await client
        .from('dispute_evidence')
        .insert({
          dispute_id: disputeId,
          submitted_by_id: actorUserId,
          submitted_by_role: 'admin',
          evidence_type: fileType?.startsWith('image') ? 'image' : 'file',
          url: signedData?.signedUrl ?? null,
          description: params.description?.trim() ?? originalName,
          metadata: {
            storage_path: path,
            file_name: originalName,
            file_size: fileSizeNum,
            file_type: fileType,
          },
        })
        .select('*')
        .single();

      if (insertError) return { ok: false, message: formatPostgrestError(insertError) };
      return { ok: true, data: rowData as DisputeEvidenceRow };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Upload failed.' };
    }
  },

  async initiateRefund(params: {
    disputeId: string;
    paymentId: string;
    adminUserId: string;
    refundAmount: number;
    refundReason: string;
  }): Promise<SupabaseResult<{ disputeId: string; paymentId: string; refundStatus: string }>> {
    const client = requireSupabaseClient();
    const disputeId = params.disputeId.trim();
    const paymentId = params.paymentId.trim();
    const adminUserId = params.adminUserId.trim();
    const refundAmount = params.refundAmount;
    const refundReason = params.refundReason.trim();

    // Validation
    if (!disputeId) return { ok: false, message: "Dispute ID is required." };
    if (!paymentId) return { ok: false, message: "Payment ID is required." };
    if (!adminUserId) return { ok: false, message: "Admin user ID is required." };
    if (refundAmount <= 0) return { ok: false, message: "Refund amount must be greater than 0." };
    if (!refundReason) return { ok: false, message: "Refund reason is required." };

    const adminCheck = await requireAdminAccess({ expectedUserId: adminUserId });
    if (adminCheck.ok === false) return adminCheck;

    const now = new Date().toISOString();

    try {
      // Update dispute with refund_status = pending
      const { data: disputeData, error: disputeError } = await client
        .from("disputes")
        .update({
          refund_status: "pending",
          updated_at: now,
        })
        .eq("id", disputeId)
        .select("*")
        .single();

      if (disputeError) {
        return { ok: false, message: `Failed to update dispute: ${formatPostgrestError(disputeError)}` };
      }

      // Update payment with refund metadata
      const { data: paymentData, error: paymentError } = await client
        .from("payments")
        .update({
          refund_initiated_by: adminUserId,
          refund_reason: refundReason,
          updated_at: now,
        })
        .eq("id", paymentId)
        .select("*")
        .single();

      if (paymentError) {
        return { ok: false, message: `Failed to update payment: ${formatPostgrestError(paymentError)}` };
      }

      // Log to finance audit log
      const { error: auditError } = await client
        .from("finance_audit_log")
        .insert({
          admin_id: adminUserId,
          action: "refund_initiated",
          dispute_id: disputeId,
          payment_id: paymentId,
          amount: refundAmount,
          reason: refundReason,
          metadata: {
            payment_status: paymentData?.status,
            payment_amount: paymentData?.amount,
          },
        });

      if (auditError) {
        return { ok: false, message: `Failed to audit log: ${formatPostgrestError(auditError)}` };
      }

      return { 
        ok: true, 
        data: {
          disputeId,
          paymentId,
          refundStatus: "pending",
        }
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to initiate refund." };
    }
  },

  async completeRefund(params: {
    paymentId: string;
    disputeId: string;
    adminUserId: string;
  }): Promise<SupabaseResult<{ refundStatus: string; paymentStatus: string }>> {
    const client = requireSupabaseClient();
    const paymentId = params.paymentId.trim();
    const disputeId = params.disputeId.trim();
    const adminUserId = params.adminUserId.trim();

    if (!paymentId) return { ok: false, message: "Payment ID is required." };
    if (!disputeId) return { ok: false, message: "Dispute ID is required." };
    if (!adminUserId) return { ok: false, message: "Admin user ID is required." };

    const adminCheck = await requireAdminAccess({ expectedUserId: adminUserId });
    if (adminCheck.ok === false) return adminCheck;

    const now = new Date().toISOString();

    try {
      // Update payment status to 'refunded' and mark refunded_at
      const { data: paymentData, error: paymentError } = await client
        .from("payments")
        .update({
          status: "refunded",
          refunded_at: now,
          updated_at: now,
        })
        .eq("id", paymentId)
        .select("*")
        .single();

      if (paymentError) {
        return { ok: false, message: `Failed to update payment: ${formatPostgrestError(paymentError)}` };
      }

      // Update dispute refund_status to 'completed'
      const { error: disputeError } = await client
        .from("disputes")
        .update({
          refund_status: "completed",
          updated_at: now,
        })
        .eq("id", disputeId);

      if (disputeError) {
        return { ok: false, message: `Failed to update dispute: ${formatPostgrestError(disputeError)}` };
      }

      // Log to finance audit log
      const { error: auditError } = await client
        .from("finance_audit_log")
        .insert({
          admin_id: adminUserId,
          action: "refund_completed",
          dispute_id: disputeId,
          payment_id: paymentId,
          amount: paymentData?.amount,
          metadata: {
            payment_status: "refunded",
            refunded_at: now,
          },
        });

      if (auditError) {
        console.error("Audit log error:", auditError);
        // Don't fail the refund if audit log fails; log is informational
      }

      return {
        ok: true,
        data: {
          refundStatus: "completed",
          paymentStatus: "refunded",
        },
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to complete refund." };
    }
  },

  async failRefund(params: {
    paymentId: string;
    disputeId: string;
    adminUserId: string;
    failureReason: string;
  }): Promise<SupabaseResult<{ refundStatus: string }>> {
    const client = requireSupabaseClient();
    const paymentId = params.paymentId.trim();
    const disputeId = params.disputeId.trim();
    const adminUserId = params.adminUserId.trim();
    const failureReason = params.failureReason.trim();

    if (!paymentId) return { ok: false, message: "Payment ID is required." };
    if (!disputeId) return { ok: false, message: "Dispute ID is required." };
    if (!adminUserId) return { ok: false, message: "Admin user ID is required." };
    if (!failureReason) return { ok: false, message: "Failure reason is required." };

    const adminCheck = await requireAdminAccess({ expectedUserId: adminUserId });
    if (adminCheck.ok === false) return adminCheck;

    const now = new Date().toISOString();

    try {
      // Update dispute refund_status to 'failed'
      const { error: disputeError } = await client
        .from("disputes")
        .update({
          refund_status: "failed",
          updated_at: now,
        })
        .eq("id", disputeId);

      if (disputeError) {
        return { ok: false, message: `Failed to update dispute: ${formatPostgrestError(disputeError)}` };
      }

      // Get payment data for audit log
      const { data: paymentData } = await client
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      // Log to finance audit log
      const { error: auditError } = await client
        .from("finance_audit_log")
        .insert({
          admin_id: adminUserId,
          action: "refund_failed",
          dispute_id: disputeId,
          payment_id: paymentId,
          amount: paymentData?.amount,
          reason: failureReason,
          metadata: {
            failure_reason: failureReason,
            payment_status: paymentData?.status,
          },
        });

      if (auditError) {
        console.error("Audit log error:", auditError);
        // Don't fail if audit log fails; log is informational
      }

      return {
        ok: true,
        data: {
          refundStatus: "failed",
        },
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to mark refund as failed." };
    }
  },

  async getRefundStatus(params: {
    disputeId: string;
  }): Promise<SupabaseResult<{ refundStatus: string | null; paymentStatus: string | null; refundedAt: string | null }>> {
    const client = requireSupabaseClient();
    const disputeId = params.disputeId.trim();

    if (!disputeId) return { ok: false, message: "Dispute ID is required." };

    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    try {
      // Get dispute with refund status
      const { data: disputeData, error: disputeError } = await client
        .from("disputes")
        .select("refund_status, related_payment_id")
        .eq("id", disputeId)
        .single();

      if (disputeError) {
        return { ok: false, message: `Failed to fetch dispute: ${formatPostgrestError(disputeError)}` };
      }

      // If no related payment, return what we have
      if (!disputeData?.related_payment_id) {
        return {
          ok: true,
          data: {
            refundStatus: disputeData?.refund_status,
            paymentStatus: null,
            refundedAt: null,
          },
        };
      }

      // Get payment status and refunded_at
      const { data: paymentData } = await client
        .from("payments")
        .select("status, refunded_at")
        .eq("id", disputeData.related_payment_id)
        .single();

      return {
        ok: true,
        data: {
          refundStatus: disputeData.refund_status,
          paymentStatus: paymentData?.status,
          refundedAt: paymentData?.refunded_at,
        },
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to get refund status." };
    }
  },
};

export const supabaseSettings = {
  async getOrCreateAdminSecuritySettings(): Promise<
    SupabaseResult<{
      admin_user_id: string;
      mfa_policy: "optional" | "required";
      recovery_codes_generated_at: string | null;
      last_reauth_at: string | null;
      last_mfa_reset_requested_at: string | null;
      last_mfa_reset_by: string | null;
      created_at: string;
      updated_at: string;
    }>
  > {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const userId = adminCheck.data.userId;

    const { data, error } = await client
      .from("admin_security_settings")
      .select("*")
      .eq("admin_user_id", userId)
      .maybeSingle();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (data) {
      return { ok: true, data: data as any };
    }

    const { data: created, error: createError } = await client
      .from("admin_security_settings")
      .insert({ admin_user_id: userId })
      .select("*")
      .single();

    if (createError) return { ok: false, message: formatPostgrestError(createError) };
    if (!created) return { ok: false, message: "Security settings could not be created." };
    return { ok: true, data: created as any };
  },

  async updateAdminSecuritySettings(params: {
    lastReauthAt?: string | null;
    recoveryCodesGeneratedAt?: string | null;
    lastMfaResetRequestedAt?: string | null;
    lastMfaResetBy?: string | null;
    mfaPolicy?: "optional" | "required";
  }): Promise<
    SupabaseResult<{
      admin_user_id: string;
      mfa_policy: "optional" | "required";
      recovery_codes_generated_at: string | null;
      last_reauth_at: string | null;
      last_mfa_reset_requested_at: string | null;
      last_mfa_reset_by: string | null;
      created_at: string;
      updated_at: string;
    }>
  > {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const userId = adminCheck.data.userId;

    const payload: Record<string, unknown> = {};
    if ("lastReauthAt" in params) payload.last_reauth_at = params.lastReauthAt;
    if ("recoveryCodesGeneratedAt" in params) {
      payload.recovery_codes_generated_at = params.recoveryCodesGeneratedAt;
    }
    if ("lastMfaResetRequestedAt" in params) {
      payload.last_mfa_reset_requested_at = params.lastMfaResetRequestedAt;
    }
    if ("lastMfaResetBy" in params) payload.last_mfa_reset_by = params.lastMfaResetBy;
    if (params.mfaPolicy) payload.mfa_policy = params.mfaPolicy;

    const { data, error } = await client
      .from("admin_security_settings")
      .update(payload)
      .eq("admin_user_id", userId)
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Security settings could not be updated." };
    return { ok: true, data: data as any };
  },

  async insertAdminSecurityEvent(params: {
    action:
      | "mfa_enrolled"
      | "mfa_challenged"
      | "mfa_verified"
      | "recovery_codes_generated"
      | "recovery_code_used"
      | "mfa_reset_requested"
      | "mfa_disabled"
      | "password_changed";
    reason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<
    SupabaseResult<{
      id: string;
      admin_user_id: string;
      actor_id: string;
      action: string;
      reason: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }>
  > {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const userId = adminCheck.data.userId;

    const { data, error } = await client
      .from("admin_security_events")
      .insert({
        admin_user_id: userId,
        actor_id: userId,
        action: params.action,
        reason: params.reason?.trim() ?? "",
        metadata: params.metadata ?? {},
      })
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Security event could not be recorded." };
    return { ok: true, data: data as any };
  },

  async listAdminSecurityEvents(params?: {
    limit?: number;
  }): Promise<
    SupabaseResult<
      Array<{
        id: string;
        admin_user_id: string;
        actor_id: string;
        action: string;
        reason: string;
        metadata: Record<string, unknown>;
        created_at: string;
      }>
    >
  > {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;
    const userId = adminCheck.data.userId;

    const limit = Math.max(1, Math.min(params?.limit ?? 15, 50));
    const { data, error } = await client
      .from("admin_security_events")
      .select("*")
      .eq("admin_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as any };
  },

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

  async listPromoCodes(): Promise<SupabaseResult<PromoCodeRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const { data, error } = await client
      .from("promo_codes")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as PromoCodeRow[] };
  },

  async createPromoCode(params: {
    code: string;
    description: string;
    discountType: "percent" | "amount";
    discountValue: number;
    discountCurrency?: string | null;
    startsOn?: string | null;
    endsOn?: string | null;
    isActive?: boolean;
  }): Promise<SupabaseResult<PromoCodeRow>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const code = params.code.trim().toUpperCase();
    if (!code) return { ok: false, message: "Promo code is required." };
    if (!Number.isFinite(params.discountValue) || params.discountValue <= 0) {
      return { ok: false, message: "Discount value must be greater than 0." };
    }

    const { data, error } = await client
      .from("promo_codes")
      .insert({
        code,
        description: params.description.trim(),
        discount_type: params.discountType,
        discount_value: params.discountValue,
        discount_currency: params.discountCurrency ?? null,
        starts_on: params.startsOn ?? null,
        ends_on: params.endsOn ?? null,
        is_active: params.isActive ?? true,
        created_by_admin_id: adminCheck.data.userId,
        updated_by_admin_id: adminCheck.data.userId,
      })
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Promo could not be created." };
    return { ok: true, data: data as PromoCodeRow };
  },

  async updatePromoCode(params: {
    id: string;
    code?: string;
    description?: string;
    discountType?: "percent" | "amount";
    discountValue?: number;
    discountCurrency?: string | null;
    startsOn?: string | null;
    endsOn?: string | null;
    isActive?: boolean;
  }): Promise<SupabaseResult<PromoCodeRow>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const id = params.id.trim();
    if (!id) return { ok: false, message: "Promo id is required." };

    const payload: Partial<PromoCodeRow> & {
      discount_type?: string;
      discount_value?: number;
      discount_currency?: string | null;
      starts_on?: string | null;
      ends_on?: string | null;
      is_active?: boolean;
      updated_by_admin_id?: string;
    } = {
      updated_by_admin_id: adminCheck.data.userId,
    };

    if (typeof params.code === "string") payload.code = params.code.trim().toUpperCase();
    if (typeof params.description === "string") payload.description = params.description.trim();
    if (typeof params.discountType === "string") payload.discount_type = params.discountType;
    if (typeof params.discountValue === "number") payload.discount_value = params.discountValue;
    if ("discountCurrency" in params) payload.discount_currency = params.discountCurrency ?? null;
    if ("startsOn" in params) payload.starts_on = params.startsOn ?? null;
    if ("endsOn" in params) payload.ends_on = params.endsOn ?? null;
    if (typeof params.isActive === "boolean") payload.is_active = params.isActive;

    const { data, error } = await client
      .from("promo_codes")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Promo could not be updated." };
    return { ok: true, data: data as PromoCodeRow };
  },

  async deletePromoCode(id: string): Promise<SupabaseResult<{ id: string }>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const normalized = id.trim();
    if (!normalized) return { ok: false, message: "Promo id is required." };

    const { error } = await client.from("promo_codes").delete().eq("id", normalized);
    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: { id: normalized } };
  },

  async listNotificationTemplates(): Promise<SupabaseResult<NotificationTemplateRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const { data, error } = await client
      .from("notification_templates")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as NotificationTemplateRow[] };
  },

  async createNotificationTemplate(params: {
    name: string;
    channel: "push" | "email" | "sms";
    titleTemplate?: string;
    bodyTemplate: string;
    isActive?: boolean;
  }): Promise<SupabaseResult<NotificationTemplateRow>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const name = params.name.trim();
    if (!name) return { ok: false, message: "Template name is required." };
    const bodyTemplate = params.bodyTemplate.trim();
    if (!bodyTemplate) return { ok: false, message: "Template body is required." };

    const { data, error } = await client
      .from("notification_templates")
      .insert({
        name,
        channel: params.channel,
        title_template: params.titleTemplate?.trim() || null,
        body_template: bodyTemplate,
        payload_template: {},
        is_active: params.isActive ?? true,
        created_by_admin_id: adminCheck.data.userId,
        updated_by_admin_id: adminCheck.data.userId,
      })
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Template could not be created." };
    return { ok: true, data: data as NotificationTemplateRow };
  },

  async updateNotificationTemplate(params: {
    id: string;
    name?: string;
    channel?: "push" | "email" | "sms";
    titleTemplate?: string | null;
    bodyTemplate?: string;
    isActive?: boolean;
  }): Promise<SupabaseResult<NotificationTemplateRow>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const id = params.id.trim();
    if (!id) return { ok: false, message: "Template id is required." };

    const payload: Partial<NotificationTemplateRow> & {
      title_template?: string | null;
      body_template?: string;
      payload_template?: Record<string, unknown>;
      is_active?: boolean;
      updated_by_admin_id?: string;
    } = {
      updated_by_admin_id: adminCheck.data.userId,
    };

    if (typeof params.name === "string") payload.name = params.name.trim();
    if (typeof params.channel === "string") payload.channel = params.channel;
    if ("titleTemplate" in params) payload.title_template = params.titleTemplate ?? null;
    if (typeof params.bodyTemplate === "string") payload.body_template = params.bodyTemplate.trim();
    if (typeof params.isActive === "boolean") payload.is_active = params.isActive;

    const { data, error } = await client
      .from("notification_templates")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Template could not be updated." };
    return { ok: true, data: data as NotificationTemplateRow };
  },

  async deleteNotificationTemplate(id: string): Promise<SupabaseResult<{ id: string }>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const normalized = id.trim();
    if (!normalized) return { ok: false, message: "Template id is required." };
    const { error } = await client
      .from("notification_templates")
      .delete()
      .eq("id", normalized);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: { id: normalized } };
  },

  async listNotificationCampaigns(): Promise<SupabaseResult<NotificationCampaignRow[]>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const { data, error } = await client
      .from("notification_campaigns")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as NotificationCampaignRow[] };
  },

  async createNotificationCampaign(params: {
    name: string;
    description: string;
    channel: "push" | "email" | "sms";
    templateId?: string | null;
    status?: "draft" | "enabled" | "disabled" | "archived";
  }): Promise<SupabaseResult<NotificationCampaignRow>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const name = params.name.trim();
    if (!name) return { ok: false, message: "Campaign name is required." };

    const { data, error } = await client
      .from("notification_campaigns")
      .insert({
        name,
        description: params.description.trim(),
        channel: params.channel,
        template_id: params.templateId ?? null,
        status: params.status ?? "enabled",
        created_by_admin_id: adminCheck.data.userId,
        updated_by_admin_id: adminCheck.data.userId,
      })
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Campaign could not be created." };
    return { ok: true, data: data as NotificationCampaignRow };
  },

  async updateNotificationCampaign(params: {
    id: string;
    name?: string;
    description?: string;
    channel?: "push" | "email" | "sms";
    templateId?: string | null;
    status?: "draft" | "enabled" | "disabled" | "archived";
  }): Promise<SupabaseResult<NotificationCampaignRow>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const id = params.id.trim();
    if (!id) return { ok: false, message: "Campaign id is required." };

    const payload: Partial<NotificationCampaignRow> & {
      template_id?: string | null;
      updated_by_admin_id?: string;
    } = {
      updated_by_admin_id: adminCheck.data.userId,
    };

    if (typeof params.name === "string") payload.name = params.name.trim();
    if (typeof params.description === "string") payload.description = params.description.trim();
    if (typeof params.channel === "string") payload.channel = params.channel;
    if ("templateId" in params) payload.template_id = params.templateId ?? null;
    if (typeof params.status === "string") payload.status = params.status;

    const { data, error } = await client
      .from("notification_campaigns")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Campaign could not be updated." };
    return { ok: true, data: data as NotificationCampaignRow };
  },

  async deleteNotificationCampaign(id: string): Promise<SupabaseResult<{ id: string }>> {
    const client = requireSupabaseClient();
    const adminCheck = await requireAdminAccess();
    if (adminCheck.ok === false) return adminCheck;

    const normalized = id.trim();
    if (!normalized) return { ok: false, message: "Campaign id is required." };
    const { error } = await client
      .from("notification_campaigns")
      .delete()
      .eq("id", normalized);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: { id: normalized } };
  },
};
