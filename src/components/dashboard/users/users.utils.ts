import type { UserRecord, UserStatus } from "./users.types";

export function filterUsers(users: UserRecord[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return users;
  }

  return users.filter((user) =>
    [
      user.name,
      user.email,
      user.location,
      user.totalServicesRequested.toString(),
      user.dateJoined,
      user.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

export function getStatusPillClasses(status: UserStatus) {
  return status === "Active"
    ? "bg-[#DCFCE7] text-[#22A75A]"
    : "bg-[#FDECEC] text-[#EF4444]";
}
