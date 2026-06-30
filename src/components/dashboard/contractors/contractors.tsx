import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DashboardLayout } from "../shared/dashboard-layout";
import type {
  FilterField,
  FiltersState,
} from "../shared/filters/filter-schema";
import { FilterButton } from "../shared/filters/filter-button";
import { useUrlFilters } from "../shared/filters/use-url-filters";
import { paginateItems } from "../shared/pagination-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ContractorsActionsMenu } from "./contractors-actions-menu";
import { ContractorCard } from "./contractor-card";
import { ContractorFormModal } from "./contractor-form-modal";
import { ContractorSummaryCard } from "./contractor-summary-card";
import {
  contractorRecords,
  contractorsSummaryIcon,
  contractorsSummaryPattern,
  loadLiveContractorRecords,
} from "./contractors.data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/auth/auth.store";
import { supabaseContractors } from "@/lib/supabase/data";
import { createLogger } from "@/lib/logger";
import { emitEvent, BusinessEventType } from "@/lib/events";
import type {
  ContractorAccountStatus,
  ContractorCurrentStatus,
  ContractorFilters,
  ContractorFormValues,
  ContractorLifecycleState,
  ContractorMenuAction,
  ContractorRecord,
  ContractorServiceCategory,
  ContractorsSummaryCard,
} from "./contractors.types";
import {
  filterContractors,
  getContractorAccountStatusClasses,
  getContractorCurrentStatusClasses,
  getContractorLifecycleClasses,
  getContractorInitials,
  getContractorPayoutClasses,
  getContractorRiskClasses,
  getContractorVerificationClasses,
} from "./contractors.utils";

const contractorServiceCategories: ContractorServiceCategory[] = [
  "Plumbing",
  "Cleaning",
  "Baby sitting",
  "Electrician",
  "Laundry",
  "Carpentry",
];

const logger = createLogger("Contractors");

const contractorFiltersSchema: FilterField[] = [
  {
    type: "dateRange",
    key: "dateRange",
    label: "Date range",
    fromKey: "from",
    toKey: "to",
  },
  {
    type: "select",
    key: "currentStatus",
    label: "Busy status",
    options: [
      { label: "Online", value: "Online" },
      { label: "Offline", value: "Offline" },
      { label: "Busy", value: "Busy" },
    ],
  },
  {
    type: "select",
    key: "accountStatus",
    label: "Account status",
    options: [
      { label: "Active", value: "Active" },
      { label: "Deactivated", value: "Deactivated" },
    ],
  },
  {
    type: "select",
    key: "specialty",
    label: "Specialty",
    options: contractorServiceCategories.map((category) => ({
      label: category,
      value: category,
    })),
  },
];

const contractorFilterDefaults: FiltersState = {
  currentStatus: null,
  accountStatus: null,
  specialty: null,
  from: null,
  to: null,
};

function getSummaryCards(
  contractors: ContractorRecord[],
): ContractorsSummaryCard[] {
  const total = contractors.length;
  const verified = contractors.filter(
    (item) => item.verificationState === "Verified",
  ).length;
  const watchlist = contractors.filter(
    (item) => item.riskLevel !== "Low" || item.watchlistReason,
  ).length;
  const payoutBlocked = contractors.filter(
    (item) => item.payoutStatus === "Blocked",
  ).length;

  const formatCount = (value: number) => value.toLocaleString("en-US");

  return [
    {
      title: "Total Contractors",
      value: formatCount(total),
      trend: "+ 2.3% vs Yesterday",
      Icon: contractorsSummaryIcon,
    },
    {
      title: "Verified contractors",
      value: formatCount(verified),
      trend: "+ 2.3% vs Yesterday",
      Icon: contractorsSummaryIcon,
    },
    {
      title: "Risk watchlist",
      value: formatCount(watchlist),
      trend: "+ 2.3% vs Yesterday",
      Icon: contractorsSummaryIcon,
    },
    {
      title: "Payout blocked",
      value: formatCount(payoutBlocked),
      trend: "+ 2.3% vs Yesterday",
      Icon: contractorsSummaryIcon,
    },
  ];
}

type ContractorQueueFilter =
  | "all"
  | "pending-review"
  | "watchlist"
  | "payout-blocked"
  | "suspended";

type ContractorLifecycleAction = "suspend" | "restore";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getQueueCounts(contractors: ContractorRecord[]) {
  return {
    pendingReview: contractors.filter(
      (item) =>
        item.verificationState === "Pending review" ||
        item.lifecycleState === "Pending approval",
    ).length,
    watchlist: contractors.filter(
      (item) => item.riskLevel !== "Low" || Boolean(item.watchlistReason),
    ).length,
    payoutBlocked: contractors.filter((item) => item.payoutStatus === "Blocked")
      .length,
    suspended: contractors.filter((item) => item.lifecycleState === "Suspended")
      .length,
  };
}

function matchesQueueFilter(
  contractor: ContractorRecord,
  queueFilter: ContractorQueueFilter,
) {
  if (queueFilter === "all") {
    return true;
  }

  if (queueFilter === "pending-review") {
    return (
      contractor.verificationState === "Pending review" ||
      contractor.lifecycleState === "Pending approval"
    );
  }

  if (queueFilter === "watchlist") {
    return (
      contractor.riskLevel !== "Low" || Boolean(contractor.watchlistReason)
    );
  }

  if (queueFilter === "payout-blocked") {
    return contractor.payoutStatus === "Blocked";
  }

  return contractor.lifecycleState === "Suspended";
}

function QueueCard({
  active,
  title,
  description,
  value,
  tone,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  value: string;
  tone: "warning" | "danger" | "neutral";
  onClick: () => void;
}) {
  const toneClasses =
    tone === "danger"
      ? "border-[#F04438]/20 bg-[#FEF3F2]"
      : tone === "warning"
        ? "border-[#F79009]/20 bg-[#FFF7ED]"
        : "border-[#EAECF0] bg-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-start justify-between gap-4 rounded-[16px] border p-4 text-left shadow-sm transition",
        active
          ? "ring-2 ring-[#071B58]/15"
          : "hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15",
        toneClasses,
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#101828]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#667085]">{description}</p>
      </div>
      <span className="inline-flex shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#344054]">
        {value}
      </span>
    </button>
  );
}

function buildDefaultFilters(): ContractorFilters {
  return {
    query: "",
    currentStatus: "all",
    accountStatus: "all",
    specialty: "all",
    from: null,
    to: null,
  };
}

function mapFormValuesToRecord(
  values: ContractorFormValues,
  existing: ContractorRecord | null,
) {
  const [firstName = "", lastName = ""] = values.name.trim().split(/\s+/, 2);
  const id =
    existing?.id ??
    values.name.trim().toLowerCase().replace(/\s+/g, "-") +
      "-" +
      Math.random().toString(16).slice(2, 8);

  return {
    id,
    ...values,
    firstName: existing?.firstName ?? firstName,
    lastName: existing?.lastName ?? lastName,
    gender: existing?.gender ?? "Male",
    servicesProvided: existing?.servicesProvided ?? [values.serviceCategory],
    locations: existing?.locations ?? [
      {
        id: `${id}-location-1`,
        primaryLine: values.location,
        secondaryLine: "Nigeria",
        isCurrent: true,
      },
    ],
    lifecycleState: existing?.lifecycleState ?? "Pending approval",
    verificationState: existing?.verificationState ?? "Pending review",
    rating: existing?.rating ?? 0,
    totalRatings: existing?.totalRatings ?? 0,
    acceptanceRate: existing?.acceptanceRate ?? 0,
    completionRate: existing?.completionRate ?? 0,
    responseTimeLabel: existing?.responseTimeLabel ?? "No response data yet",
    totalJobsOffered: existing?.totalJobsOffered ?? 0,
    totalJobsAccepted: existing?.totalJobsAccepted ?? 0,
    totalJobsCompleted: existing?.totalJobsCompleted ?? 0,
    repeatedComplaints: existing?.repeatedComplaints ?? 0,
    lastActiveLabel: existing?.lastActiveLabel ?? "No activity yet",
    serviceZoneLabel: existing?.serviceZoneLabel ?? values.location,
    riskLevel: existing?.riskLevel ?? "Medium",
    riskFlags: existing?.riskFlags ?? ["Pending approval"],
    watchlistReason: existing?.watchlistReason,
    payoutStatus: existing?.payoutStatus ?? "Onboarding",
    pendingPayoutAmount: existing?.pendingPayoutAmount ?? "$0",
    payoutsBlockedReason: existing?.payoutsBlockedReason,
  } satisfies ContractorRecord;
}

export type ContractorsPageProps = {
  initialContractors?: ContractorRecord[];
  isLoading?: boolean;
  errorMessage?: string | null;
};

export default function ContractorsPage({
  initialContractors,
  isLoading = false,
  errorMessage = null,
}: ContractorsPageProps) {
  const navigate = useNavigate();
  const adminUserId = useAuthStore((state) => state.session?.userId ?? "");
  const [contractors, setContractors] = useState<ContractorRecord[]>(
    initialContractors ?? contractorRecords,
  );
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [hasLiveContractors, setHasLiveContractors] = useState(false);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const pageSize = expanded ? 10 : 5;
  const { filters: urlFilters } = useUrlFilters({
    schema: contractorFiltersSchema,
    defaults: contractorFilterDefaults,
  });
  const filters = useMemo<ContractorFilters>(() => {
    const currentStatus = urlFilters.currentStatus;
    const accountStatus = urlFilters.accountStatus;
    const specialty = urlFilters.specialty;
    const from = urlFilters.from;
    const to = urlFilters.to;

    return {
      query,
      currentStatus:
        currentStatus === "Online" ||
        currentStatus === "Offline" ||
        currentStatus === "Busy"
          ? currentStatus
          : "all",
      accountStatus:
        accountStatus === "Active" || accountStatus === "Deactivated"
          ? accountStatus
          : "all",
      specialty: contractorServiceCategories.includes(
        specialty as ContractorServiceCategory,
      )
        ? (specialty as ContractorServiceCategory)
        : "all",
      from: typeof from === "string" && from ? from : null,
      to: typeof to === "string" && to ? to : null,
    };
  }, [query, urlFilters]);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formContractor, setFormContractor] = useState<ContractorRecord | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [queueFilter, setQueueFilter] = useState<ContractorQueueFilter>("all");
  const [lifecycleAction, setLifecycleAction] =
    useState<ContractorLifecycleAction | null>(null);
  const [lifecycleReason, setLifecycleReason] = useState("");
  const [selectedLifecycleContractor, setSelectedLifecycleContractor] =
    useState<ContractorRecord | null>(null);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [isLifecycleSaving, setIsLifecycleSaving] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    urlFilters.accountStatus,
    urlFilters.currentStatus,
    urlFilters.specialty,
    urlFilters.from,
    urlFilters.to,
    expanded,
    queueFilter,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadContractors() {
      if (
        import.meta.env.MODE === "test" ||
        import.meta.env.VITEST ||
        !isSupabaseConfigured()
      ) {
        return;
      }

      setLiveLoading(true);
      setLiveError(null);

      try {
        const records = await loadLiveContractorRecords();
        if (!cancelled) {
          setContractors(records);
          setHasLiveContractors(true);
        }
      } catch (error) {
        if (!cancelled) {
          setHasLiveContractors(false);
          setLiveError(
            error instanceof Error
              ? error.message
              : "Unable to load contractors right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setLiveLoading(false);
        }
      }
    }

    void loadContractors();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      import.meta.env.MODE === "test" ||
      import.meta.env.VITEST ||
      !hasLiveContractors ||
      !isSupabaseConfigured() ||
      !supabase
    ) {
      return;
    }

    let isActive = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    let refreshInFlight = false;
    let pendingRefresh = false;

    const scheduleRefresh = () => {
      pendingRefresh = true;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(async () => {
        if (!isActive || !pendingRefresh || refreshInFlight) {
          return;
        }

        pendingRefresh = false;
        refreshInFlight = true;

        try {
          const records = await loadLiveContractorRecords();
          if (isActive) {
            setContractors(records);
            setHasLiveContractors(true);
          }
        } catch (error) {
          if (isActive) {
            logger.error("Failed to refresh contractors from realtime.", error);
          }
        } finally {
          refreshInFlight = false;
        }
      }, 700);
    };

    const channel = supabase
      .channel("admin-contractors-contractors")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contractors" },
        () => {
          if (!isActive) return;
          scheduleRefresh();
        },
      )
      .subscribe((status) => {
        if (!isActive) return;
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          logger.error("Contractors realtime subscription failed.", status);
        }
      });

    return () => {
      isActive = false;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      void supabase.removeChannel(channel);
    };
  }, [hasLiveContractors]);

  const queueCounts = useMemo(() => getQueueCounts(contractors), [contractors]);

  const filteredContractors = useMemo(() => {
    const base = filterContractors(contractors, filters);
    return base.filter((contractor) =>
      matchesQueueFilter(contractor, queueFilter),
    );
  }, [contractors, filters, queueFilter]);

  const paginatedContractors = useMemo(
    () => paginateItems(filteredContractors, currentPage, pageSize),
    [filteredContractors, currentPage, pageSize],
  );
  const totalPages = paginatedContractors.totalPages;
  const currentRows = paginatedContractors.items;

  const summaryCards = useMemo(
    () => getSummaryCards(contractors),
    [contractors],
  );

  const handleAction = (
    action: ContractorMenuAction,
    contractor: ContractorRecord,
  ) => {
    if (action === "View profile") {
      navigate(`/contractors/${contractor.id}`);
      return;
    }

    setSelectedLifecycleContractor(contractor);
    setLifecycleAction(action === "Suspend account" ? "suspend" : "restore");
    setLifecycleReason("");
    setLifecycleError(null);
  };

  const closeLifecycleDialog = () => {
    setSelectedLifecycleContractor(null);
    setLifecycleAction(null);
    setLifecycleReason("");
    setLifecycleError(null);
  };

  const openAddContractor = () => {
    setFormMode("add");
    setFormContractor(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (values: ContractorFormValues) => {
    setIsSaving(true);

    try {
      const duplicateEmail = contractors.some(
        (item) =>
          item.email.toLowerCase() === values.email.toLowerCase() &&
          item.id !== formContractor?.id,
      );

      if (duplicateEmail) {
        toast.error("Unable to save contractor", {
          description: "Email address already exists for another contractor.",
        });
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 450));

      setContractors((prev) => {
        const nextRecord = mapFormValuesToRecord(values, formContractor);
        if (formMode === "add") {
          return [nextRecord, ...prev];
        }

        return prev.map((item) =>
          item.id === nextRecord.id ? nextRecord : item,
        );
      });

      toast.success(
        formMode === "add" ? "Contractor added" : "Contractor updated",
        {
          description: `${values.name} profile has been saved.`,
        },
      );

      setIsFormOpen(false);
      setFormContractor(null);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmLifecycleAction = async () => {
    if (
      !selectedLifecycleContractor ||
      !lifecycleAction ||
      !lifecycleReason.trim()
    ) {
      return;
    }

    const nextLifecycleState: ContractorLifecycleState =
      lifecycleAction === "suspend" ? "Suspended" : "Active";
    const nextAccountStatus: ContractorAccountStatus =
      lifecycleAction === "suspend" ? "Deactivated" : "Active";
    const trimmedReason = lifecycleReason.trim();
    const isLiveLifecycleFlow = hasLiveContractors && isSupabaseConfigured();

    setLifecycleError(null);
    setIsLifecycleSaving(true);

    try {
      if (isLiveLifecycleFlow) {
        const actorUserId = adminUserId.trim();
        if (!actorUserId) {
          throw new Error(
            "Your admin session is missing a user id. Please sign in again.",
          );
        }

        const updateResult = await supabaseContractors.updateLifecycle({
          contractorId: selectedLifecycleContractor.id,
          action: lifecycleAction,
          actorUserId,
          reason: trimmedReason,
        });

        if (updateResult.ok === false) {
          throw new Error(updateResult.message);
        }

        const refreshedRecords = await loadLiveContractorRecords();
        setContractors(refreshedRecords);
        setHasLiveContractors(true);
      } else {
        setContractors((prev) =>
          prev.map((item) => {
            if (item.id !== selectedLifecycleContractor.id) {
              return item;
            }

            const nextRiskFlags =
              lifecycleAction === "suspend"
                ? Array.from(new Set([...item.riskFlags, "Suspended"]))
                : item.riskFlags.filter((flag) => flag !== "Suspended");

            return {
              ...item,
              accountStatus: nextAccountStatus,
              lifecycleState: nextLifecycleState,
              riskFlags: nextRiskFlags,
              riskLevel:
                lifecycleAction === "suspend" ? "High" : item.riskLevel,
              suspensionReason:
                lifecycleAction === "suspend" ? trimmedReason : undefined,
              restoreReason:
                lifecycleAction === "restore" ? trimmedReason : undefined,
            };
          }),
        );
      }

      toast.success(
        lifecycleAction === "suspend"
          ? "Contractor suspended"
          : "Contractor restored",
        {
          description:
            lifecycleAction === "suspend"
              ? "The suspension reason has been captured for audit."
              : "The contractor has been restored to the active queue.",
        },
      );

      // Emit event for notification + audit trail
      void emitEvent({
        type:
          lifecycleAction === "suspend"
            ? BusinessEventType.CONTRACTOR_SUSPENDED
            : BusinessEventType.CONTRACTOR_RESTORED,
        actorId: adminUserId.trim(),
        subjectId: selectedLifecycleContractor.id,
        source: "admin-dashboard",
        priority: "high",
        audit: true,
        realtime: true,
        metadata: {
          lifecycleAction,
          reason: trimmedReason,
          contractorName: selectedLifecycleContractor.name,
        },
      });

      closeLifecycleDialog();
    } catch (error) {
      setLifecycleError(
        error instanceof Error
          ? error.message
          : "Unable to update contractor lifecycle right now.",
      );
    } finally {
      setIsLifecycleSaving(false);
    }
  };

  return (
    <DashboardLayout title="Contractor’s">
      <div className="space-y-8">
        {errorMessage ? (
          <div className="rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
            {errorMessage}
          </div>
        ) : null}
        {liveError ? (
          <div className="rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
            {liveError}
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-4">
          {isLoading || liveLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[134px] rounded-[16px] border border-[#E6E7EB] bg-white"
                />
              ))
            : summaryCards.map((card) => (
                <ContractorSummaryCard
                  key={card.title}
                  card={card}
                  backgroundImage={contractorsSummaryPattern}
                />
              ))}
        </section>

        <section className="rounded-[18px] border border-[#EAECF0] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-[#667085]">
              Operational queues
            </h2>
            <p className="text-xs text-[#98A2B3]">
              Keep trust, payout, and verification blockers visible.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <QueueCard
              active={queueFilter === "pending-review"}
              title="Pending verification"
              description="Contractors waiting on final KYC review or approval."
              value={queueCounts.pendingReview.toLocaleString("en-US")}
              tone="warning"
              onClick={() =>
                setQueueFilter((current) =>
                  current === "pending-review" ? "all" : "pending-review",
                )
              }
            />
            <QueueCard
              active={queueFilter === "watchlist"}
              title="Trust watchlist"
              description="Low-rated or complaint-heavy contractors needing follow-up."
              value={queueCounts.watchlist.toLocaleString("en-US")}
              tone="danger"
              onClick={() =>
                setQueueFilter((current) =>
                  current === "watchlist" ? "all" : "watchlist",
                )
              }
            />
            <QueueCard
              active={queueFilter === "payout-blocked"}
              title="Payout blocked"
              description="Contractors blocked from payout until readiness issues are resolved."
              value={queueCounts.payoutBlocked.toLocaleString("en-US")}
              tone="danger"
              onClick={() =>
                setQueueFilter((current) =>
                  current === "payout-blocked" ? "all" : "payout-blocked",
                )
              }
            />
            <QueueCard
              active={queueFilter === "suspended"}
              title="Suspended"
              description="Accounts removed from the live contractor pool pending review."
              value={queueCounts.suspended.toLocaleString("en-US")}
              tone="neutral"
              onClick={() =>
                setQueueFilter((current) =>
                  current === "suspended" ? "all" : "suspended",
                )
              }
            />
          </div>
        </section>

        <section className="rounded-[18px] border border-[#EAECF0] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 border-b border-[#EAECF0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="text-sm font-semibold text-[#101828]">
                All Contractors
              </p>
              <p className="mt-1 text-xs text-[#667085]">
                {filteredContractors.length.toLocaleString("en-US")} contractors
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Contractors ..."
                  className="w-full rounded-[10px] border border-[#D0D5DD] bg-white py-2.5 pl-10 pr-3 text-sm text-[#101828] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openAddContractor}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#041133] px-4 text-sm font-semibold text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20"
                >
                  <Plus className="h-4 w-4" />
                  Add contractor
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-[#667085] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
                  aria-label={
                    expanded
                      ? "Show fewer contractors per page"
                      : "Show more contractors per page"
                  }
                >
                  {expanded ? "See less" : "See all"}
                </button>
                <FilterButton
                  title="Filter contractors"
                  schema={contractorFiltersSchema}
                  defaults={contractorFilterDefaults}
                />
              </div>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1360px] text-left text-sm">
              <caption className="sr-only">
                Contractor operations surface with performance, trust, payout,
                and lifecycle data.
              </caption>
              <thead className="bg-[#F9FAFB] text-xs font-semibold text-[#475467]">
                <tr className="border-b border-[#EAECF0]">
                  <th className="w-[250px] px-5 py-4">Contractor</th>
                  <th className="w-[170px] px-5 py-4">Availability</th>
                  <th className="w-[220px] px-5 py-4">Performance</th>
                  <th className="w-[240px] px-5 py-4">Verification & payout</th>
                  <th className="w-[240px] px-5 py-4">Trust & risk</th>
                  <th className="w-[170px] px-5 py-4">Lifecycle</th>
                  <th className="px-5 py-4" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0]">
                {currentRows.map((contractor) => (
                  <tr key={contractor.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6E7EB] text-sm font-semibold text-[#0F172A]">
                          {getContractorInitials(contractor.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#101828]">
                            {contractor.name}
                          </p>
                          <p className="truncate text-xs text-[#667085]">
                            {contractor.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="min-w-[150px] space-y-1 leading-5">
                        <p
                          className={[
                            "whitespace-nowrap text-sm font-semibold",
                            getContractorCurrentStatusClasses(
                              contractor.currentStatus,
                            ),
                          ].join(" ")}
                        >
                          {contractor.currentStatus}
                        </p>
                        <p className="text-xs text-[#667085]">
                          {contractor.serviceZoneLabel}
                        </p>
                        <p className="text-xs text-[#98A2B3]">
                          Last active {contractor.lastActiveLabel}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="min-w-[210px] space-y-1 text-sm leading-5 text-[#667085]">
                        <p className="font-semibold text-[#101828]">
                          {contractor.rating.toFixed(1)} rating
                          <span className="ml-1 text-xs font-medium text-[#98A2B3]">
                            ({contractor.totalRatings} reviews)
                          </span>
                        </p>
                        <p>
                          Acceptance {formatPercent(contractor.acceptanceRate)}{" "}
                          · Completion{" "}
                          {formatPercent(contractor.completionRate)}
                        </p>
                        <p className="text-xs text-[#98A2B3]">
                          {contractor.totalJobsAccepted}/
                          {contractor.totalJobsOffered} jobs accepted ·{" "}
                          {contractor.responseTimeLabel}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex min-w-[220px] flex-wrap gap-2">
                        <span
                          className={[
                            "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                            getContractorVerificationClasses(
                              contractor.verificationState,
                            ),
                          ].join(" ")}
                        >
                          {contractor.verificationState}
                        </span>
                        <span
                          className={[
                            "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                            getContractorPayoutClasses(contractor.payoutStatus),
                          ].join(" ")}
                        >
                          Payout {contractor.payoutStatus}
                        </span>
                        <p className="w-full text-xs text-[#667085]">
                          Pending payout {contractor.pendingPayoutAmount}
                        </p>
                        {contractor.payoutsBlockedReason ? (
                          <p className="w-full text-xs text-[#B42318]">
                            {contractor.payoutsBlockedReason}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex min-w-[220px] flex-wrap gap-2">
                        <span
                          className={[
                            "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                            getContractorRiskClasses(contractor.riskLevel),
                          ].join(" ")}
                        >
                          {contractor.riskLevel} risk
                        </span>
                        {contractor.riskFlags.slice(0, 2).map((flag) => (
                          <span
                            key={flag}
                            className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#F2F4F7] px-3 py-1 text-xs font-semibold text-[#344054]"
                          >
                            {flag}
                          </span>
                        ))}
                        {contractor.suspensionReason ||
                        contractor.watchlistReason ? (
                          <p className="w-full text-xs text-[#667085]">
                            {contractor.suspensionReason ??
                              contractor.watchlistReason}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="min-w-[150px] space-y-2">
                        <span
                          className={[
                            "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                            getContractorLifecycleClasses(
                              contractor.lifecycleState,
                            ),
                          ].join(" ")}
                        >
                          {contractor.lifecycleState}
                        </span>
                        <p
                          className="text-xs text-[#98A2B3]"
                          title={contractor.location}
                        >
                          Joined {contractor.dateJoined}
                        </p>
                        <span
                          className={[
                            "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                            getContractorAccountStatusClasses(
                              contractor.accountStatus,
                            ),
                          ].join(" ")}
                        >
                          {contractor.accountStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ContractorsActionsMenu
                        contractor={contractor}
                        onAction={handleAction}
                      />
                    </td>
                  </tr>
                ))}
                {!filteredContractors.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center text-sm text-[#667085]"
                    >
                      No contractors match your search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 px-4 py-5 md:hidden">
            {currentRows.map((contractor) => (
              <ContractorCard
                key={contractor.id}
                contractor={contractor}
                onAction={handleAction}
              />
            ))}
            {!filteredContractors.length ? (
              <p className="py-10 text-center text-sm text-[#667085]">
                No contractors match your search.
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-[#EAECF0] px-4 py-4">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white text-[#475467] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
              aria-label="Previous page"
            >
              <span className="text-lg">‹</span>
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={[
                    "inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-sm font-semibold",
                    page === currentPage
                      ? "border border-[#101828] bg-white text-[#101828]"
                      : "border border-transparent text-[#98A2B3] hover:text-[#101828]",
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
              disabled={currentPage === totalPages}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white text-[#475467] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
              aria-label="Next page"
            >
              <span className="text-lg">›</span>
            </button>
          </div>
        </section>
      </div>

      <ContractorFormModal
        open={isFormOpen}
        mode={formMode}
        contractor={formContractor}
        isSaving={isSaving}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setFormContractor(null);
          }
        }}
        onSubmit={handleSubmit}
      />

      <Dialog
        open={Boolean(selectedLifecycleContractor && lifecycleAction)}
        onOpenChange={(open) => {
          if (!open) {
            closeLifecycleDialog();
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-32px)] max-w-[520px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
          <div className="px-6 py-6">
            <DialogTitle className="text-xl font-bold text-[#101828]">
              {lifecycleAction === "suspend"
                ? "Suspend contractor"
                : "Restore contractor"}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-[#667085]">
              {lifecycleAction === "suspend"
                ? "Capture a reason before removing this contractor from the active operations pool."
                : "Capture a restore note before reactivating this contractor."}
            </DialogDescription>

            {selectedLifecycleContractor ? (
              <div className="mt-4 rounded-[12px] border border-[#EAECF0] bg-[#FCFCFD] px-4 py-3">
                <p className="text-sm font-semibold text-[#101828]">
                  {selectedLifecycleContractor.name}
                </p>
                <p className="mt-1 text-sm text-[#667085]">
                  {selectedLifecycleContractor.verificationState} · Payout{" "}
                  {selectedLifecycleContractor.payoutStatus} ·{" "}
                  {selectedLifecycleContractor.rating.toFixed(1)} rating
                </p>
              </div>
            ) : null}

            <div className="mt-5 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
              <p className="text-sm text-[#92400E]">
                {lifecycleAction === "suspend"
                  ? "Suspension should be used for trust, quality, or compliance issues. The reason should stay audit-ready."
                  : "Restoration should only be used after trust, payout, or verification blockers are resolved."}
              </p>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-semibold text-[#344054]">
                {lifecycleAction === "suspend"
                  ? "Suspension reason"
                  : "Restore reason"}
              </label>
              <Textarea
                value={lifecycleReason}
                onChange={(event) => setLifecycleReason(event.target.value)}
                className="mt-2 min-h-[132px]"
                placeholder={
                  lifecycleAction === "suspend"
                    ? "Describe why this contractor is being suspended"
                    : "Describe why this contractor can be restored"
                }
                aria-label={
                  lifecycleAction === "suspend"
                    ? "Suspension reason"
                    : "Restore reason"
                }
              />
              {!lifecycleReason.trim() ? (
                <p className="mt-2 text-xs font-medium text-[#B42318]">
                  A reason is required.
                </p>
              ) : null}
              {lifecycleError ? (
                <p className="mt-2 text-xs font-medium text-[#B42318]">
                  {lifecycleError}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeLifecycleDialog}
                disabled={isLifecycleSaving}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLifecycleAction}
                disabled={!lifecycleReason.trim() || isLifecycleSaving}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
                  lifecycleAction === "suspend"
                    ? "bg-[#F04438] hover:bg-[#D92D20]"
                    : "bg-[#071B58] hover:bg-[#0C2877]",
                ].join(" ")}
              >
                {lifecycleAction === "suspend" ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {isLifecycleSaving
                  ? "Saving..."
                  : lifecycleAction === "suspend"
                    ? "Confirm suspension"
                    : "Confirm restore"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
