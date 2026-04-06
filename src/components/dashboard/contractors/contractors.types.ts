export type ContractorAccountStatus = "Active" | "Deactivated";

export type ContractorCurrentStatus = "Online" | "Offline" | "Busy";

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
  serviceProviderDoc: ContractorKycDocumentRecord | null;
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

export type ContractorsSummaryCard = {
  title: string;
  value: string;
  trend: string;
  iconSvg: string;
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
  serviceCategory: ContractorServiceCategory;
  bio: string;
  firstName: string;
  lastName: string;
  gender: string;
  servicesProvided: ContractorServiceCategory[];
  locations: ContractorLocationHistoryItem[];
};

export type ContractorMenuAction =
  | "View profile"
  | "Activate account"
  | "Deactivate account";

export type ContractorFilters = {
  query: string;
  currentStatus: ContractorCurrentStatus | "all";
  accountStatus: ContractorAccountStatus | "all";
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
