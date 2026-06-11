import type { IconComponent } from "@/ui/icons";

export type ContractorAccountStatus = "Active" | "Deactivated";

export type ContractorCurrentStatus = "Online" | "Offline" | "Busy";

export type ContractorLifecycleState =
  | "Active"
  | "Suspended"
  | "Pending approval";

export type ContractorVerificationState =
  | "Verified"
  | "Pending review"
  | "Rejected";

export type ContractorPayoutStatus = "Ready" | "Blocked" | "Onboarding";

export type ContractorRiskLevel = "Low" | "Medium" | "High";

export type ContractorServiceCategory =
  | "Plumbing"
  | "Cleaning"
  | "Baby sitting"
  | "Electrician"
  | "Laundry"
  | "Carpentry";

export type ContractorDetailsTabValue =
  | "personal-details"
  | "kyc-verification"
  | "request-history"
  | "transaction-history";

export type ContractorKycCategory = "id" | "police" | "serviceProvider";

export type ContractorKycStatus = "pending" | "accepted" | "rejected";

export type ContractorKycDocumentRecord = {
  documentId?: string;
  file: File;
  fileName: string;
  fileSize: number;
  fileSizeLabel: string;
  mimeType: string;
  uploadedAtIso: string;
  uploadedAtLabel: string;
  objectUrl: string;
};

export type ContractorKycState = {
  activeCategory: ContractorKycCategory;
  idDoc: ContractorKycDocumentRecord | null;
  idStatus: ContractorKycStatus | null;
  idReason?: string;
  idReviewedAt?: string;
  idReviewedBy?: string;
  policeDoc: ContractorKycDocumentRecord | null;
  policeStatus: ContractorKycStatus | null;
  policeReason?: string;
  policeReviewedAt?: string;
  policeReviewedBy?: string;
  serviceProviderDocs: ContractorKycDocumentRecord[];
  serviceProviderStatus: ContractorKycStatus | null;
  serviceProviderReason?: string;
  serviceProviderReviewedAt?: string;
  serviceProviderReviewedBy?: string;
};

export type ContractorLocationHistoryItem = {
  id: string;
  primaryLine: string;
  secondaryLine: string;
  isCurrent?: boolean;
};

export type ContractorTransactionType = "Withdrawal" | "Service payment";

export type ContractorTransactionStatus = "Completed" | "Pending" | "Failed";

export type ContractorTransactionRecord = {
  id: string;
  transactionCode: string;
  type: ContractorTransactionType;
  amount: number;
  dateTime: string;
  status: ContractorTransactionStatus;
  accountNumber: string;
  accountName: string;
  bankName: string;
  fee: number;
};

export type ContractorsSummaryCard = {
  title: string;
  value: string;
  trend: string;
  Icon: IconComponent;
};

export type ContractorRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  currentStatus: ContractorCurrentStatus;
  totalServicesProvided: number;
  dateJoined: string;
  accountStatus: ContractorAccountStatus;
  lifecycleState: ContractorLifecycleState;
  serviceCategory: ContractorServiceCategory;
  bio: string;
  firstName: string;
  lastName: string;
  gender: string;
  servicesProvided: ContractorServiceCategory[];
  locations: ContractorLocationHistoryItem[];
  verificationState: ContractorVerificationState;
  rating: number;
  totalRatings: number;
  acceptanceRate: number;
  completionRate: number;
  responseTimeLabel: string;
  totalJobsOffered: number;
  totalJobsAccepted: number;
  totalJobsCompleted: number;
  repeatedComplaints: number;
  lastActiveLabel: string;
  serviceZoneLabel: string;
  riskLevel: ContractorRiskLevel;
  riskFlags: string[];
  watchlistReason?: string;
  suspensionReason?: string;
  restoreReason?: string;
  payoutStatus: ContractorPayoutStatus;
  pendingPayoutAmount: string;
  payoutsBlockedReason?: string;
};

export type ContractorMenuAction =
  | "View profile"
  | "Suspend account"
  | "Restore account";

export type ContractorFilters = {
  query: string;
  currentStatus: ContractorCurrentStatus | "all";
  accountStatus: ContractorAccountStatus | "all";
  specialty: ContractorServiceCategory | "all";
  from: string | null;
  to: string | null;
};

export type ContractorFormValues = {
  name: string;
  email: string;
  phone: string;
  location: string;
  currentStatus: ContractorCurrentStatus;
  totalServicesProvided: number;
  dateJoined: string;
  accountStatus: ContractorAccountStatus;
  serviceCategory: ContractorServiceCategory;
  bio: string;
};
