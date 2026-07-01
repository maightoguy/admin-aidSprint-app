import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/auth/auth.store";
import { DashboardLayout } from "../shared/dashboard-layout";
import type {
  FilterField,
  FiltersState,
} from "../shared/filters/filter-schema";
import { FilterButton } from "../shared/filters/filter-button";
import { useUrlFilters } from "../shared/filters/use-url-filters";
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
import {
  filterRequestRows,
  getRequestOperationalBadges,
  getRequestOperationalQueue,
  type RequestFilterPriority,
  type RequestFilterStatus,
} from "./requests.utils";
import { userDetailsRecords } from "../user-details/user-details.data";
import {
  getRequestStatusClasses,
  truncateRequestLocation,
} from "../user-details/user-details.utils";
import type { UserRequestHistoryItem } from "../user-details/user-details.types";
import { paginateItems } from "../shared/pagination-utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { supabase } from "@/lib/supabase/client";
import {
  supabaseJobAttachments,
  supabaseJobs,
  supabaseProfiles,
  type JobRow,
} from "@/lib/supabase/data";
import { mapJobRowToUserRequestHistoryItem } from "@/lib/supabase/mappers";
import { createLogger } from "@/lib/logger";
import { emitEvent, BusinessEventType } from "@/lib/events";

type RequestListRow = {
  id: string;
  userName: string;
  userEmail: string;
  request: UserRequestHistoryItem;
};

function buildRowFromJob(
  previousRow: RequestListRow,
  job: JobRow,
): RequestListRow {
  const request = mapJobRowToUserRequestHistoryItem({
    job,
    userProfile: {
      full_name: previousRow.userName,
      email: previousRow.userEmail,
    },
    contractorProfile: null,
  });

  return {
    ...previousRow,
    request,
  };
}

function mapRequestActionToJobStatus(action: RequestStatusAction) {
  if (action === "Complete order") return "completed" as const;
  if (action === "Cancel order") return "cancelled" as const;
  return "broadcast" as const;
}

const requestStatuses: RequestFilterStatus[] = [
  "Active",
  "Pending",
  "Completed",
  "Past",
];
const requestPriorities: RequestFilterPriority[] = ["Emergency", "Standard"];

const requestsFiltersSchema: FilterField[] = [
  {
    type: "dateRange",
    key: "dateRange",
    label: "Date range",
    fromKey: "from",
    toKey: "to",
  },
  {
    type: "select",
    key: "status",
    label: "Status",
    options: requestStatuses.map((status) => ({
      label: status,
      value: status,
    })),
  },
  {
    type: "select",
    key: "priority",
    label: "Priority",
    options: requestPriorities.map((priority) => ({
      label: priority,
      value: priority,
    })),
  },
];

const requestsFilterDefaults: FiltersState = {
  status: null,
  priority: null,
  from: null,
  to: null,
};

type RequestsSummaryCard = {
  title: string;
  value: string;
};

type RequestsQueueCard = {
  title: string;
  description: string;
  value: string;
  tone: "neutral" | "warning" | "danger";
  onClick: () => void;
};

const logger = createLogger("Requests");

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

function RequestsQueueCard({
  title,
  description,
  value,
  tone,
  onClick,
}: RequestsQueueCard) {
  const toneStyles =
    tone === "danger"
      ? {
          badge: "bg-[#FEE4E2] text-[#B42318]",
          border: "border-[#F04438]/20",
        }
      : tone === "warning"
        ? {
            badge: "bg-[#FFF4DB] text-[#B7791F]",
            border: "border-[#F79009]/20",
          }
        : {
            badge: "bg-[#F2F4F7] text-[#344054]",
            border: "border-[#EAECF0]",
          };

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-start justify-between gap-4 rounded-[16px] border bg-white p-4 text-left shadow-sm transition",
        "hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15",
        toneStyles.border,
      ].join(" ")}
      aria-label={`${title} queue`}
    >
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[#101828]">{title}</p>
        <p className="mt-1 text-[12px] leading-5 text-[#667085]">
          {description}
        </p>
      </div>
      <span
        className={[
          "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[12px] font-semibold",
          toneStyles.badge,
        ].join(" ")}
      >
        {value}
      </span>
    </button>
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

function RequestRowUser({
  userName,
  userEmail,
}: Pick<RequestListRow, "userName" | "userEmail">) {
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EAECF0] text-base font-semibold text-[#344054]">
        {getInitials(userName)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-[#101828]">
          {userName}
        </p>
        <p className="truncate text-[14px] text-[#98A2B3]">{userEmail}</p>
      </div>
    </div>
  );
}

export default function RequestsPage() {
  const adminUserId = useAuthStore((state) => state.session?.userId ?? "");
  const isTestMode = import.meta.env.MODE === "test" || import.meta.env.VITEST;
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const pendingRowsRef = useRef<RequestListRow[] | null>(null);
  const [baseRows, setBaseRows] = useState<RequestListRow[]>(() =>
    isTestMode
      ? userDetailsRecords.flatMap((user) =>
          user.requestHistory.map((request) => ({
            id: request.id,
            userName: user.name,
            userEmail: user.email,
            request,
          })),
        )
      : [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLiveRequests, setHasLiveRequests] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const pageSize = expanded ? 10 : 5;
  const {
    filters: urlFilters,
    setMany: setManyFilters,
    reset: resetFilters,
  } = useUrlFilters({
    schema: requestsFiltersSchema,
    defaults: requestsFilterDefaults,
  });
  const statusFilter =
    urlFilters.status && requestStatuses.includes(urlFilters.status as any)
      ? String(urlFilters.status)
      : null;
  const priorityFilter =
    urlFilters.priority &&
    requestPriorities.includes(urlFilters.priority as any)
      ? String(urlFilters.priority)
      : null;
  const fromFilter =
    typeof urlFilters.from === "string" && urlFilters.from
      ? urlFilters.from
      : null;
  const toFilter =
    typeof urlFilters.to === "string" && urlFilters.to ? urlFilters.to : null;

  const selectedRequestId = useRequestsStore(
    (state) => state.selectedRequestId,
  );
  const isRequestsOpen = useRequestsStore((state) => state.isSidebarOpen);
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
  const requestOpsById = useRequestsStore((state) => state.requestOpsById);

  useEffect(() => {
    closeAll();
  }, [closeAll]);

  useEffect(() => {
    if (!isRequestsOpen && pendingRowsRef.current) {
      setBaseRows(pendingRowsRef.current);
      pendingRowsRef.current = null;
    }
  }, [isRequestsOpen]);

  const loadRequests = useCallback(
    async (options?: { silent?: boolean; source?: "initial" | "realtime" }) => {
      if (
        import.meta.env.MODE === "test" ||
        import.meta.env.VITEST ||
        !isSupabaseConfigured()
      ) {
        return;
      }

      if (!options?.silent) {
        setIsLoading(true);
      }
      setLoadError(null);

      try {
        const jobsResult = await supabaseJobs.listLatest({ limit: 200 });
        if (jobsResult.ok === false) {
          throw new Error(jobsResult.message);
        }

        const jobs = jobsResult.data;
        const profileIds = Array.from(
          new Set(
            jobs
              .flatMap((job) => [job.user_id, job.contractor_id])
              .filter(Boolean) as string[],
          ),
        );

        const profilesResult = await supabaseProfiles.listByIds(profileIds);
        if (profilesResult.ok === false) {
          throw new Error(profilesResult.message);
        }

        const profilesById = new Map(
          profilesResult.data.map((profile) => [profile.id, profile]),
        );

        // Load job attachments
        const jobIds = jobs.map((job) => job.id);
        const attachmentsResult = await supabaseJobAttachments.listByJobIds(jobIds);
        const attachments = attachmentsResult.ok ? attachmentsResult.data : [];
        const attachmentUrls = attachmentsResult.ok
          ? await supabaseJobAttachments.getSignedUrls(attachments)
          : new Map<string, string>();

        const attachmentsByJobId = new Map<string, typeof attachments>();
        for (const attachment of attachments) {
          const items = attachmentsByJobId.get(attachment.job_id) ?? [];
          items.push(attachment);
          attachmentsByJobId.set(attachment.job_id, items);
        }

        const nextRows: RequestListRow[] = jobs.map((job) => {
          const userProfile = profilesById.get(job.user_id) ?? null;
          const contractorProfile = job.contractor_id
            ? (profilesById.get(job.contractor_id) ?? null)
            : null;

          const request = mapJobRowToUserRequestHistoryItem({
            job,
            userProfile,
            contractorProfile,
            attachments: attachmentsByJobId.get(job.id) ?? [],
            attachmentUrls,
          });

          const userName =
            userProfile?.full_name?.trim() ||
            `${userProfile?.first_name ?? ""} ${userProfile?.last_name ?? ""}`.trim() ||
            "—";

          return {
            id: request.id,
            userName,
            userEmail: userProfile?.email?.trim() || "—",
            request,
          };
        });

        const selectedId = useRequestsStore.getState().selectedRequestId;
        const selectedExistsInNext =
          selectedId && nextRows.some((row) => row.id === selectedId);

        if (selectedId && !selectedExistsInNext) {
          if (options?.source === "realtime") {
            toast.info("Selected request left the live queue", {
              description:
                "The sidebar and tracker were closed after the request disappeared from live data.",
            });
          }

          pendingRowsRef.current = null;
          useRequestsStore.getState().closeAll();
        }

        setBaseRows(nextRows);
        setHasLiveRequests(true);
      } catch (error) {
        setHasLiveRequests(false);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load requests right now.",
        );
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadRequests({ source: "initial" });
  }, [loadRequests]);

  useEffect(() => {
    if (
      import.meta.env.MODE === "test" ||
      import.meta.env.VITEST ||
      !isSupabaseConfigured() ||
      !supabase
    ) {
      return;
    }

    let isActive = true;
    const channel = supabase
      .channel("admin-requests-jobs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
        },
        () => {
          if (!isActive) {
            return;
          }

          logger.info("Received realtime jobs update. Refreshing requests.");
          void loadRequests({ silent: true, source: "realtime" });
        },
      )
      .subscribe((status) => {
        if (!isActive) {
          return;
        }

        const connected = status === "SUBSCRIBED";
        setIsRealtimeConnected(connected);

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          logger.error("Requests realtime subscription failed.", status);
        }
      });

    return () => {
      isActive = false;
      setIsRealtimeConnected(false);
      void supabase.removeChannel(channel);
    };
  }, [loadRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    expanded,
    priorityFilter,
    searchQuery,
    statusFilter,
    fromFilter,
    toFilter,
  ]);

  const rows = useMemo<RequestListRow[]>(() => {
    return baseRows.map((row) => ({
      ...row,
      request: applyRequestStatusOverride(
        row.request,
        requestStatusById[row.id],
      ),
    }));
  }, [baseRows, requestStatusById]);

  const queueCounts = useMemo(() => {
    const counts = {
      urgent: 0,
      awaitingDispatch: 0,
      needsReview: 0,
      delayed: 0,
    };

    for (const row of rows) {
      const queue = getRequestOperationalQueue(
        row.request as any,
        requestOpsById[row.id],
      );
      if (queue === "urgent") counts.urgent += 1;
      if (queue === "awaiting-dispatch") counts.awaitingDispatch += 1;
      if (queue === "needs-review") counts.needsReview += 1;
      if (queue === "delayed") counts.delayed += 1;
    }

    return counts;
  }, [requestOpsById, rows]);

  const queueCards = useMemo<RequestsQueueCard[]>(() => {
    return [
      {
        title: "Urgent queue",
        description: "Emergency requests that need immediate attention.",
        value: queueCounts.urgent.toLocaleString(),
        tone: "danger",
        onClick: () => {
          setSearchQuery("");
          setExpanded(false);
          setManyFilters({
            ...requestsFilterDefaults,
            priority: "Emergency",
          });
        },
      },
      {
        title: "Awaiting dispatch",
        description: "Assigned requests waiting for the next dispatch step.",
        value: queueCounts.awaitingDispatch.toLocaleString(),
        tone: "warning",
        onClick: () => {
          setSearchQuery("");
          setExpanded(false);
          setManyFilters({
            ...requestsFilterDefaults,
            status: "Pending",
          });
        },
      },
      {
        title: "Needs review",
        description: "Pending requests blocked on operations decisions.",
        value: queueCounts.needsReview.toLocaleString(),
        tone: "neutral",
        onClick: () => {
          setSearchQuery("");
          setExpanded(false);
          setManyFilters({
            ...requestsFilterDefaults,
            status: "Pending",
          });
        },
      },
      {
        title: "Delayed",
        description: "Requests flagged as delayed or requiring follow-up.",
        value: queueCounts.delayed.toLocaleString(),
        tone: "warning",
        onClick: () => {
          setSearchQuery("");
          setExpanded(false);
          resetFilters();
        },
      },
    ];
  }, [queueCounts, resetFilters, setManyFilters]);

  const filteredRows = useMemo(
    () =>
      filterRequestRows(rows, {
        query: searchQuery,
        status: statusFilter as RequestFilterStatus | null,
        priority: priorityFilter as RequestFilterPriority | null,
        from: fromFilter,
        to: toFilter,
      }),
    [rows, searchQuery, statusFilter, priorityFilter, fromFilter, toFilter],
  );

  const paginatedRows = useMemo(
    () => paginateItems(filteredRows, currentPage, pageSize),
    [filteredRows, currentPage, pageSize],
  );
  const totalPages = paginatedRows.totalPages;
  const currentRows = paginatedRows.items;

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

  const setLocalRequestRow = (job: JobRow) => {
    setBaseRows((prev) =>
      prev.map((row) => (row.id === job.id ? buildRowFromJob(row, job) : row)),
    );
  };

  const handleUpdateRequestStatus = async (
    action: RequestStatusAction,
    options?: { cancellationReason?: string },
  ) => {
    if (!selectedRow) {
      toast.error("Unable to update status", {
        description: "No request is currently selected.",
      });
      return;
    }

    const isLiveWriteFlow = hasLiveRequests && isSupabaseConfigured();
    const nextJobStatus = mapRequestActionToJobStatus(action);

    if (isLiveWriteFlow) {
      const updateResult = await supabaseJobs.updateLifecycle({
        jobId: selectedRow.id,
        status: nextJobStatus,
        actorUserId: nextJobStatus === "cancelled" ? adminUserId : undefined,
        cancellationReason: options?.cancellationReason,
      });

      if (updateResult.ok === false) {
        throw new Error(updateResult.message);
      }

      setLocalRequestRow(updateResult.data);

      // Emit event for notification trail
      // Note: audit=false for cancellations because data.ts already logs via supabaseAuditLog
      void emitEvent({
        type:
          nextJobStatus === "completed"
            ? BusinessEventType.JOB_COMPLETED
            : nextJobStatus === "cancelled"
              ? BusinessEventType.JOB_CANCELLED
              : BusinessEventType.JOB_BROADCAST,
        actorId: adminUserId,
        subjectId: selectedRow.id,
        source: "admin-dashboard",
        priority: "high",
        audit: nextJobStatus !== "cancelled",
        realtime: true,
        metadata: {
          jobStatus: nextJobStatus,
          service: selectedRow.request.service,
          userName: selectedRow.userName,
          cancellationReason: nextJobStatus === "cancelled"
            ? options?.cancellationReason?.trim() || null
            : undefined,
        },
      });

      useRequestsStore.getState().setRequestStatusOverride(selectedRow.id, {
        status:
          nextJobStatus === "completed"
            ? "Completed"
            : nextJobStatus === "cancelled"
              ? "Cancelled"
              : "Pending",
        lifecycleStatus:
          nextJobStatus === "completed"
            ? "Completed"
            : nextJobStatus === "cancelled"
              ? "Cancelled"
              : "Current",
        etaLabel:
          nextJobStatus === "completed"
            ? "Completed"
            : nextJobStatus === "cancelled"
              ? "Cancelled"
              : "Awaiting dispatch",
      });
      useRequestsStore
        .getState()
        .setCancellationReason(
          selectedRow.id,
          nextJobStatus === "cancelled"
            ? options?.cancellationReason?.trim() || null
            : null,
        );
    } else {
      updateRequestStatus(selectedRow.id, action);
      useRequestsStore
        .getState()
        .setCancellationReason(
          selectedRow.id,
          action === "Cancel order"
            ? options?.cancellationReason?.trim() || null
            : null,
        );
    }

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

        <section className="rounded-[20px] border border-[#EAECF0] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-[#667085]">
              Operational queues
            </h2>
            <p className="text-xs text-[#98A2B3]">
              Prioritize urgent and blocked requests first.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {queueCards.map((card) => (
              <RequestsQueueCard key={card.title} {...card} />
            ))}
          </div>
          <div className="mt-4 rounded-[14px] border border-[#D0D5DD] bg-[#FCFCFD] px-4 py-3 text-sm text-[#475467]">
            Live jobs sync:{" "}
            <span className="font-semibold text-[#101828]">
              {hasLiveRequests && isRealtimeConnected
                ? "Realtime connected"
                : hasLiveRequests
                  ? "Live reads active"
                  : "Mock fallback"}
            </span>
            . Delay, dispute, and escalation notes remain local operations
            annotations until matching backend fields are added.
          </div>
        </section>

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
                onClick={() => setExpanded((prev) => !prev)}
                className="inline-flex h-[42px] items-center justify-center rounded-[12px] border border-[#EAECF0] bg-[#FCFCFD] px-4 text-sm font-semibold text-[#667085] transition hover:bg-white"
                aria-label={
                  expanded
                    ? "Show fewer requests per page"
                    : "Show more requests per page"
                }
              >
                {expanded ? "See less" : "See all"}
              </button>
              <FilterButton
                title="Filter requests"
                schema={requestsFiltersSchema}
                defaults={requestsFilterDefaults}
                trigger={({ onClick }) => (
                  <button
                    type="button"
                    onClick={onClick}
                    className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-[12px] border border-[#EAECF0] bg-[#FCFCFD] text-[#667085] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
                    aria-label="Filter requests"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                )}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="border-b border-[#EAECF0] bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#667085] sm:px-5">
              Loading live requests…
            </div>
          ) : loadError ? (
            <div className="border-b border-[#EAECF0] bg-[#FEF3F2] px-4 py-3 text-sm font-medium text-[#B42318] sm:px-5">
              {loadError}
            </div>
          ) : null}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1080px]">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-sm font-semibold text-[#475467]">
                  <th className="w-[260px] px-5 py-4">Name of users</th>
                  <th className="w-[240px] px-5 py-4">Location</th>
                  <th className="w-[180px] px-5 py-4">Service</th>
                  <th className="w-[170px] px-5 py-4">Date Joined</th>
                  <th className="w-[230px] px-5 py-4">Account Status</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0]">
                {currentRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-4">
                      <RequestRowUser
                        userName={row.userName}
                        userEmail={row.userEmail}
                      />
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
                      <div className="flex min-w-[220px] flex-wrap items-center gap-2">
                        <span
                          className={[
                            "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold",
                            getRequestStatusClasses(row.request.status),
                          ].join(" ")}
                        >
                          {row.request.status}
                        </span>
                        {getRequestOperationalBadges(
                          row.request as any,
                          requestOpsById[row.id],
                        ).map((badge) => (
                          <span
                            key={badge.label}
                            className={[
                              "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                              badge.className,
                            ].join(" ")}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </div>
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

          <div className="space-y-3 p-4 md:hidden">
            {currentRows.length ? (
              currentRows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-[14px] border border-[#EAECF0] bg-[#FCFCFD] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold leading-5 text-[#101828]">
                        {row.request.requestCode}
                      </p>
                      <p className="mt-1 text-[13px] leading-5 text-[#98A2B3]">
                        {row.request.date}
                      </p>
                    </div>
                    <RequestRowActions
                      requestCode={row.request.requestCode}
                      onViewRequest={() => handleOpenRequest(row)}
                    />
                  </div>

                  <div className="mt-4">
                    <RequestRowUser
                      userName={row.userName}
                      userEmail={row.userEmail}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[12px] font-medium leading-4 text-[#98A2B3]">
                        Service
                      </p>
                      <p className="mt-1 text-[14px] font-semibold leading-5 text-[#101828]">
                        {row.request.service}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] font-medium leading-4 text-[#98A2B3]">
                        Status
                      </p>
                      <div className="mt-1">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
                            getRequestStatusClasses(row.request.status),
                          ].join(" ")}
                        >
                          {row.request.status}
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {getRequestOperationalBadges(
                            row.request as any,
                            requestOpsById[row.id],
                          ).map((badge) => (
                            <span
                              key={badge.label}
                              className={[
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                                badge.className,
                              ].join(" ")}
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-[12px] font-medium leading-4 text-[#98A2B3]">
                        Location
                      </p>
                      <p
                        className="mt-1 text-[14px] leading-5 text-[#667085]"
                        title={row.request.location}
                      >
                        {truncateRequestLocation(row.request.location)}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[14px] border border-dashed border-[#D0D5DD] px-4 py-10 text-center text-sm font-medium text-[#98A2B3]">
                No requests match the current search.
              </div>
            )}
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
        <RequestsLiveTrackerOverlay
          requestId={selectedRow?.id ?? null}
          request={selectedRow?.request ?? null}
          customerName={selectedRow?.userName ?? ""}
        />
      </div>
    </DashboardLayout>
  );
}
