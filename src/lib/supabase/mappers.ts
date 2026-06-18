import type { UserRequestHistoryItem, UserRequestStatus } from "@/components/dashboard/user-details/user-details.types";
import type { ContractorKycDocumentRecord, ContractorKycState, ContractorRecord, ContractorCurrentStatus, ContractorLifecycleState, ContractorPayoutStatus, ContractorServiceCategory, ContractorTransactionRecord, ContractorVerificationState } from "@/components/dashboard/contractors/contractors.types";
import type {
  NotificationCampaignRecord,
  NotificationTemplateRecord,
  NotificationChannel,
  PlatformConfigRecord,
  PromoRecord,
  ServiceCategoryRecord,
  ServiceTypeRecord,
  UrgencyTierRecord,
} from "@/components/dashboard/setting/marketplace-config.types";
import type { TransactionFilterableRecord } from "@/components/dashboard/transactions/transactions.utils";
import type {
  SupportTicket,
  SupportTicketAttachment,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/components/dashboard/support/support.data";
import type {
  DisputeActionLogEntry,
  DisputeAttachment,
  DisputeLifecycleState,
  DisputeNote,
  DisputePriority,
  DisputeReason,
  DisputeRecord,
  DisputeResolutionType,
} from "@/components/dashboard/disputes/disputes.types";
import type {
  ContractorBankAccountRow,
  ContractorDocumentRow,
  ContractorRow,
  DisputeEvidenceRow,
  DisputeEventRow,
  DisputeRow,
  JobRow,
  NotificationCampaignRow,
  PaymentRow,
  PromoCodeRow,
  PlatformConfigRow,
  ProfileRow,
  NotificationTemplateRow,
  ReviewRow,
  ServiceCategoryRow,
  ServiceTypeRow,
  SupportTicketEventRow,
  SupportTicketRow,
  UrgencyTierRow,
  WithdrawalRow,
} from "./data";

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

function parseTimestamp(value: string | null | undefined) {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

export function isContractorCurrentlySuspended(
  contractor: Pick<ContractorRow, "suspended_at" | "restored_at">,
) {
  const suspendedAt = parseTimestamp(contractor.suspended_at);
  if (!Number.isFinite(suspendedAt)) {
    return false;
  }

  const restoredAt = parseTimestamp(contractor.restored_at);
  if (!Number.isFinite(restoredAt)) {
    return true;
  }

  return suspendedAt > restoredAt;
}

function mapAvailabilityStatusToLifecycleState(contractor: ContractorRow): ContractorLifecycleState {
  if (isContractorCurrentlySuspended(contractor)) return "Suspended";

  const normalized = String(contractor.availability_status).trim().toLowerCase();
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
  const isSuspended = isContractorCurrentlySuspended(contractor);

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
    accountStatus: isSuspended ? "Deactivated" : "Active",
    lifecycleState: mapAvailabilityStatusToLifecycleState(contractor),
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
    suspensionReason: isSuspended ? contractor.suspension_reason?.trim() || undefined : undefined,
    restoreReason: !isSuspended ? contractor.restore_reason?.trim() || undefined : undefined,
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
    documentId: document.id,
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

export function mapServiceTypeRowsToRecords(params: {
  serviceTypes: ServiceTypeRow[];
  categories: ServiceCategoryRow[];
}): ServiceTypeRecord[] {
  const categoryNameById = new Map(
    params.categories.map((category) => [category.id, category.name]),
  );

  return params.serviceTypes.map((serviceType) => ({
    id: serviceType.id,
    name: serviceType.name,
    categoryId: serviceType.category_id,
    categoryName: categoryNameById.get(serviceType.category_id) ?? "—",
    basePrice: Number(serviceType.base_price) || 0,
    isAdditional: Boolean(serviceType.is_price_additional),
    status: serviceType.is_active ? "Enabled" : "Disabled",
    updatedAtLabel: formatDateLabel(serviceType.created_at),
  }));
}

export function mapPlatformConfigRowsToRecords(
  rows: PlatformConfigRow[],
): PlatformConfigRecord[] {
  return rows.map((row) => ({
    key: row.key,
    value: row.value,
    description: row.description,
    updatedAtLabel: formatDateLabel(row.updated_at),
  }));
}

function mapNotificationChannel(value: string): NotificationChannel {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "email") return "Email";
  if (normalized === "sms") return "SMS";
  return "Push";
}

export function mapPromoCodeRowsToRecords(rows: PromoCodeRow[]): PromoRecord[] {
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type === "amount" ? "Amount" : "Percent",
    discountValue: Number(row.discount_value) || 0,
    startDate: row.starts_on ?? "",
    endDate: row.ends_on ?? "",
    status: row.is_active ? "Enabled" : "Disabled",
    updatedAtLabel: formatDateLabel(row.updated_at),
  }));
}

export function mapNotificationTemplateRowsToRecords(
  rows: NotificationTemplateRow[],
): NotificationTemplateRecord[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    channel: mapNotificationChannel(row.channel),
    titleTemplate: row.title_template ?? "",
    bodyTemplate: row.body_template,
    status: row.is_active ? "Enabled" : "Disabled",
    updatedAtLabel: formatDateLabel(row.updated_at),
  }));
}

export function mapNotificationCampaignRowsToRecords(params: {
  campaigns: NotificationCampaignRow[];
  templates: NotificationTemplateRow[];
}): NotificationCampaignRecord[] {
  const templateNameById = new Map(
    params.templates.map((template) => [template.id, template.name]),
  );

  return params.campaigns.map((row) => ({
    id: row.id,
    name: row.name,
    channel: mapNotificationChannel(row.channel),
    templateId: row.template_id,
    templateName: row.template_id
      ? (templateNameById.get(row.template_id) ?? undefined)
      : undefined,
    status: row.status === "enabled" ? "Enabled" : "Disabled",
    updatedAtLabel: formatDateLabel(row.updated_at),
    description: row.description,
  }));
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

function formatShortCode(prefix: string, id: string) {
  const fragment = String(id).replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
  return `#${prefix}-${fragment || "UNKNOWN"}`;
}

function getProfileDisplayName(profile?: Pick<ProfileRow, "full_name" | "first_name" | "last_name"> | null) {
  if (!profile) return "—";
  return (
    profile.full_name?.trim() ||
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
    "—"
  );
}

function toUiPriority(
  value: string,
): SupportTicketPriority | DisputePriority {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "urgent") return "Urgent";
  if (normalized === "high") return "High";
  if (normalized === "medium") return "Medium";
  return "Low";
}

export function mapSupportStatusToUiStatus(value: string): SupportTicketStatus {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "open") return "Open";
  if (normalized === "resolved" || normalized === "closed") return "Resolved";
  return "Pending";
}

export function mapSupportUiStatusToDbStatus(
  status: Extract<SupportTicketStatus, "Pending" | "Resolved">,
) {
  return status === "Resolved" ? "resolved" : "in_review";
}

function inferSupportCategory(subject: string, description: string) {
  const haystack = `${subject} ${description}`.toLowerCase();
  if (haystack.includes("withdraw")) return "Withdrawal";
  if (haystack.includes("payment") || haystack.includes("charge") || haystack.includes("refund")) {
    return "Service payment";
  }
  if (haystack.includes("verif") || haystack.includes("kyc")) return "Verification";
  if (haystack.includes("account")) return "Account";
  return "General";
}

function extractSupportAttachments(
  events: SupportTicketEventRow[],
): SupportTicketAttachment[] {
  const attachments: SupportTicketAttachment[] = [];

  for (const event of events) {
    const rawAttachments = Array.isArray(event.metadata?.attachments)
      ? event.metadata.attachments
      : [];

    for (const attachment of rawAttachments) {
      if (!attachment || typeof attachment !== "object") continue;
      const record = attachment as Record<string, unknown>;
      const url = typeof record.url === "string" ? record.url.trim() : "";
      if (!url) continue;
      attachments.push({
        id:
          (typeof record.id === "string" && record.id.trim()) ||
          `${event.id}-${attachments.length + 1}`,
        url,
        name:
          (typeof record.name === "string" && record.name.trim()) ||
          "attachment",
        type:
          (typeof record.type === "string" && record.type.trim()) ||
          "application/octet-stream",
      });
    }
  }

  return attachments;
}

export function mapSupportTicketRowToSupportTicket(params: {
  ticket: SupportTicketRow;
  requesterProfile?: ProfileRow | null;
  job?: JobRow | null;
  events?: SupportTicketEventRow[];
}): SupportTicket {
  const { ticket, requesterProfile, job, events = [] } = params;
  const requesterRole =
    ticket.requester_role === "contractor" ? "contractor" : ticket.requester_role === "admin" ? "admin" : "user";

  return {
    id: ticket.id,
    ticketId: formatShortCode("TKT", ticket.id),
    userId: ticket.requester_id,
    userName: getProfileDisplayName(requesterProfile),
    userEmail: requesterProfile?.email?.trim() || "—",
    requesterRole,
    profilePath:
      requesterRole === "contractor"
        ? `/contractors/${ticket.requester_id}`
        : `/users/${ticket.requester_id}`,
    category: inferSupportCategory(ticket.subject, ticket.description),
    subject: ticket.subject || "Support ticket",
    description: ticket.description || "—",
    status: mapSupportStatusToUiStatus(ticket.status),
    backendStatus: ticket.status,
    priority: toUiPriority(ticket.priority) as SupportTicketPriority,
    dateCreated: formatDateLabel(ticket.created_at),
    updatedAt: formatDateLabel(ticket.updated_at),
    requestId: job ? formatShortCode("REQ", job.id) : undefined,
    attachments: extractSupportAttachments(events),
    dataSource: "live",
  };
}

export function mapDisputeStatusToLifecycleState(
  value: string,
): DisputeLifecycleState {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "open") return "Opened";
  if (normalized === "awaiting_evidence") return "EvidenceRequested";
  if (normalized === "proposed_resolution") return "ProposedResolution";
  if (normalized === "resolved") return "Resolved";
  if (normalized === "rejected") return "Rejected";
  return "UnderReview";
}

export function mapDisputeResolutionTypeToDb(
  value: DisputeResolutionType,
):
  | "no_action"
  | "refund"
  | "partial_refund"
  | "payout_block"
  | "chargeback"
  | null {
  if (value === "NoAction") return "no_action";
  if (value === "RefundCustomer") return "refund";
  if (value === "PartialRefund") return "partial_refund";
  if (value === "ReversePayout") return "payout_block";
  return null;
}

function mapDbResolutionTypeToUi(
  value: string | null | undefined,
): DisputeResolutionType | undefined {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "refund") return "RefundCustomer";
  if (normalized === "partial_refund") return "PartialRefund";
  if (normalized === "payout_block") return "ReversePayout";
  if (normalized === "no_action") return "NoAction";
  return undefined;
}

function deriveDisputeReason(
  disputeType: string,
  reason: string,
): DisputeReason {
  const normalizedReason = String(reason).trim().toLowerCase();
  if (normalizedReason.includes("fraud")) return "Fraud";
  if (normalizedReason.includes("no show") || normalizedReason.includes("no-show")) {
    return "NoShow";
  }
  if (normalizedReason.includes("overcharge") || normalizedReason.includes("over charge")) {
    return "Overcharge";
  }

  const normalizedType = String(disputeType).trim().toLowerCase();
  if (normalizedType === "service_quality") return "ServiceQuality";
  if (normalizedType === "payment") return "Overcharge";
  if (normalizedType === "behavior") return "NoShow";
  if (normalizedType === "safety") return "Safety";
  return "Other";
}

function mapDisputeEvidenceToAttachments(
  rows: DisputeEvidenceRow[],
): DisputeAttachment[] {
  return rows
    .filter((row) => Boolean(row.url))
    .map((row) => ({
      id: row.id,
      type:
        row.evidence_type === "image"
          ? "Image"
          : "Document",
      label: row.description?.trim() || `Evidence ${formatDateLabel(row.created_at)}`,
      url: row.url?.trim() || "",
    }));
}

function mapDisputeEvidenceToNotes(
  rows: DisputeEvidenceRow[],
  profilesById: Map<string, ProfileRow>,
): DisputeNote[] {
  return rows
    .filter((row) => row.evidence_type === "text" || !row.url)
    .map((row) => ({
      id: row.id,
      createdAtLabel: formatDateLabel(row.created_at),
      createdBy: getProfileDisplayName(profilesById.get(row.submitted_by_id)),
      body: row.description?.trim() || "Text evidence added.",
    }));
}

function formatDisputeEventSummary(event: DisputeEventRow) {
  const actionLabel = event.action.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const message =
    typeof event.metadata?.message === "string" ? event.metadata.message.trim() : "";
  const parts = [actionLabel, event.reason?.trim(), message].filter(Boolean);
  return parts.join(". ");
}

function mapDisputeEventsToActionLog(
  rows: DisputeEventRow[],
  profilesById: Map<string, ProfileRow>,
): DisputeActionLogEntry[] {
  return rows.map((row) => ({
    id: row.id,
    createdAtLabel: formatDateLabel(row.created_at),
    actor: getProfileDisplayName(profilesById.get(row.actor_id)),
    summary: formatDisputeEventSummary(row),
  }));
}

function deriveDisputePayoutStatus(params: {
  dispute: DisputeRow;
  payment?: PaymentRow | null;
  withdrawal?: WithdrawalRow | null;
}): DisputeRecord["payoutStatus"] {
  const { dispute, payment, withdrawal } = params;
  if (withdrawal) {
    const status = String(withdrawal.status).trim().toLowerCase();
    if (status === "completed") return "Paid";
    if (status === "failed") return "Blocked";
    return "Ready";
  }
  if (payment) {
    if (String(dispute.resolution_type).trim().toLowerCase() === "payout_block") {
      return "Blocked";
    }
    return "Ready";
  }
  return "Unknown";
}

export function mapDisputeRowToDisputeRecord(params: {
  dispute: DisputeRow;
  job?: JobRow | null;
  openedByProfile?: ProfileRow | null;
  customerProfile?: ProfileRow | null;
  contractorProfile?: ProfileRow | null;
  assignedAdminProfile?: ProfileRow | null;
  payment?: PaymentRow | null;
  withdrawal?: WithdrawalRow | null;
  evidenceRows?: DisputeEvidenceRow[];
  eventRows?: DisputeEventRow[];
  profilesById?: Map<string, ProfileRow>;
}): DisputeRecord {
  const {
    dispute,
    job,
    customerProfile,
    contractorProfile,
    assignedAdminProfile,
    payment,
    withdrawal,
    evidenceRows = [],
    eventRows = [],
    profilesById = new Map<string, ProfileRow>(),
  } = params;

  const reason = deriveDisputeReason(dispute.dispute_type, dispute.reason);
  const title =
    dispute.reason?.trim() ||
    `${reason.replace(/([A-Z])/g, " $1").trim()} dispute`;
  const actionLog = mapDisputeEventsToActionLog(eventRows, profilesById);
  const notes = mapDisputeEvidenceToNotes(evidenceRows, profilesById);
  const chargeAmount =
    Number(payment?.amount) ||
    Number(job?.final_price) ||
    Number(job?.price_estimate) ||
    0;
  const payoutAmount =
    Number(withdrawal?.amount) ||
    Number(payment?.contractor_payout) ||
    0;

  return {
    id: dispute.id,
    disputeId: dispute.id,
    disputeCode: formatShortCode("DSP", dispute.id),
    title,
    lifecycleState: mapDisputeStatusToLifecycleState(dispute.status),
    reason,
    priority: toUiPriority(dispute.priority) as DisputePriority,
    payoutImpact: Boolean(
      dispute.related_payment_id ||
        dispute.related_withdrawal_id ||
        dispute.dispute_type === "payment",
    ),
    requestId: job?.id || dispute.job_id,
    requestCode: formatShortCode("REQ", job?.id || dispute.job_id),
    service: job?.service_type || "Service",
    location: job?.address || "—",
    createdAtLabel: formatDateLabel(dispute.created_at),
    updatedAtLabel: formatDateLabel(dispute.updated_at),
    lastUpdatedBy: getProfileDisplayName(assignedAdminProfile) || "Ops Admin",
    customerId: job?.user_id || "",
    customerName: getProfileDisplayName(customerProfile),
    contractorId: job?.contractor_id || "",
    contractorName: getProfileDisplayName(contractorProfile),
    chargeAmount,
    payoutAmount,
    payoutStatus: deriveDisputePayoutStatus({ dispute, payment, withdrawal }),
    attachments: mapDisputeEvidenceToAttachments(evidenceRows),
    notes,
    actionLog:
      actionLog.length > 0
        ? actionLog
        : [
            {
              id: `${dispute.id}-created`,
              createdAtLabel: formatDateLabel(dispute.created_at),
              actor: getProfileDisplayName(params.openedByProfile),
              summary: "Created.",
            },
          ],
    proposedResolutionType: mapDbResolutionTypeToUi(dispute.resolution_type),
    backendStatus: dispute.status,
    dataSource: "live",
  };
}

export { formatDateLabel, formatCurrency, formatSignedCurrency };
