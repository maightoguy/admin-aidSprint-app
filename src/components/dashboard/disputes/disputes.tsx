import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { paginateItems } from "../shared/pagination-utils";
import { disputeSeeds } from "./disputes.data";
import type {
  DisputeLifecycleState,
  DisputePriority,
  DisputeReason,
  DisputeRecord,
} from "./disputes.types";
import {
  filterDisputes,
  getDisputeReasonLabel,
  getDisputeStatusPillClassName,
} from "./disputes.utils";
import { DisputeDetailsSidebar } from "./disputes-sidebar";

const disputeLifecycleStates: DisputeLifecycleState[] = [
  "Opened",
  "UnderReview",
  "EvidenceRequested",
  "ProposedResolution",
  "Resolved",
  "Rejected",
];

const disputeReasons: DisputeReason[] = [
  "ServiceQuality",
  "NoShow",
  "Overcharge",
  "Safety",
  "Fraud",
  "Other",
];

const disputePriorities: DisputePriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

const disputesFiltersSchema: FilterField[] = [
  {
    type: "dateRange",
    key: "dateRange",
    label: "Date range",
    fromKey: "from",
    toKey: "to",
  },
  {
    type: "select",
    key: "lifecycleState",
    label: "Lifecycle state",
    options: disputeLifecycleStates.map((state) => ({
      label: state.replace(/([A-Z])/g, " $1").trim(),
      value: state,
    })),
  },
  {
    type: "select",
    key: "reason",
    label: "Reason",
    options: disputeReasons.map((reason) => ({
      label: getDisputeReasonLabel(reason),
      value: reason,
    })),
  },
  {
    type: "select",
    key: "priority",
    label: "Priority",
    options: disputePriorities.map((priority) => ({
      label: priority,
      value: priority,
    })),
  },
  {
    type: "select",
    key: "payoutImpact",
    label: "Payout impact",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
  },
];

const disputesFilterDefaults: FiltersState = {
  lifecycleState: null,
  reason: null,
  priority: null,
  payoutImpact: null,
  from: null,
  to: null,
};

function DisputeRowUser({
  name,
  subtitle,
}: {
  name: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAECF0] text-[20px] font-semibold text-[#19213D]">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[16px] font-semibold leading-6 text-[#101828]">
          {name}
        </p>
        <p className="truncate text-[14px] leading-5 text-[#98A2B3]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<DisputeRecord[]>(disputeSeeds);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(
    null,
  );
  const [sidebarAction, setSidebarAction] = useState<
    "requestEvidence" | "proposeResolution" | "resolve" | "reject" | null
  >(null);

  const pageSize = expanded ? 10 : 5;
  const { filters: urlFilters } = useUrlFilters({
    schema: disputesFiltersSchema,
    defaults: disputesFilterDefaults,
  });

  const lifecycleStateFilter =
    urlFilters.lifecycleState &&
    disputeLifecycleStates.includes(
      urlFilters.lifecycleState as DisputeLifecycleState,
    )
      ? (urlFilters.lifecycleState as DisputeLifecycleState)
      : null;
  const reasonFilter =
    urlFilters.reason &&
    disputeReasons.includes(urlFilters.reason as DisputeReason)
      ? (urlFilters.reason as DisputeReason)
      : null;
  const priorityFilter =
    urlFilters.priority &&
    disputePriorities.includes(urlFilters.priority as DisputePriority)
      ? (urlFilters.priority as DisputePriority)
      : null;
  const payoutImpactFilter =
    urlFilters.payoutImpact === "Yes" || urlFilters.payoutImpact === "No"
      ? (urlFilters.payoutImpact as "Yes" | "No")
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
    lifecycleStateFilter,
    reasonFilter,
    priorityFilter,
    payoutImpactFilter,
    fromFilter,
    toFilter,
  ]);

  const filteredDisputes = useMemo(
    () =>
      filterDisputes(disputes, {
        query: searchQuery,
        lifecycleState: lifecycleStateFilter,
        reason: reasonFilter,
        priority: priorityFilter,
        payoutImpact: payoutImpactFilter,
        from: fromFilter,
        to: toFilter,
      }),
    [
      disputes,
      searchQuery,
      lifecycleStateFilter,
      reasonFilter,
      priorityFilter,
      payoutImpactFilter,
      fromFilter,
      toFilter,
    ],
  );

  const paginatedDisputes = useMemo(
    () => paginateItems(filteredDisputes, currentPage, pageSize),
    [filteredDisputes, currentPage, pageSize],
  );
  const totalPages = paginatedDisputes.totalPages;
  const currentRows = paginatedDisputes.items;

  const selectedDispute = useMemo(
    () => disputes.find((d) => d.id === selectedDisputeId) ?? null,
    [disputes, selectedDisputeId],
  );

  const openSidebar = (
    disputeId: string,
    action: typeof sidebarAction = null,
  ) => {
    setSelectedDisputeId(disputeId);
    setSidebarAction(action);
  };

  const updateDispute = (updated: DisputeRecord) => {
    setDisputes((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  };

  return (
    <DashboardLayout title="Disputes">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-[16px] border border-[#EAECF0] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#EAECF0] px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[14px] font-semibold leading-5 text-[#98A2B3]">
              All disputes
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <div className="relative min-w-0 sm:w-[294px]">
                <Search className="pointer-events-none absolute left-[14px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#101828]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search disputes ..."
                  className="h-[42px] rounded-[10px] border-[#EAECF0] bg-[#FCFCFD] pl-[40px] text-[14px] text-[#667085] placeholder:text-[#98A2B3]"
                />
              </div>
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="inline-flex h-[42px] items-center justify-center rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD] px-4 text-sm font-semibold text-[#667085] transition hover:bg-white"
                aria-label={
                  expanded
                    ? "Show fewer disputes per page"
                    : "Show more disputes per page"
                }
              >
                {expanded ? "See less" : "See all"}
              </button>
              <FilterButton
                title="Filter disputes"
                schema={disputesFiltersSchema}
                defaults={disputesFilterDefaults}
                trigger={({ onClick }) => (
                  <button
                    type="button"
                    onClick={onClick}
                    className="inline-flex h-[42px] w-[46px] shrink-0 items-center justify-center rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD] text-[#667085] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
                    aria-label="Filter disputes"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                )}
              />
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1280px]">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-[14px] font-semibold leading-5 text-[#667085]">
                  <th className="w-[240px] px-6 py-4">Dispute</th>
                  <th className="w-[250px] px-6 py-4">Linked request</th>
                  <th className="w-[260px] px-6 py-4">Parties</th>
                  <th className="w-[150px] px-6 py-4">Reason</th>
                  <th className="w-[170px] px-6 py-4">Status</th>
                  <th className="w-[140px] px-6 py-4">Created</th>
                  <th className="w-[140px] px-6 py-4">Last update</th>
                  <th className="px-6 py-4 text-right" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0]">
                {currentRows.length > 0 ? (
                  currentRows.map((dispute) => (
                    <tr key={dispute.id} className="align-top">
                      <td className="px-6 py-4">
                        <p className="whitespace-nowrap text-[14px] font-semibold leading-5 text-[#101828]">
                          {dispute.disputeCode}
                        </p>
                        <p className="mt-1 max-w-[220px] text-[14px] leading-5 text-[#98A2B3]">
                          {dispute.title}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-[14px] leading-5 text-[#98A2B3]">
                        <p className="whitespace-nowrap font-semibold text-[#101828]">
                          {dispute.requestCode}
                        </p>
                        <p className="mt-1 max-w-[220px] text-[14px] leading-5">
                          {dispute.service} · {dispute.location}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="min-w-[220px] space-y-2">
                          <DisputeRowUser
                            name={dispute.customerName}
                            subtitle="Customer"
                          />
                          <DisputeRowUser
                            name={dispute.contractorName}
                            subtitle="Contractor"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] font-semibold leading-5 text-[#101828]">
                        {getDisputeReasonLabel(dispute.reason)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[14px] font-medium leading-5",
                            getDisputeStatusPillClassName(
                              dispute.lifecycleState,
                            ),
                          )}
                        >
                          {dispute.lifecycleState
                            .replace(/([A-Z])/g, " $1")
                            .trim()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] leading-5 text-[#98A2B3]">
                        {dispute.createdAtLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] leading-5 text-[#98A2B3]">
                        {dispute.updatedAtLabel}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#D0D5DD] bg-white text-[#101828] hover:bg-[#F8FAFC]"
                              aria-label={`Actions for dispute ${dispute.disputeCode}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className="w-[210px] rounded-[10px] border border-[#EAECF0] bg-white p-0 shadow-[0_18px_38px_rgba(15,23,42,0.12)]"
                          >
                            <DropdownMenuItem
                              onClick={() => openSidebar(dispute.id)}
                              className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#2D3036] focus:bg-[#F8FAFC]"
                            >
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-[#F0F1F2]" />
                            <DropdownMenuItem
                              onClick={() =>
                                openSidebar(dispute.id, "requestEvidence")
                              }
                              className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#175CD3] focus:bg-[#F8FAFC]"
                            >
                              Request evidence
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openSidebar(dispute.id, "proposeResolution")
                              }
                              className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#175CD3] focus:bg-[#F8FAFC]"
                            >
                              Propose resolution
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openSidebar(dispute.id, "resolve")}
                              className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#2D3036] focus:bg-[#F8FAFC]"
                            >
                              Mark resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openSidebar(dispute.id, "reject")}
                              className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#F04438] focus:bg-[#F8FAFC]"
                            >
                              Reject dispute
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm font-medium text-[#98A2B3]"
                    >
                      No disputes match the current search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {currentRows.length > 0 ? (
              currentRows.map((dispute) => (
                <article
                  key={dispute.id}
                  className="rounded-[14px] border border-[#EAECF0] bg-[#FCFCFD] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold leading-5 text-[#101828]">
                        {dispute.disputeCode}
                      </p>
                      <p className="mt-1 truncate text-[13px] leading-5 text-[#98A2B3]">
                        {dispute.title}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#D0D5DD] bg-white text-[#101828] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20"
                          aria-label={`Actions for dispute ${dispute.disputeCode}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="w-[210px] rounded-[10px] border border-[#EAECF0] bg-white p-0 shadow-[0_18px_38px_rgba(15,23,42,0.12)]"
                      >
                        <DropdownMenuItem
                          onClick={() => openSidebar(dispute.id)}
                          className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#2D3036] focus:bg-[#F8FAFC]"
                        >
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-[#F0F1F2]" />
                        <DropdownMenuItem
                          onClick={() =>
                            openSidebar(dispute.id, "requestEvidence")
                          }
                          className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#175CD3] focus:bg-[#F8FAFC]"
                        >
                          Request evidence
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            openSidebar(dispute.id, "proposeResolution")
                          }
                          className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#175CD3] focus:bg-[#F8FAFC]"
                        >
                          Propose resolution
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openSidebar(dispute.id, "resolve")}
                          className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#2D3036] focus:bg-[#F8FAFC]"
                        >
                          Mark resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openSidebar(dispute.id, "reject")}
                          className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#F04438] focus:bg-[#F8FAFC]"
                        >
                          Reject dispute
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div>
                      <p className="text-[12px] font-medium leading-4 text-[#98A2B3]">
                        Linked request
                      </p>
                      <p className="mt-1 text-[14px] font-semibold leading-5 text-[#101828]">
                        {dispute.requestCode}
                      </p>
                      <p className="mt-1 text-[14px] leading-5 text-[#667085]">
                        {dispute.service} · {dispute.location}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[12px] font-medium leading-4 text-[#98A2B3]">
                          Reason
                        </p>
                        <p className="mt-1 text-[14px] font-semibold leading-5 text-[#101828]">
                          {getDisputeReasonLabel(dispute.reason)}
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
                              getDisputeStatusPillClassName(
                                dispute.lifecycleState,
                              ),
                            )}
                          >
                            {dispute.lifecycleState
                              .replace(/([A-Z])/g, " $1")
                              .trim()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[14px] border border-dashed border-[#D0D5DD] px-4 py-10 text-center text-sm font-medium text-[#98A2B3]">
                No disputes match the current search.
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-[#EAECF0] px-4 py-4 sm:px-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#D0D5DD] disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-[14px] font-semibold",
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#D0D5DD] disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <DisputeDetailsSidebar
          open={!!selectedDisputeId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDisputeId(null);
              setSidebarAction(null);
            }
          }}
          dispute={selectedDispute}
          initialAction={sidebarAction}
          onConsumeInitialAction={() => setSidebarAction(null)}
          onUpdateDispute={updateDispute}
        />
      </div>
    </DashboardLayout>
  );
}
