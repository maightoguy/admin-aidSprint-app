import type { UserRequestHistoryItem, UserRequestStatus } from "@/components/dashboard/user-details/user-details.types";
import type { ContractorKycDocumentRecord, ContractorKycState, ContractorRecord, ContractorCurrentStatus, ContractorLifecycleState, ContractorPayoutStatus, ContractorServiceCategory, ContractorTransactionRecord, ContractorVerificationState } from "@/components/dashboard/contractors/contractors.types";
import type { ServiceCategoryRecord, UrgencyTierRecord } from "@/components/dashboard/setting/marketplace-config.types";
import type { TransactionFilterableRecord } from "@/components/dashboard/transactions/transactions.utils";
import type { ContractorBankAccountRow, ContractorDocumentRow, ContractorRow, JobRow, PaymentRow, ProfileRow, ReviewRow, ServiceCategoryRow, ServiceTypeRow, UrgencyTierRow, WithdrawalRow } from "./data";

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

function formatSignedCurrency(amount: number) {
  const absolute = Math.abs(amount);
  const formatted = formatCurrency(absolute);
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

function createPlaceholderFile(name: string, mimeType: string) {
  if (typeof File === "undefined") {
    return {} as File;
  }

  return new File([""], name || "document", {
    type: mimeType || "application/octet-stream",
  });
}

function compactCode(prefix: string, id: string) {
  const normalized = String(id).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const head = normalized.slice(0, 3).padEnd(3, "X");
  const tail = normalized.slice(3, 9).padEnd(6, "0");
  return `${prefix} ${head} ${tail}`;
}

function mapServiceValueToCategory(value: string): ContractorServiceCategory {
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("clean")) return "Cleaning";
  if (normalized.includes("baby")) return "Baby sitting";
  if (normalized.includes("electric")) return "Electrician";
  if (normalized.includes("laundry")) return "Laundry";
  if (normalized.includes("carp")) return "Carpentry";
  return "Plumbing";
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
  riskLevel?: ContractorRecord["riskLevel"];
  verificationState?: ContractorVerificationState;
  payoutStatus?: ContractorPayoutStatus;
  totalJobsCompleted?: number;
  servicesProvided?: ContractorServiceCategory[];
  watchlistReason?: string;
}): ContractorRecord {
  const { contractor, profile } = params;

  const fullName = profile.full_name?.trim() || `${profile.first_name} ${profile.last_name}`.trim() || "—";
  const servicesProvided =
    params.servicesProvided && params.servicesProvided.length
      ? params.servicesProvided
      : contractor.services.length
        ? contractor.services.map(mapServiceValueToCategory)
        : [mapServiceValueToCategory("plumbing")];
  const primaryService = servicesProvided[0] ?? "Plumbing";

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
    serviceCategory: primaryService,
    bio: profile.full_name?.trim() ? `Contractor profile for ${fullName}` : "—",
    firstName: profile.first_name,
    lastName: profile.last_name,
    gender: profile.gender ?? "—",
    servicesProvided,
    locations: [],
    verificationState: params.verificationState ?? mapContractorVerificationState(contractor),
    rating: Number(contractor.rating) || 0,
    totalRatings: contractor.total_ratings,
    acceptanceRate: Number(contractor.acceptance_rate) || 0,
    completionRate: params.completionRate ?? 0,
    responseTimeLabel: params.responseTimeLabel ?? "—",
    totalJobsOffered: contractor.total_jobs_offered,
    totalJobsAccepted: contractor.total_jobs_accepted,
    totalJobsCompleted: params.totalJobsCompleted ?? 0,
    repeatedComplaints: params.repeatedComplaints ?? 0,
    lastActiveLabel: params.lastActiveLabel ?? "—",
    serviceZoneLabel: params.serviceZoneLabel ?? "—",
    riskLevel: params.riskLevel ?? "Low",
    riskFlags: params.riskFlags ?? [],
    watchlistReason: params.watchlistReason,
    payoutStatus: params.payoutStatus ?? mapContractorPayoutStatus(contractor),
    pendingPayoutAmount: params.pendingPayoutAmount ?? formatCurrency(0),
    payoutsBlockedReason: contractor.payouts_blocked_reason ?? undefined,
  };
}

function mapDocumentStatus(value: string) {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "approved") return "accepted";
  if (normalized === "rejected") return "rejected";
  return "pending";
}

export function mapContractorDocumentsToKycInitialState(params: {
  documents: ContractorDocumentRow[];
  reviewerProfiles?: Map<string, Pick<ProfileRow, "full_name">>;
}): Partial<ContractorKycState> {
  const { documents, reviewerProfiles } = params;

  const buildDoc = (document: ContractorDocumentRow): ContractorKycDocumentRecord => ({
    file: createPlaceholderFile(
      document.file_name || document.document_type,
      document.mime_type || "application/octet-stream",
    ),
    fileName: document.file_name || document.document_type,
    fileSize: 0,
    fileSizeLabel: "Uploaded",
    mimeType: document.mime_type || "application/octet-stream",
    uploadedAtIso: document.created_at,
    uploadedAtLabel: formatDateLabel(document.created_at),
    objectUrl: document.storage_path || "",
  });

  const idDoc = documents.find((doc) =>
    ["government_id", "drivers_licence", "passport", "national_id"].includes(doc.document_type),
  );
  const policeDoc = documents.find((doc) => doc.document_type === "police_check");
  const serviceProviderDocs = documents.filter((doc) => doc.document_type === "service_licence");

  const idReviewedBy =
    idDoc?.reviewed_by
      ? reviewerProfiles?.get(idDoc.reviewed_by)?.full_name || "Admin"
      : undefined;
  const policeReviewedBy =
    policeDoc?.reviewed_by
      ? reviewerProfiles?.get(policeDoc.reviewed_by)?.full_name || "Admin"
      : undefined;
  const serviceReviewedBy = serviceProviderDocs[0]?.reviewed_by
    ? reviewerProfiles?.get(serviceProviderDocs[0].reviewed_by ?? "")?.full_name || "Admin"
    : undefined;

  return {
    activeCategory: "id",
    idDoc: idDoc ? buildDoc(idDoc) : null,
    idStatus: idDoc ? mapDocumentStatus(idDoc.status) : null,
    idReason: idDoc?.rejection_reason ?? undefined,
    idReviewedAt: idDoc?.reviewed_at ? formatDateLabel(idDoc.reviewed_at) : undefined,
    idReviewedBy,
    policeDoc: policeDoc ? buildDoc(policeDoc) : null,
    policeStatus: policeDoc ? mapDocumentStatus(policeDoc.status) : null,
    policeReason: policeDoc?.rejection_reason ?? undefined,
    policeReviewedAt: policeDoc?.reviewed_at
      ? formatDateLabel(policeDoc.reviewed_at)
      : undefined,
    policeReviewedBy,
    serviceProviderDocs: serviceProviderDocs.map(buildDoc),
    serviceProviderStatus: serviceProviderDocs[0]
      ? mapDocumentStatus(serviceProviderDocs[0].status)
      : null,
    serviceProviderReason: serviceProviderDocs[0]?.rejection_reason ?? undefined,
    serviceProviderReviewedAt: serviceProviderDocs[0]?.reviewed_at
      ? formatDateLabel(serviceProviderDocs[0].reviewed_at)
      : undefined,
    serviceProviderReviewedBy: serviceReviewedBy,
  };
}

export function deriveContractorVerificationState(params: {
  contractor: ContractorRow;
  documents: ContractorDocumentRow[];
}): ContractorVerificationState {
  const { contractor, documents } = params;
  if (documents.some((document) => String(document.status).toLowerCase() === "rejected")) {
    return "Rejected";
  }
  if (contractor.is_verified) {
    return "Verified";
  }
  return "Pending review";
}

export function deriveContractorRiskState(params: {
  contractor: ContractorRow;
  reviews: ReviewRow[];
  documents: ContractorDocumentRow[];
  completionRate: number;
}): {
  riskLevel: ContractorRecord["riskLevel"];
  riskFlags: string[];
  watchlistReason?: string;
} {
  const flags: string[] = [];
  const lowRatings = params.reviews.filter((review) => Number(review.rating) <= 3).length;

  if (params.documents.some((document) => String(document.status).toLowerCase() === "rejected")) {
    flags.push("Rejected KYC");
  }
  if ((Number(params.contractor.rating) || 0) < 4) {
    flags.push("Low rating");
  }
  if (lowRatings >= 2) {
    flags.push("Repeated complaints");
  }
  if (params.contractor.payouts_blocked_reason?.trim()) {
    flags.push("Payout blocked");
  }
  if (params.completionRate > 0 && params.completionRate < 0.85) {
    flags.push("Low completion");
  }

  if (flags.length >= 3) {
    return {
      riskLevel: "High",
      riskFlags: flags,
      watchlistReason:
        params.contractor.payouts_blocked_reason?.trim() ||
        "Multiple trust and payout indicators need manual review.",
    };
  }

  if (flags.length >= 1) {
    return {
      riskLevel: "Medium",
      riskFlags: flags,
      watchlistReason:
        params.contractor.payouts_blocked_reason?.trim() ||
        "Monitor trust, verification, or payout signals for this contractor.",
    };
  }

  return {
    riskLevel: "Low",
    riskFlags: ["Verified"],
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

function mapPaymentStatusToContractorTransactionStatus(
  value: string,
): ContractorTransactionRecord["status"] {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "captured" || normalized === "paid") return "Completed";
  if (normalized === "failed" || normalized === "cancelled" || normalized === "refunded") {
    return "Failed";
  }
  return "Pending";
}

function mapWithdrawalStatusToContractorTransactionStatus(
  value: string,
): ContractorTransactionRecord["status"] {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "completed") return "Completed";
  if (normalized === "failed") return "Failed";
  return "Pending";
}

export function mapPaymentRowToContractorTransactionRecord(params: {
  payment: PaymentRow;
  bankAccount?: ContractorBankAccountRow | null;
}): ContractorTransactionRecord {
  const { payment, bankAccount } = params;
  return {
    id: payment.id,
    transactionCode:
      payment.stripe_payment_intent_id?.trim() || compactCode("PAY", payment.id),
    type: "Service payment",
    amount: Number(payment.contractor_payout) || Number(payment.amount) || 0,
    dateTime: formatDateLabel(payment.created_at),
    status: mapPaymentStatusToContractorTransactionStatus(payment.status),
    accountNumber: bankAccount?.account_number || "—",
    accountName: bankAccount?.account_name || "—",
    bankName: bankAccount?.bank_name || "—",
    fee: Number(payment.platform_fee) || 0,
  };
}

export function mapWithdrawalRowToContractorTransactionRecord(params: {
  withdrawal: WithdrawalRow;
  bankAccount?: ContractorBankAccountRow | null;
}): ContractorTransactionRecord {
  const { withdrawal, bankAccount } = params;
  return {
    id: withdrawal.id,
    transactionCode: withdrawal.reference?.trim() || compactCode("WDR", withdrawal.id),
    type: "Withdrawal",
    amount: -(Number(withdrawal.amount) || 0),
    dateTime: formatDateLabel(withdrawal.created_at),
    status: mapWithdrawalStatusToContractorTransactionStatus(withdrawal.status),
    accountNumber: bankAccount?.account_number || "—",
    accountName: bankAccount?.account_name || "—",
    bankName: bankAccount?.bank_name || "—",
    fee: 0,
  };
}

export function sumPendingWithdrawalAmount(rows: WithdrawalRow[]) {
  return formatCurrency(
    rows
      .filter((row) => {
        const normalized = String(row.status).toLowerCase();
        return normalized === "pending" || normalized === "processing";
      })
      .reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
  );
}

export { formatDateLabel, formatCurrency, formatSignedCurrency };
