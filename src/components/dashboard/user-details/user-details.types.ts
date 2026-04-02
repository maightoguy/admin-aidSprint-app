import type { UserRecord, UserStatus } from "../users/users.types";

export type UserDetailsTabValue = "personal-details" | "request-history";

export type UpdateAccountAction = "Activate Account" | "Deactivate Account";

export type UserRequestStatus =
  | "Active"
  | "Pending"
  | "Completed"
  | "Cancelled"
  | "Past";

export type UserLocationHistoryItem = {
  id: string;
  primaryLine: string;
  secondaryLine: string;
  isCurrent?: boolean;
};

export type UserRequestImageTone = "light" | "dark";

export type UserRequestUploadedImage = {
  id: string;
  label: string;
  tone: UserRequestImageTone;
};

export type UserRequestHistoryItem = {
  id: string;
  requestCode: string;
  service: string;
  location: string;
  date: string;
  status: UserRequestStatus;
  completedRequests: string;
  rating: string;
  urgencyLabel: string;
  totalPayment: string;
  baseFee: string;
  totalHours: string;
  description: string;
  platformFee: string;
  lifecycleStatus: "Current" | "Assigned" | "Completed" | "Cancelled";
  contractorLocation: string;
  userLocation: string;
  etaLabel: string;
  uploadedImages: UserRequestUploadedImage[];
};

export type UserDetailsRecord = UserRecord & {
  firstName: string;
  lastName: string;
  gender: string;
  locations: UserLocationHistoryItem[];
  requestHistory: UserRequestHistoryItem[];
};

export type UserDetailsPageProps = {
  initialUserId?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  onStatusChange?: (
    user: UserDetailsRecord,
    status: UserStatus,
  ) => Promise<void> | void;
};
