import type { UserRecord, UserStatus } from "../users/users.types";

export type UserDetailsTabValue = "personal-details" | "request-history";

export type UpdateAccountAction = "Activate Account" | "Deactivate Account";

export type UserRequestStatus = "Active" | "Pending" | "Past";

export type UserLocationHistoryItem = {
  id: string;
  primaryLine: string;
  secondaryLine: string;
  isCurrent?: boolean;
};

export type UserRequestHistoryItem = {
  id: string;
  service: string;
  location: string;
  date: string;
  status: UserRequestStatus;
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
