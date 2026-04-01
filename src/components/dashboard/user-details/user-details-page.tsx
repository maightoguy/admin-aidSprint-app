import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
  MoreVertical,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DashboardLayout } from "../shared/dashboard-layout";
import { getStatusPillClasses } from "../users/users.utils";
import { usersStyles } from "../users/users.styles";
import { userDetailsRecords } from "./user-details.data";
import { UserDetailsTabs } from "./user-details-tabs";
import { UpdateAccountModal } from "./update-account-modal";
import {
  getRequestStatusClasses,
  getStatusFromAccountAction,
  getUserDetailsById,
  truncateRequestLocation,
} from "./user-details.utils";
import type {
  UpdateAccountAction,
  UserDetailsPageProps,
  UserDetailsRecord,
  UserRequestHistoryItem,
  UserDetailsTabValue,
} from "./user-details.types";

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-6 w-32 animate-pulse rounded-xl bg-[#E5E7EB]" />
      <div className="h-[108px] animate-pulse rounded-[20px] bg-white" />
      <div className="h-[174px] animate-pulse rounded-[20px] bg-white" />
      <div className="h-[174px] animate-pulse rounded-[20px] bg-white" />
    </div>
  );
}

function UserStatusPill({ status }: { status: UserDetailsRecord["status"] }) {
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

function PersonalDetailsPanel({ user }: { user: UserDetailsRecord }) {
  return (
    <div className="space-y-4">
      <section className="rounded-[16px] border border-[#EAECF0] bg-white shadow-sm">
        <div className="border-b border-[#EAECF0] px-4 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-[#344054]">
            User information
          </h2>
          <p className="mt-1 text-sm text-[#98A2B3]">
            This contains the user basic information
          </p>
        </div>
        <div className="grid gap-6 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <p className="text-sm text-[#98A2B3]">First name</p>
            <p className="mt-1 text-sm font-semibold text-[#101828]">
              {user.firstName}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#98A2B3]">Last name</p>
            <p className="mt-1 text-sm font-semibold text-[#101828]">
              {user.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#98A2B3]">Email address</p>
            <p className="mt-1 break-words text-sm font-semibold text-[#101828]">
              {user.email}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#98A2B3]">Gender</p>
            <p className="mt-1 text-sm font-semibold text-[#101828]">
              {user.gender}
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-sm text-[#98A2B3]">Date joined</p>
            <p className="mt-1 text-sm font-semibold text-[#101828]">
              {user.dateJoined}
            </p>
          </div>
        </div>
      </section>
      <section className="rounded-[16px] border border-[#EAECF0] bg-white shadow-sm">
        <div className="border-b border-[#EAECF0] px-4 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-[#344054]">Locations</h2>
          <p className="mt-1 text-sm text-[#98A2B3]">
            This contains the User’s previous locations
          </p>
        </div>
        <div className="grid gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {user.locations.map((location) => (
            <article
              key={location.id}
              className="rounded-[12px] border border-[#EAECF0] bg-[#FCFCFD] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#344054]">
                    {location.primaryLine}
                  </p>
                  <p className="mt-2 text-sm text-[#667085]">
                    {location.secondaryLine}
                  </p>
                </div>
                {location.isCurrent ? (
                  <span className="inline-flex shrink-0 rounded-full bg-[#F2F4F7] px-2.5 py-1 text-[10px] font-semibold text-[#344054]">
                    Current
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function RequestHistoryStatusPill({
  status,
}: {
  status: UserRequestHistoryItem["status"];
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        getRequestStatusClasses(status),
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function RequestHistoryPanel({ user }: { user: UserDetailsRecord }) {
  return (
    <section className="rounded-[16px] border border-[#EAECF0] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#EAECF0] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-sm font-semibold text-[#667085]">All requests</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex h-10 min-w-0 items-center gap-2 rounded-xl border border-[#EAECF0] bg-white px-4 text-sm text-[#667085] shadow-sm sm:min-w-[300px]">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value=""
              readOnly
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-[#101828] outline-none placeholder:text-[#98A2B3]"
              aria-label="Search request history"
            />
          </label>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAECF0] bg-white text-[#667085] shadow-sm transition hover:bg-[#F8FAFC]"
            aria-label="Filter request history"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full">
          <thead className="bg-[#F9FAFB]">
            <tr className="text-left text-xs font-semibold text-[#667085]">
              <th className="px-5 py-4">Service</th>
              <th className="px-5 py-4">Location</th>
              <th className="px-5 py-4">Date and time</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAECF0]">
            {user.requestHistory.map((request) => (
              <tr key={request.id}>
                <td className="px-5 py-4 text-sm font-semibold text-[#101828]">
                  {request.service}
                </td>
                <td className="max-w-[220px] px-5 py-4 text-sm text-[#667085]">
                  <p className="truncate" title={request.location}>
                    {truncateRequestLocation(request.location)}
                  </p>
                </td>
                <td className="px-5 py-4 text-sm text-[#667085]">
                  {request.date}
                </td>
                <td className="px-5 py-4">
                  <RequestHistoryStatusPill status={request.status} />
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    className="inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center rounded-[10px] border border-[#EAECF0] bg-white text-[#667085] transition hover:bg-[#F8FAFC]"
                    aria-label={`Open request actions for ${request.service}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-4 md:hidden">
        {user.requestHistory.map((request) => (
          <article
            key={request.id}
            className="rounded-[14px] border border-[#EAECF0] bg-[#FCFCFD] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#101828]">
                  {request.service}
                </p>
                <p className="mt-2 text-sm text-[#667085]">
                  {request.location}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-11 min-h-11 w-11 min-w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#EAECF0] bg-white text-[#667085]"
                aria-label={`Open request actions for ${request.service}`}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-[#667085]">{request.date}</p>
              <RequestHistoryStatusPill status={request.status} />
            </div>
          </article>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[#EAECF0] px-4 py-4 sm:px-5">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D0D5DD] text-[#667085] transition hover:bg-[#F8FAFC]"
          aria-label="Previous request history page"
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
          aria-label="Next request history page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

export default function UserDetailsPage({
  initialUserId,
  isLoading = false,
  errorMessage = null,
  onStatusChange,
}: UserDetailsPageProps) {
  const { userId: routeUserId } = useParams();
  const resolvedUserId = initialUserId ?? routeUserId;
  const matchedUser = useMemo(
    () => getUserDetailsById(userDetailsRecords, resolvedUserId),
    [resolvedUserId],
  );
  const [activeTab, setActiveTab] =
    useState<UserDetailsTabValue>("personal-details");
  const [isUpdateAccountOpen, setIsUpdateAccountOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<UpdateAccountAction | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserDetailsRecord | null>(
    matchedUser,
  );

  useEffect(() => {
    setCurrentUser(matchedUser);
    setActionError(null);
    setIsUpdateAccountOpen(false);
  }, [matchedUser]);

  const handleStatusAction = async (action: UpdateAccountAction) => {
    if (!currentUser) {
      return;
    }

    const nextStatus = getStatusFromAccountAction(action);

    setBusyAction(action);
    setActionError(null);

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 150);
      });

      await onStatusChange?.(currentUser, nextStatus);

      setCurrentUser({
        ...currentUser,
        status: nextStatus,
      });
      setIsUpdateAccountOpen(false);

      toast.success(action, {
        description: `${currentUser.name} is now ${nextStatus.toLowerCase()}.`,
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update account status right now.",
      );
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <DashboardLayout title="User’s">
      <div className="space-y-5">
        <Link
          to="/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#475467] transition hover:text-[#101828]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
        {errorMessage ? (
          <div
            role="alert"
            className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B42318]"
          >
            {errorMessage}
          </div>
        ) : null}
        {isLoading ? <LoadingState /> : null}
        {!isLoading && !currentUser ? (
          <div className="rounded-[16px] border border-[#FECACA] bg-white px-5 py-8 shadow-sm">
            <p className="text-base font-semibold text-[#101828]">
              User profile not found
            </p>
            <p className="mt-2 text-sm text-[#667085]">
              The selected user profile could not be loaded.
            </p>
          </div>
        ) : null}
        {!isLoading && currentUser ? (
          <>
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as UserDetailsTabValue)
              }
              className="space-y-5"
            >
              <UserDetailsTabs value={activeTab} />
              <section className="flex flex-col gap-4 rounded-[20px] bg-transparent lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FCE7D4_0%,#E59F75_100%)] text-lg font-bold text-[#7A2E14]">
                    {currentUser.firstName.charAt(0)}
                    {currentUser.lastName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[28px] font-bold tracking-[-0.03em] text-[#101828]">
                      {currentUser.name}
                    </p>
                    <div className="mt-2">
                      <UserStatusPill status={currentUser.status} />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpdateAccountOpen(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877] focus:outline-none focus:ring-2 focus:ring-[#071B58]/25"
                  aria-haspopup="dialog"
                  aria-expanded={isUpdateAccountOpen}
                >
                  Update account
                  <ChevronDown className="h-4 w-4" />
                </button>
              </section>
              <TabsContent value="personal-details" className="mt-0">
                <PersonalDetailsPanel user={currentUser} />
              </TabsContent>
              <TabsContent value="request-history" className="mt-0">
                <RequestHistoryPanel user={currentUser} />
              </TabsContent>
            </Tabs>
            <UpdateAccountModal
              open={isUpdateAccountOpen}
              busyAction={busyAction}
              errorMessage={actionError}
              onOpenChange={setIsUpdateAccountOpen}
              onSelectAction={handleStatusAction}
            />
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
