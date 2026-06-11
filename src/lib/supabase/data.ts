import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";

export type SupabaseResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function formatPostgrestError(error: PostgrestError | null) {
  if (!error) return "Something went wrong. Please try again.";
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
    const { data, error } = await client
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Job not found." };
    return { ok: true, data: data as JobRow };
  },

  async listByContractorIds(
    contractorIds: string[],
    params?: { limit?: number },
  ): Promise<SupabaseResult<JobRow[]>> {
    const client = requireSupabaseClient();
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
};

export const supabaseContractors = {
  async listLatest(params?: { limit?: number }): Promise<SupabaseResult<ContractorRow[]>> {
    const client = requireSupabaseClient();
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
    const { data, error } = await client
      .from("contractors")
      .select("*")
      .eq("id", contractorId)
      .single();

    if (error) return { ok: false, message: formatPostgrestError(error) };
    if (!data) return { ok: false, message: "Contractor not found." };
    return { ok: true, data: data as ContractorRow };
  },
};

export const supabaseFinance = {
  async listPayments(params?: { limit?: number }): Promise<SupabaseResult<PaymentRow[]>> {
    const client = requireSupabaseClient();
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
    const limit = Math.max(1, Math.min(200, params?.limit ?? 50));

    const { data, error } = await client
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as WithdrawalRow[] };
  },

  async listPaymentsByPayeeIds(
    payeeIds: string[],
    params?: { limit?: number },
  ): Promise<SupabaseResult<PaymentRow[]>> {
    const client = requireSupabaseClient();
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
};

export const supabaseSettings = {
  async listPlatformConfig(): Promise<SupabaseResult<PlatformConfigRow[]>> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("platform_config")
      .select("*")
      .order("key", { ascending: true });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as PlatformConfigRow[] };
  },

  async listServiceCategories(): Promise<SupabaseResult<ServiceCategoryRow[]>> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("service_categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as ServiceCategoryRow[] };
  },

  async listServiceTypes(): Promise<SupabaseResult<ServiceTypeRow[]>> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("service_types")
      .select("*")
      .order("name", { ascending: true });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as ServiceTypeRow[] };
  },

  async listUrgencyTiers(): Promise<SupabaseResult<UrgencyTierRow[]>> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("urgency_tiers")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) return { ok: false, message: formatPostgrestError(error) };
    return { ok: true, data: (data ?? []) as UrgencyTierRow[] };
  },
};
