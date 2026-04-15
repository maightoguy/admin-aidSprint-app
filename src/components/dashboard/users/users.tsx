import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../shared/dashboard-layout";
import {
  userRecords,
  usersSummaryCards,
  usersSummaryPattern,
} from "./users.data";
import { UsersActionsMenu } from "./users-actions-menu";
import { usersStyles } from "./users.styles";
import { filterUsers, getStatusPillClasses } from "./users.utils";
import type { UserMenuAction, UserRecord } from "./users.types";

function StatusPill({ status }: Pick<UserRecord, "status">) {
  return (
    <span
      className={[usersStyles.statusPill, getStatusPillClasses(status)].join(
        " ",
      )}
    >
      {status}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <section className="grid gap-[14px] md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[126px] animate-pulse rounded-[10px] border border-[#F0F1F2] bg-white"
          />
        ))}
      </section>
      <section className="mt-5 rounded-[10px] border border-[#EAECF0] bg-white p-4 shadow-sm">
        <div className="h-[420px] animate-pulse rounded-[10px] bg-[#F8FAFC]" />
      </section>
    </>
  );
}

export default function Users({
  initialUsers = userRecords,
  isLoading = false,
  errorMessage = null,
}: {
  initialUsers?: UserRecord[];
  isLoading?: boolean;
  errorMessage?: string | null;
}) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredUsers = useMemo(
    () => filterUsers(users, searchQuery),
    [users, searchQuery],
  );

  const handleUserAction = (action: UserMenuAction, user: UserRecord) => {
    if (action === "View profile") {
      navigate(`/users/${user.id}`);
      return;
    }

    if (action === "Activate account" || action === "Deactivate account") {
      const nextStatus: UserRecord["status"] =
        action === "Activate account" ? "Active" : "Deactivated";

      if (user.status === nextStatus) {
        toast.info("No change", {
          description: `${user.name} is already ${nextStatus.toLowerCase()}.`,
        });
        return;
      }

      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, status: nextStatus } : item,
        ),
      );

      toast.success(action, {
        description: `${user.name} has been ${nextStatus.toLowerCase()}.`,
      });
    }
  };

  return (
    <DashboardLayout title="User’s">
      {errorMessage ? (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B91C1C]"
        >
          {errorMessage}
        </div>
      ) : null}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <section className="grid gap-[14px] md:grid-cols-3">
            {usersSummaryCards.map((card) => (
              <article
                key={card.title}
                className="relative overflow-hidden rounded-[10px] border border-[#F0F1F2] bg-[#FAFAFA] p-[13px]"
              >
                <img
                  src={usersSummaryPattern}
                  alt=""
                  aria-hidden="true"
                  className="absolute -left-[25px] -top-[14px] hidden h-[156px] w-[317px] max-w-none rotate-180 opacity-80 lg:block"
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] leading-[19px] text-[#6B7280]">
                      {card.title}
                    </p>
                    <p className="mt-[10px] text-[24px] font-semibold leading-[33px] tracking-[-0.02em] text-[#020715]">
                      {card.value}
                    </p>
                    <p className="mt-[8px] text-[12px] leading-[15px] text-[#136C34]">
                      {card.trend}
                    </p>
                  </div>
                  <div className="relative flex h-[26px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-[#F0F1F2] bg-white p-[3px] [&_svg]:h-5 [&_svg]:w-5">
                    <card.Icon size={20} aria-hidden="true" />
                  </div>
                </div>
              </article>
            ))}
          </section>
          <section className="mt-5 rounded-[10px] border border-[#EAECF0] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#EAECF0] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-sm font-semibold text-[#667085]">
                All users
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="inline-flex h-10 min-w-0 items-center gap-2 rounded-xl border border-[#EAECF0] bg-white px-4 text-sm text-[#667085] shadow-sm sm:min-w-[300px]">
                  <Search className="h-4 w-4 shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search users ..."
                    className="w-full bg-transparent text-sm text-[#101828] outline-none placeholder:text-[#98A2B3]"
                    aria-label="Search users"
                  />
                </label>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAECF0] bg-white text-[#667085] shadow-sm transition hover:bg-[#F8FAFC]"
                  aria-label="Filter users"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="px-4 py-10 text-center sm:px-5">
                <p className="text-sm font-medium text-[#667085]">
                  No users match your search.
                </p>
              </div>
            ) : null}
            {filteredUsers.length > 0 ? (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="min-w-full">
                    <thead className="bg-[#F9FAFB]">
                      <tr className="text-left text-xs font-semibold text-[#344054]">
                        <th className="px-5 py-4">Name</th>
                        <th className="px-5 py-4">Location</th>
                        <th className="px-5 py-4">Total services requested</th>
                        <th className="px-5 py-4">Date Joined</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAECF0]">
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F4F7] text-sm font-semibold text-[#344054]">
                                {user.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#101828]">
                                  {user.name}
                                </p>
                                <p className="truncate text-xs text-[#98A2B3]">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[220px] px-5 py-4 text-sm text-[#667085]">
                            <p className="truncate" title={user.location}>
                              {user.location}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#667085]">
                            {user.totalServicesRequested}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#667085]">
                            {user.dateJoined}
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill status={user.status} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <UsersActionsMenu user={user} onAction={handleUserAction} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-3 p-4 lg:hidden">
                  {filteredUsers.map((user) => (
                    <article
                      key={user.id}
                      className="relative rounded-2xl border border-[#EAECF0] p-4"
                    >
                      <div className="absolute right-4 top-4 z-10">
                        <UsersActionsMenu user={user} onAction={handleUserAction} />
                      </div>
                      <div className="flex min-w-0 items-start gap-3 pr-16">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F4F7] text-sm font-semibold text-[#344054]">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#101828]">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-[#98A2B3]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-start">
                        <StatusPill status={user.status} />
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-[#667085] sm:grid-cols-2">
                        <p className="sm:col-span-2">
                          <span className="font-semibold text-[#101828]">
                            Location:
                          </span>{" "}
                          {user.location}
                        </p>
                        <p>
                          <span className="font-semibold text-[#101828]">
                            Date Joined:
                          </span>{" "}
                          {user.dateJoined}
                        </p>
                        <p>
                          <span className="font-semibold text-[#101828]">
                            Services:
                          </span>{" "}
                          {user.totalServicesRequested}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : null}
            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[#EAECF0] px-4 py-4 sm:px-5">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D0D5DD] text-[#667085] transition hover:bg-[#F8FAFC]"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {[1, 2, 3, 4, 5, 6].map((page) => (
                <button
                  key={page}
                  type="button"
                  className={[
                    "inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition",
                    page === 3
                      ? "border border-[#101828] bg-white text-[#101828]"
                      : "text-[#98A2B3] hover:bg-[#F8FAFC] hover:text-[#344054]",
                  ].join(" ")}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D0D5DD] text-[#667085] transition hover:bg-[#F8FAFC]"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
