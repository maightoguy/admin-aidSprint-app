import type { UserRequestHistoryItem, UserRequestStatus } from "@/components/dashboard/user-details/user-details.types";
import type { ContractorRecord, ContractorCurrentStatus, ContractorLifecycleState, ContractorPayoutStatus, ContractorVerificationState } from "@/components/dashboard/contractors/contractors.types";
import type { ServiceCategoryRecord, UrgencyTierRecord } from "@/components/dashboard/setting/marketplace-config.types";
import type { TransactionFilterableRecord } from "@/components/dashboard/transactions/transactions.utils";
import type { ContractorRow, JobRow, PaymentRow, ProfileRow, ServiceCategoryRow, ServiceTypeRow, UrgencyTierRow, WithdrawalRow } from "./data";

function formatDateLabel(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function compactCode(prefix: string, id: string) {
  const normalized = String(id).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const head = normalized.slice(0, 3).padEnd(3, "X");
  const tail = normalized.slice(3, 9).padEnd(6, "0");
  return `${prefix} ${head} ${tail}`;
}

export function mapJobStatusToUserRequestStatus(status: string): UserRequestStatus {
  const normalized = String(status).trim().toLowerCase();

  if (normalized === "cancelled") return "Cancelled";
  if (normalized === "completed") return "Completed";

  if (
    normalized === "accepted" ||
    normalized === "contractor_en_route" ||
    normalized === "arrived" ||
    normalized === "in_progress"
  ) {
    return "Active";
  }

  if (normalized === "broadcast" || normalized === "requested") {
    return "Pending";
  }

  return "Pending";
}

export function mapJobStatusToLifecycleStatus(
  status: string,
): UserRequestHistoryItem["lifecycleStatus"] {
  const normalized = String(status).trim().toLowerCase();
  if (normalized === "cancelled") return "Cancelled";
  if (normalized === "completed") return "Completed";
  if (normalized === "accepted" || normalized === "contractor_en_route" || normalized === "arrived") {
    return "Assigned";
  }
  return "Current";
}

export function mapUrgencyTierToUrgencyLabel(urgencyTier: string) {
  const normalized = String(urgencyTier).trim().toLowerCase();
  if (normalized === "urgent" || normalized === "critical" || normalized === "emergency") {
    return "Emergency";
  }
  return "Standard";
}

export function mapJobRowToUserRequestHistoryItem(params: {
  job: JobRow;
  userProfile?: Pick<ProfileRow, "full_name" | "email"> | null;
  contractorProfile?: Pick<ProfileRow, "full_name" | "email"> | null;
}): UserRequestHistoryItem {
  const { job, userProfile, contractorProfile } = params;

  const hoursLabel = `${job.hours}hrs(${formatCurrency(job.base_price * job.hours)})`;
  const baseFeeLabel = `${formatCurrency(job.base_price)}/hr`;
  const totalPayment = job.final_price ?? job.price_estimate;

  return {
    id: job.id,
    requestCode: compactCode("JOB", job.id),
    service: job.service_type || "Service",
    location: job.address || "—",
    date: formatDateLabel(job.created_at),
    status: mapJobStatusToUserRequestStatus(job.status),
    completedRequests: "—",
    rating: "—",
    urgencyLabel: mapUrgencyTierToUrgencyLabel(job.urgency_tier),
    totalPayment: formatCurrency(Number(totalPayment) || 0),
    baseFee: baseFeeLabel,
    totalHours: hoursLabel,
    description: job.description || "—",
    platformFee: formatCurrency(Number(job.platform_fee) || 0),
    lifecycleStatus: mapJobStatusToLifecycleStatus(job.status),
    contractorLocation: contractorProfile?.full_name?.trim() ? "Assigned contractor" : "Unassigned",
    userLocation: userProfile?.full_name?.trim() ? "Job owner" : "—",
    etaLabel:
      job.status === "contractor_en_route"
        ? "En route"
        : job.status === "arrived"
          ? "Arrived"
          : "—",
    uploadedImages: [],
  };
}

function mapAvailabilityStatusToCurrentStatus(value: string): ContractorCurrentStatus {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "online") return "Online";
  if (normalized === "busy") return "Busy";
  return "Offline";
}

function mapAvailabilityStatusToLifecycleState(value: string): ContractorLifecycleState {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "pending_approval") return "Pending approval";
  return "Active";
}

function mapContractorVerificationState(contractor: ContractorRow): ContractorVerificationState {
  if (contractor.is_verified) return "Verified";
  if (contractor.id_verification_complete && contractor.police_check_complete && contractor.service_licences_complete) {
    return "Pending review";
  }
  return "Pending review";
}

function mapContractorPayoutStatus(contractor: ContractorRow): ContractorPayoutStatus {
  if (!contractor.stripe_onboarding_completed) return "Onboarding";
  if (contractor.payouts_blocked_reason?.trim()) return "Blocked";
  return "Ready";
}

export function mapContractorRowToContractorRecord(params: {
  contractor: ContractorRow;
  profile: ProfileRow;
  locationLabel?: string;
  completionRate?: number;
  responseTimeLabel?: string;
  repeatedComplaints?: number;
  lastActiveLabel?: string;
  serviceZoneLabel?: string;
  pendingPayoutAmount?: string;
  riskFlags?: string[];
}): ContractorRecord {
  const { contractor, profile } = params;

  const fullName = profile.full_name?.trim() || `${profile.first_name} ${profile.last_name}`.trim() || "—";

  return {
    id: contractor.id,
    name: fullName,
    email: profile.email,
    phone: profile.phone,
    location: params.locationLabel ?? "—",
    currentStatus: mapAvailabilityStatusToCurrentStatus(contractor.availability_status),
    totalServicesProvided: 0,
    dateJoined: formatDateLabel(contractor.created_at),
    accountStatus: "Active",
    lifecycleState: mapAvailabilityStatusToLifecycleState(contractor.availability_status),
    serviceCategory: "Plumbing",
    bio: profile.full_name?.trim() ? `Contractor profile for ${fullName}` : "—",
    firstName: profile.first_name,
    lastName: profile.last_name,
    gender: profile.gender ?? "—",
    servicesProvided: [],
    locations: [],
    verificationState: mapContractorVerificationState(contractor),
    rating: Number(contractor.rating) || 0,
    totalRatings: contractor.total_ratings,
    acceptanceRate: Number(contractor.acceptance_rate) || 0,
    completionRate: params.completionRate ?? 0,
    responseTimeLabel: params.responseTimeLabel ?? "—",
    totalJobsOffered: contractor.total_jobs_offered,
    totalJobsAccepted: contractor.total_jobs_accepted,
    totalJobsCompleted: 0,
    repeatedComplaints: params.repeatedComplaints ?? 0,
    lastActiveLabel: params.lastActiveLabel ?? "—",
    serviceZoneLabel: params.serviceZoneLabel ?? "—",
    riskLevel: "Low",
    riskFlags: params.riskFlags ?? [],
    payoutStatus: mapContractorPayoutStatus(contractor),
    pendingPayoutAmount: params.pendingPayoutAmount ?? formatCurrency(0),
    payoutsBlockedReason: contractor.payouts_blocked_reason ?? undefined,
  };
}

export function mapServiceCategoryRowsToRecords(params: {
  categories: ServiceCategoryRow[];
  serviceTypes: ServiceTypeRow[];
}): ServiceCategoryRecord[] {
  const typesByCategoryId = params.serviceTypes.reduce<Record<string, number>>((acc, type) => {
    acc[type.category_id] = (acc[type.category_id] ?? 0) + 1;
    return acc;
  }, {});

  return params.categories.map((category) => ({
    id: category.id,
    name: category.name,
    status: category.is_active ? "Enabled" : "Disabled",
    serviceTypesCount: typesByCategoryId[category.id] ?? 0,
    updatedAtLabel: formatDateLabel(category.created_at),
  }));
}

export function mapUrgencyTierRowsToRecords(rows: UrgencyTierRow[]): UrgencyTierRecord[] {
  return rows.map((row) => {
    const extraFee = Number(row.extra_fee) || 0;
    const multiplier = 1 + extraFee / 100;

    return {
      id: row.id,
      label: row.label || row.name,
      multiplier: Number.isFinite(multiplier) ? multiplier : 1,
      status: row.is_active ? "Enabled" : "Disabled",
      updatedAtLabel: formatDateLabel(row.created_at),
    };
  });
}

function mapPaymentStatusToFinanceStatus(value: string) {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "authorized") return "Authorized";
  if (normalized === "captured") return "Captured";
  if (normalized === "refunded") return "Refunded";
  if (normalized === "failed" || normalized === "requires_payment_method" || normalized === "cancelled") {
    return "Failed";
  }
  if (normalized === "paid") return "Captured";
  return "Authorized";
}

function mapWithdrawalStatusToFinanceStatus(value: string) {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "completed") return "Completed";
  if (normalized === "failed") return "Failed";
  if (normalized === "processing") return "Processing";
  return "Requested";
}

export function mapPaymentRowToTransactionFilterableRecord(params: {
  payment: PaymentRow;
  contractorProfile?: Pick<ProfileRow, "full_name" | "email"> | null;
}): TransactionFilterableRecord {
  const { payment, contractorProfile } = params;

  return {
    id: payment.id,
    transactionCode: payment.stripe_payment_intent_id?.trim() || compactCode("PAY", payment.id),
    contractorName: contractorProfile?.full_name?.trim() || "—",
    contractorEmail: contractorProfile?.email?.trim() || "—",
    type: "Service payment",
    amount: Number(payment.amount) || 0,
    createdAtLabel: formatDateLabel(payment.created_at),
    status: mapPaymentStatusToFinanceStatus(payment.status),
    accountName: "—",
    bankName: "—",
    payoutReadiness: undefined,
  };
}

export function mapWithdrawalRowToTransactionFilterableRecord(params: {
  withdrawal: WithdrawalRow;
  contractorProfile?: Pick<ProfileRow, "full_name" | "email"> | null;
}): TransactionFilterableRecord {
  const { withdrawal, contractorProfile } = params;

  return {
    id: withdrawal.id,
    transactionCode: withdrawal.reference?.trim() || compactCode("WDR", withdrawal.id),
    contractorName: contractorProfile?.full_name?.trim() || "—",
    contractorEmail: contractorProfile?.email?.trim() || "—",
    type: "Withdrawal",
    amount: -(Number(withdrawal.amount) || 0),
    createdAtLabel: formatDateLabel(withdrawal.created_at),
    status: mapWithdrawalStatusToFinanceStatus(withdrawal.status),
    accountName: "—",
    bankName: "—",
    payoutReadiness: undefined,
  };
}

