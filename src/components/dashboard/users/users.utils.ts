import type { UserFilters, UserRecord, UserStatus } from "./users.types";
import {
  isWithinInclusiveRange,
  parseDateForFilter,
} from "../shared/filters/filter-schema";

export function filterUsers(users: UserRecord[], filters: UserFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const fromDate = filters.from ? parseDateForFilter(filters.from) : null;
  const toDate = filters.to ? parseDateForFilter(filters.to) : null;

  return users.filter((user) =>
    {
      if (filters.status !== "all" && user.status !== filters.status) {
        return false;
      }

      if (filters.role !== "all" && user.role !== filters.role) {
        return false;
      }

      if (fromDate || toDate) {
        const joined = parseDateForFilter(user.dateJoined);
        if (!joined) {
          return false;
        }
        if (!isWithinInclusiveRange(joined, fromDate, toDate)) {
          return false;
        }
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        user.name,
        user.email,
        user.location,
        user.totalServicesRequested.toString(),
        user.dateJoined,
        user.status,
        user.role,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    },
  );
}

export function getStatusPillClasses(status: UserStatus) {
  return status === "Active"
    ? "bg-[#DCFCE7] text-[#22A75A]"
    : "bg-[#FDECEC] text-[#EF4444]";
}
