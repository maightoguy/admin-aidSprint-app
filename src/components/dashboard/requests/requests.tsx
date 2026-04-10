import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../shared/dashboard-layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import summaryCardPattern from "@/assets/overview/summary-card-pattern.png";
import { TotalRequestsIcon } from "@/ui/icons";
import { RequestsLiveTrackerOverlay } from "./requests-overlay";
import { RequestsSidebar } from "./requests-sidebar";
import {
  applyRequestStatusOverride,
  useRequestsStore,
  type RequestStatusAction,
} from "./requests.store";
import { userDetailsRecords } from "../user-details/user-details.data";
import {
  getRequestStatusClasses,
  truncateRequestLocation,
} from "../user-details/user-details.utils";
import type {
  UserRequestHistoryItem,
} from "../user-details/user-details.types";

type RequestListRow = {
  id: string;
  userName: string;
  userEmail: string;
  request: UserRequestHistoryItem;
};

type RequestsSummaryCard = {
  title: string;
  value: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((value) => value.charAt(0).toUpperCase())
    .join("");
}

function RequestsSummaryCard({ title, value }: RequestsSummaryCard) {
  return (
    <article className="relative overflow-hidden rounded-[16px] border border-[#EAECF0] bg-[#FAFAFA] p-4 shadow-sm">
      <img
        src={summaryCardPattern}
        alt=""
        aria-hidden="true"
        className="absolute -left-[25px] -top-[14px] hidden h-[156px] w-[317px] max-w-none rotate-180 opacity-80 lg:block"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[14px] font-medium text-[#98A2B3]">{title}</p>
          <p className="mt-5 text-[16px] font-bold tracking-[-0.03em] text-[#101828] sm:text-[28px]">
            {value}
          </p>
          <p className="mt-3 text-sm font-medium text-[#16A34A]">
            + 2.3% vs Yesterday
          </p>
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#EAECF0] bg-white">
          <TotalRequestsIcon size={20} color="#071B58" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function RequestRowActions({
  requestCode,
  onViewRequest,
}: {
  requestCode: string;
  onViewRequest: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#EAECF0] bg-white text-[#667085] transition hover:bg-[#F8FAFC]"
          aria-label={`Open request actions for ${requestCode}`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[190px] rounded-[10px] border-0 bg-white p-[10px] shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
      >
        <DropdownMenuItem
          onClick={onViewRequest}
          className="h-4 min-h-[16px] rounded-none px-0 py-0 text-[12px] font-semibold text-[#2D3036] focus:bg-transparent focus:text-[#2D3036]"
        >
          View request
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function RequestsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const selectedRequestId = useRequestsStore(
    (state) => state.selectedRequestId,
  );
  const isRequestsOpen = useRequestsStore(
    (state) => state.isSidebarOpen,
  );
  const openRequest = useRequestsStore((state) => state.openRequest);
  const closeSidebar = useRequestsStore((state) => state.closeSidebar);
  const openMap = useRequestsStore((state) => state.openMap);
  const closeAll = useRequestsStore((state) => state.closeAll);
  const updateRequestStatus = useRequestsStore(
    (state) => state.updateRequestStatus,
  );
  const requestStatusById = useRequestsStore(
    (state) => state.requestStatusById,
  );

  useEffect(() => {
    closeAll();
  }, [closeAll]);

  const rows = useMemo<RequestListRow[]>(() => {
    return userDetailsRecords.flatMap((user) =>
      user.requestHistory.map((request) => ({
        id: request.id,
        userName: user.name,
        userEmail: user.email,
        request: applyRequestStatusOverride(
          request,
          requestStatusById[request.id],
        ),
      })),
    );
  }, [requestStatusById]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.userName,
        row.userEmail,
        row.request.location,
        row.request.service,
        row.request.date,
        row.request.status,
        row.request.requestCode,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [rows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRequestId) ?? null,
    [rows, selectedRequestId],
  );

  const summaryCards = useMemo<RequestsSummaryCard[]>(() => {
    const totalRequests = rows.length;
    const activeRequests = rows.filter(
      (row) => row.request.status === "Active",
    ).length;
    const pendingRequests = rows.filter(
      (row) => row.request.status === "Pending",
    ).length;
    const completedRequests = rows.filter(
      (row) =>
        row.request.status === "Completed" || row.request.status === "Past",
    ).length;

    return [
      { title: "Total Requests", value: totalRequests.toLocaleString() },
      { title: "Active Requests", value: activeRequests.toLocaleString() },
      { title: "Pending Request", value: pendingRequests.toLocaleString() },
      { title: "Completed request", value: completedRequests.toLocaleString() },
    ];
  }, [rows]);

  const handleOpenRequest = (row: RequestListRow) => {
    openRequest(row.id);
  };

  const handleOpenLiveTracker = () => {
    if (!selectedRow) {
      toast.error("Unable to open live tracker", {
        description: "No request is currently selected.",
      });
      return;
    }

    openMap();
  };

  const handleUpdateRequestStatus = (action: RequestStatusAction) => {
    if (!selectedRow) {
      toast.error("Unable to update status", {
        description: "No request is currently selected.",
      });
      return;
    }

    updateRequestStatus(selectedRow.id, action);
    toast.success(action, {
      description: `${selectedRow.request.service} is now ${action
        .replace(" order", "")
        .toLowerCase()}.`,
    });
  };

  return (
    <DashboardLayout title="Requests">
      <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <RequestsSummaryCard key={card.title} {...card} />
          ))}
        </div>

        <section className="rounded-[20px] border border-[#EAECF0] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#EAECF0] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-sm font-semibold text-[#667085]">
              All Requests
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                <Input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search Contractors ..."
                  className="h-[42px] w-full rounded-[12px] border-[#EAECF0] bg-[#FCFCFD] pl-11 sm:w-[294px]"
                />
              </label>
              <button
                type="button"
                className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-[12px] border border-[#EAECF0] bg-[#FCFCFD] text-[#667085]"
                aria-label="Filter requests"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-sm font-semibold text-[#475467]">
                  <th className="px-5 py-4">Name of users</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Service</th>
                  <th className="px-5 py-4">Date Joined</th>
                  <th className="px-5 py-4">Account Status</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0]">
                {currentRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EAECF0] text-base font-semibold text-[#344054]">
                          {getInitials(row.userName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold text-[#101828]">
                            {row.userName}
                          </p>
                          <p className="truncate text-[14px] text-[#98A2B3]">
                            {row.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[14px] text-[#667085]">
                      <p title={row.request.location}>
                        {truncateRequestLocation(row.request.location)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-[14px] font-semibold text-[#101828]">
                      {row.request.service}
                    </td>
                    <td className="px-5 py-4 text-[14px] text-[#667085]">
                      {row.request.date}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
                          getRequestStatusClasses(row.request.status),
                        ].join(" ")}
                      >
                        {row.request.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <RequestRowActions
                        requestCode={row.request.requestCode}
                        onViewRequest={() => handleOpenRequest(row)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[#EAECF0] px-4 py-4 sm:px-5">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D0D5DD] text-[#667085] transition hover:bg-[#F8FAFC] disabled:opacity-50"
              aria-label="Previous requests page"
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={[
                    "inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition",
                    page === currentPage
                      ? "border border-[#101828] bg-white text-[#101828]"
                      : "text-[#98A2B3] hover:bg-[#F8FAFC] hover:text-[#344054]",
                  ].join(" ")}
                >
                  {page}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D0D5DD] text-[#667085] transition hover:bg-[#F8FAFC] disabled:opacity-50"
              aria-label="Next requests page"
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <RequestsSidebar
          open={isRequestsOpen}
          request={selectedRow?.request ?? null}
          customerName={selectedRow?.userName ?? ""}
          onOpenChange={(open) => (open ? null : closeSidebar())}
          onOpenLiveTracker={handleOpenLiveTracker}
          onUpdateStatus={handleUpdateRequestStatus}
        />
        <RequestsLiveTrackerOverlay requestId={selectedRow?.id ?? null} />
      </div>
    </DashboardLayout>
  );
}
