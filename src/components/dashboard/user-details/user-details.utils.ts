import type { UserStatus } from "../users/users.types";
import type {
  UpdateAccountAction,
  UserDetailsRecord,
  UserRequestStatus,
  UserDetailsTabValue,
} from "./user-details.types";

export function getUserDetailsById(
  users: UserDetailsRecord[],
  userId: string | undefined,
) {
  if (!userId) {
    return null;
  }

  return users.find((user) => user.id === userId) ?? null;
}

export function getStatusFromAccountAction(action: UpdateAccountAction): UserStatus {
  return action === "Activate Account" ? "Active" : "Deactivated";
}

export function getTabLabel(value: UserDetailsTabValue) {
  return value === "personal-details" ? "Personal details" : "Request history";
}

export function getRequestStatusClasses(status: UserRequestStatus) {
  if (status === "Active") {
    return "bg-[#DCFCE7] text-[#22A75A]";
  }

  if (status === "Pending") {
    return "bg-[#FEF3E6] text-[#F59E0B]";
  }

  if (status === "Completed" || status === "Past") {
    return "bg-[#E0F2FE] text-[#0369A1]";
  }

  return "bg-[#FEE4E2] text-[#F04438]";
}

export function truncateRequestLocation(location: string) {
  return location.length > 18 ? `${location.slice(0, 18)}...` : location;
}
