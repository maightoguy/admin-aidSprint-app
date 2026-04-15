import type { IconComponent } from "@/ui/icons";

export type UserStatus = "Active" | "Deactivated";

export type UserRole = "Admin" | "User";

export type UsersSummaryCard = {
  title: string;
  value: string;
  trend: string;
  Icon: IconComponent;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  location: string;
  totalServicesRequested: number;
  dateJoined: string;
  status: UserStatus;
  role: UserRole;
};

export type UserMenuAction =
  | "View profile"
  | "Activate account"
  | "Deactivate account";

export type UserFilters = {
  query: string;
  status: UserStatus | "all";
  role: UserRole | "all";
  from: string | null;
  to: string | null;
};
