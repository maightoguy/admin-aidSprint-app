import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthStore } from "@/auth/auth.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardLayout } from "../shared/dashboard-layout";
import { SupportDetailsSidebar } from "./support-sidebar";
import {
  supportTicketSeeds,
  type SupportTicket,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from "./support.data";
import type {
  FilterField,
  FiltersState,
} from "../shared/filters/filter-schema";
import { FilterButton } from "../shared/filters/filter-button";
import { useUrlFilters } from "../shared/filters/use-url-filters";
import { filterSupportTickets } from "./support.utils";
import { paginateItems } from "../shared/pagination-utils";
import { isSupabaseFeatureEnabled } from "@/lib/supabase/client";
import {
  supabaseJobs,
  supabaseProfiles,
  supabaseSupport,
} from "@/lib/supabase/data";
import {
  formatDateLabel,
  mapSupportTicketRowToSupportTicket,
  mapSupportUiStatusToDbStatus,
} from "@/lib/supabase/mappers";

const supportStatuses: SupportTicketStatus[] = ["Open", "Pending", "Resolved"];
const supportPriorities: SupportTicketPriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

const supportFiltersSchema: FilterField[] = [
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
    options: supportStatuses.map((status) => ({
      label: status,
      value: status,
    })),
  },
  {
    type: "select",
    key: "priority",
    label: "Priority",
    options: supportPriorities.map((priority) => ({
      label: priority,
      value: priority,
    })),
  },
];

const supportFilterDefaults: FiltersState = {
  status: null,
  priority: null,
  from: null,
  to: null,
};

function getStatusPillClassName(status: SupportTicketStatus) {
  if (status === "Open") {
    return "bg-[#E8F8EE] text-[#22C55E]";
  }

  if (status === "Pending") {
    return "bg-[#FEF3E8] text-[#F79009]";
  }

  return "bg-[#FEE4E2] text-[#F04438]";
}

function isLiveAccessFailure(message: string) {
  const normalized = message.trim().toLowerCase();
  return (
    normalized.includes("not authorized to access the admin portal") ||
    normalized.includes("please sign in again") ||
    normalized.includes("admin session no longer matches this action")
  );
}

function SupportRowUser({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAECF0] text-[20px] font-semibold text-[#19213D]">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[16px] font-semibold leading-6 text-[#101828]">
          {name}
        </p>
        <p className="truncate text-[14px] leading-5 text-[#98A2B3]">{email}</p>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const adminUserId = useAuthStore((state) => state.session?.userId ?? "");
  const [tickets, setTickets] = useState<SupportTicket[]>(supportTicketSeeds);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [hasLiveTickets, setHasLiveTickets] = useState(false);
  const pageSize = expanded ? 10 : 5;
  const { filters: urlFilters } = useUrlFilters({
    schema: supportFiltersSchema,
    defaults: supportFilterDefaults,
  });

  const statusFilter =
    urlFilters.status &&
    supportStatuses.includes(urlFilters.status as SupportTicketStatus)
      ? String(urlFilters.status)
      : null;
  const priorityFilter =
    urlFilters.priority &&
    supportPriorities.includes(urlFilters.priority as SupportTicketPriority)
      ? String(urlFilters.priority)
      : null;
  const fromFilter =
    typeof urlFilters.from === "string" && urlFilters.from
      ? urlFilters.from
      : null;
  const toFilter =
    typeof urlFilters.to === "string" && urlFilters.to ? urlFilters.to : null;

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    expanded,
    statusFilter,
    priorityFilter,
    fromFilter,
    toFilter,
  ]);

  const filteredTickets = useMemo(
    () =>
      filterSupportTickets(tickets, {
        query: searchQuery,
        status: statusFilter as SupportTicketStatus | null,
        priority: priorityFilter as SupportTicketPriority | null,
        from: fromFilter,
        to: toFilter,
      }),
    [tickets, searchQuery, statusFilter, priorityFilter, fromFilter, toFilter],
  );

  const paginatedTickets = useMemo(
    () => paginateItems(filteredTickets, currentPage, pageSize),
    [filteredTickets, currentPage, pageSize],
  );
  const totalPages = paginatedTickets.totalPages;
  const currentRows = paginatedTickets.items;

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [selectedTicketId, tickets],
  );

  const loadSupportTickets = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!isSupabaseFeatureEnabled()) {
        return;
      }

      if (!options?.silent) {
        setIsLiveLoading(true);
      }
      setLiveError(null);

      try {
        const ticketsResult = await supabaseSupport.listLatest({ limit: 200 });
        if (ticketsResult.ok === false) {
          throw new Error(ticketsResult.message);
        }

        const ticketRows = ticketsResult.data;
        const [eventsResult, profilesResult, jobsResult] = await Promise.all([
          supabaseSupport.listEventsByTicketIds(
            ticketRows.map((ticket) => ticket.id),
          ),
          supabaseProfiles.listByIds(
            ticketRows.map((ticket) => ticket.requester_id),
          ),
          supabaseJobs.listByIds(
            ticketRows
              .map((ticket) => ticket.job_id)
              .filter(Boolean) as string[],
          ),
        ]);

        if (eventsResult.ok === false) {
          throw new Error(eventsResult.message);
        }
        if (profilesResult.ok === false) {
          throw new Error(profilesResult.message);
        }
        if (jobsResult.ok === false) {
          throw new Error(jobsResult.message);
        }

        const profilesById = new Map(
          profilesResult.data.map((profile) => [profile.id, profile]),
        );
        const jobsById = new Map(jobsResult.data.map((job) => [job.id, job]));
        const eventsByTicketId = eventsResult.data.reduce<
          Record<string, typeof eventsResult.data>
        >((acc, event) => {
          if (!acc[event.ticket_id]) {
            acc[event.ticket_id] = [];
          }
          acc[event.ticket_id].push(event);
          return acc;
        }, {});

        setTickets(
          ticketRows.map((ticket) =>
            mapSupportTicketRowToSupportTicket({
              ticket,
              requesterProfile: profilesById.get(ticket.requester_id) ?? null,
              job: ticket.job_id ? (jobsById.get(ticket.job_id) ?? null) : null,
              events: eventsByTicketId[ticket.id] ?? [],
            }),
          ),
        );
        setHasLiveTickets(true);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load support tickets right now.";
        if (isLiveAccessFailure(message)) {
          setTickets([]);
          setSelectedTicketId(null);
        }
        setHasLiveTickets(false);
        setLiveError(message);
      } finally {
        if (!options?.silent) {
          setIsLiveLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadSupportTickets();
  }, [loadSupportTickets]);

  const handleUpdateStatus = async (
    status: Extract<SupportTicketStatus, "Pending" | "Resolved">,
  ) => {
    if (!selectedTicketId) {
      toast.error("Unable to update ticket status", {
        description: "No support ticket is currently selected.",
      });
      return;
    }

    if (isUpdatingStatus) {
      return;
    }

    setIsUpdatingStatus(true);

    try {
      if (hasLiveTickets && selectedTicket?.dataSource === "live") {
        const actorUserId = adminUserId.trim();
        if (!actorUserId) {
          throw new Error(
            "Your admin session is missing a user id. Please sign in again.",
          );
        }

        const updateResult = await supabaseSupport.updateStatus({
          ticketId: selectedTicketId,
          status: mapSupportUiStatusToDbStatus(status),
          actorUserId,
          message: `Support ticket marked as ${status.toLowerCase()}.`,
        });

        if (updateResult.ok === false) {
          throw new Error(updateResult.message);
        }

        setTickets((currentTickets) =>
          currentTickets.map((ticket) =>
            ticket.id === selectedTicketId
              ? {
                  ...ticket,
                  status,
                  backendStatus: updateResult.data.status,
                  updatedAt: formatDateLabel(updateResult.data.updated_at),
                }
              : ticket,
          ),
        );

        void loadSupportTickets({ silent: true });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setTickets((currentTickets) =>
          currentTickets.map((ticket) =>
            ticket.id === selectedTicketId
              ? {
                  ...ticket,
                  status,
                  updatedAt: new Date().toLocaleDateString(),
                }
              : ticket,
          ),
        );
      }

      toast.success("Ticket status updated successfully.", {
        description: `The ticket is now marked as ${status.toLowerCase()}.`,
      });
    } catch (error) {
      toast.error("Failed to update ticket status.", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <DashboardLayout title="Support">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-[16px] border border-[#EAECF0] bg-white shadow-sm">
          {/* Table Header */}
          <div className="flex flex-col gap-4 border-b border-[#EAECF0] px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[14px] font-semibold leading-5 text-[#98A2B3]">
              All tickets
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <div className="relative min-w-0 sm:w-[294px]">
                <Search className="pointer-events-none absolute left-[14px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#101828]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Contractors ..."
                  className="h-[42px] rounded-[10px] border-[#EAECF0] bg-[#FCFCFD] pl-[40px] text-[14px] text-[#667085] placeholder:text-[#98A2B3]"
                />
              </div>
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="inline-flex h-[42px] items-center justify-center rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD] px-4 text-sm font-semibold text-[#667085] transition hover:bg-white"
                aria-label={
                  expanded
                    ? "Show fewer support tickets per page"
                    : "Show more support tickets per page"
                }
              >
                {expanded ? "See less" : "See all"}
              </button>
              <FilterButton
                title="Filter support tickets"
                schema={supportFiltersSchema}
                defaults={supportFilterDefaults}
                trigger={({ onClick }) => (
                  <button
                    type="button"
                    onClick={onClick}
                    className="inline-flex h-[42px] w-[46px] shrink-0 items-center justify-center rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD] text-[#667085] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
                    aria-label="Filter tickets"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                )}
              />
            </div>
          </div>

          {isLiveLoading ? (
            <div className="border-b border-[#EAECF0] bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#667085] sm:px-6">
              Loading live support tickets...
            </div>
          ) : liveError ? (
            <div className="border-b border-[#EAECF0] bg-[#FEF3F2] px-4 py-3 text-sm font-medium text-[#B42318] sm:px-6">
              {liveError}
            </div>
          ) : hasLiveTickets ? (
            <div className="border-b border-[#EAECF0] bg-[#FCFCFD] px-4 py-3 text-sm text-[#475467] sm:px-6">
              Live support reads and ticket status writes are active for the
              current admin session.
            </div>
          ) : null}

          {/* Table Content */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1080px]">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-[14px] font-semibold leading-5 text-[#667085]">
                  <th className="w-[140px] px-6 py-4">Ticket ID</th>
                  <th className="w-[260px] px-6 py-4">User</th>
                  <th className="w-[180px] px-6 py-4">Category</th>
                  <th className="w-[260px] px-6 py-4">Description</th>
                  <th className="w-[160px] px-6 py-4">Date Created</th>
                  <th className="w-[140px] px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0]">
                {currentRows.length > 0 ? (
                  currentRows.map((ticket) => (
                    <tr key={ticket.id} className="align-middle">
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] leading-5 text-[#98A2B3]">
                        {ticket.ticketId}
                      </td>
                      <td className="px-6 py-4">
                        <SupportRowUser
                          name={ticket.userName}
                          email={ticket.userEmail}
                        />
                      </td>
                      <td className="px-6 py-4 text-[14px] font-semibold leading-5 text-[#101828]">
                        {ticket.category}
                      </td>
                      <td className="px-6 py-4 text-[14px] leading-5 text-[#98A2B3] max-w-[200px] truncate">
                        {ticket.subject}
                      </td>
                      <td className="px-6 py-4 text-[14px] leading-5 text-[#98A2B3]">
                        {ticket.dateCreated}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[14px] font-medium leading-5",
                            getStatusPillClassName(ticket.status),
                          )}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="h-10 w-10 inline-flex items-center justify-center rounded-[6px] border border-[#D0D5DD] bg-white text-[#101828] hover:bg-[#F8FAFC]"
                              aria-label={`Actions for ticket ${ticket.ticketId}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-[190px] rounded-[10px] p-0 shadow-lg"
                          >
                            <DropdownMenuItem
                              onClick={() => setSelectedTicketId(ticket.id)}
                              className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#2D3036] focus:bg-[#F8FAFC]"
                            >
                              View details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm font-medium text-[#98A2B3]"
                    >
                      No support tickets match the current search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {currentRows.length > 0 ? (
              currentRows.map((ticket) => (
                <article
                  key={ticket.id}
                  className="rounded-[14px] border border-[#EAECF0] bg-[#FCFCFD] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold leading-5 text-[#101828]">
                        {ticket.ticketId}
                      </p>
                      <p className="mt-1 text-[13px] leading-5 text-[#98A2B3]">
                        {ticket.dateCreated}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#D0D5DD] bg-white text-[#101828] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20"
                          aria-label={`Actions for ticket ${ticket.ticketId}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="w-[190px] rounded-[10px] border border-[#EAECF0] bg-white p-0 shadow-[0_18px_38px_rgba(15,23,42,0.12)]"
                      >
                        <DropdownMenuItem
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#2D3036] focus:bg-[#F8FAFC]"
                        >
                          View details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4">
                    <SupportRowUser
                      name={ticket.userName}
                      email={ticket.userEmail}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[12px] font-medium leading-4 text-[#98A2B3]">
                        Category
                      </p>
                      <p className="mt-1 text-[14px] font-semibold leading-5 text-[#101828]">
                        {ticket.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] font-medium leading-4 text-[#98A2B3]">
                        Status
                      </p>
                      <div className="mt-1">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-[14px] font-medium leading-5",
                            getStatusPillClassName(ticket.status),
                          )}
                        >
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[12px] font-medium leading-4 text-[#98A2B3]">
                      Subject
                    </p>
                    <p className="mt-1 text-[14px] leading-5 text-[#667085]">
                      {ticket.subject}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[14px] border border-dashed border-[#D0D5DD] px-4 py-10 text-center text-sm font-medium text-[#98A2B3]">
                No support tickets match the current search.
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 border-t border-[#EAECF0] px-4 py-4 sm:px-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-9 w-9 inline-flex items-center justify-center rounded-[8px] border border-[#D0D5DD] disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "h-9 w-9 inline-flex items-center justify-center rounded-[8px] text-[14px] font-semibold",
                  currentPage === page
                    ? "border border-[#071B58] bg-white text-[#101828]"
                    : "text-[#98A2B3]",
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-9 w-9 inline-flex items-center justify-center rounded-[8px] border border-[#D0D5DD] disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Sidebar */}
        <SupportDetailsSidebar
          open={!!selectedTicketId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTicketId(null);
              setIsUpdatingStatus(false);
            }
          }}
          ticket={selectedTicket}
          isUpdating={isUpdatingStatus}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </DashboardLayout>
  );
}
