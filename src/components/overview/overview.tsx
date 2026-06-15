import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IconComponent } from "@/ui/icons";
import { DashboardLayout } from "@/components/dashboard/shared/dashboard-layout";
import type { FilterField } from "@/components/dashboard/shared/filters/filter-schema";
import {
  isWithinInclusiveRange,
  parseDateForFilter,
  toIsoDateString,
} from "@/components/dashboard/shared/filters/filter-schema";
import { FilterButton } from "@/components/dashboard/shared/filters/filter-button";
import { useUrlFilters } from "@/components/dashboard/shared/filters/use-url-filters";
import { cn } from "@/lib/utils";
import {
  TotalContractorsIcon,
  TotalRequestsIcon,
  TotalRevenueIcon,
  TotalUsersIcon,
} from "@/ui/icons";
import { toast } from "sonner";
import summaryCardPattern from "@/assets/overview/summary-card-pattern.png";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ROUTES } from "@/components/dashboard/shared/dashboard-navigation";
import { userDetailsRecords } from "@/components/dashboard/user-details/user-details.data";
import type { UserRequestHistoryItem } from "@/components/dashboard/user-details/user-details.types";
import { useRequestsStore } from "@/components/dashboard/requests/requests.store";
import {
  contractorRecords,
  loadLiveContractorRecords,
} from "@/components/dashboard/contractors/contractors.data";
import type { ContractorRecord } from "@/components/dashboard/contractors/contractors.types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import {
  type PaymentRow,
  supabaseFinance,
  supabaseJobs,
  supabaseProfiles,
} from "@/lib/supabase/data";
import { mapJobRowToUserRequestHistoryItem } from "@/lib/supabase/mappers";
import { createLogger } from "@/lib/logger";

const totalRevenuePattern = summaryCardPattern;
const requestsCardPattern = summaryCardPattern;
const logger = createLogger("Overview");

type OverviewStatistic = {
  title: string;
  value: string;
  trend: string;
  Icon: IconComponent;
  highlighted?: boolean;
  patternSrc: string;
  patternClassName: string;
};

type RevenueGranularity = "daily" | "monthly" | "yearly";

type RevenueRecord = {
  id: string;
  date: string;
  amount: number;
};

function buildRevenueRecords(): RevenueRecord[] {
  const start = new Date(2025, 0, 1);
  const records: RevenueRecord[] = [];

  for (let index = 0; index < 240; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toIsoDateString(date);
    const base = 4200 + (index % 28) * 180;
    const seasonal = Math.round(Math.sin(index / 9) * 650);
    const amount = Math.max(600, base + seasonal);

    records.push({
      id: `revenue-${iso}`,
      date: iso,
      amount,
    });
  }

  return records;
}

const revenueRecords = buildRevenueRecords();

type RevenueBar = {
  key: string;
  label: string;
  ariaLabel: string;
  valuePercent: number;
  amount: number;
};

function buildGranularityKey(granularity: RevenueGranularity, date: Date) {
  const year = date.getFullYear();

  if (granularity === "yearly") {
    return `${year}`;
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");

  if (granularity === "monthly") {
    return `${year}-${month}`;
  }

  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatGranularityLabel(granularity: RevenueGranularity, key: string) {
  if (granularity === "yearly") {
    return key;
  }

  if (granularity === "monthly") {
    const [year, month] = key.split("-");
    const monthIndex = Number(month) - 1;
    const date = new Date(Number(year), Math.max(0, monthIndex), 1);
    return date.toLocaleDateString(undefined, { month: "short" });
  }

  const parsed = parseDateForFilter(key);
  return parsed
    ? parsed.toLocaleDateString(undefined, { day: "2-digit", month: "short" })
    : key;
}

function formatGranularityAria(granularity: RevenueGranularity, key: string) {
  if (granularity === "yearly") {
    return key;
  }

  if (granularity === "monthly") {
    const [year, month] = key.split("-");
    const monthIndex = Number(month) - 1;
    const date = new Date(Number(year), Math.max(0, monthIndex), 1);
    return date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }

  const parsed = parseDateForFilter(key);
  return parsed
    ? parsed.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : key;
}

type TopService = {
  label: string;
  color: string;
};

const topServices: TopService[] = [
  { label: "Plumber", color: "#22C55E" },
  { label: "Electrician", color: "#22B8CF" },
  { label: "Cleaning", color: "#8B5CF6" },
  { label: "Carpentry", color: "#EC4899" },
];
const liveServicePalette = ["#22C55E", "#22B8CF", "#8B5CF6", "#EC4899"];

type TopServiceRecord = {
  id: string;
  date: string;
  label: TopService["label"];
  amount: number;
};

function buildTopServiceRecords(): TopServiceRecord[] {
  const start = new Date(2025, 0, 1);
  const records: TopServiceRecord[] = [];
  const labels = topServices.map((service) => service.label);

  for (let index = 0; index < 180; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const iso = toIsoDateString(day);
    const label = labels[index % labels.length];
    const amount =
      120000 + (index % 19) * 27000 + Math.round(Math.cos(index / 7) * 9000);

    records.push({
      id: `service-${iso}-${label.toLowerCase()}`,
      date: iso,
      label,
      amount: Math.max(10000, amount),
    });
  }

  return records;
}

const topServiceRecords = buildTopServiceRecords();

const pieChartSize = 168;
const pieChartRadius = pieChartSize / 2;
const pieChartCenter = pieChartSize / 2;
const pieTooltipOffset = 24;
const pieTooltipBounds = {
  minX: 28,
  maxX: pieChartSize - 28,
  minY: 24,
  maxY: pieChartSize - 24,
};

const dateRangeSchema: FilterField[] = [
  {
    type: "dateRange",
    key: "dateRange",
    label: "Date range",
    fromKey: "from",
    toKey: "to",
  },
];

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString("en-US")}`;
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function buildPieSlicePath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type OpsRequestRow = {
  requestId: string;
  requestCode: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  service: string;
  location: string;
  date: string;
  status: UserRequestHistoryItem["status"];
  lifecycleStatus: UserRequestHistoryItem["lifecycleStatus"];
  etaLabel: string;
  urgencyLabel: string;
};

function buildOpsRequestRow(params: {
  request: UserRequestHistoryItem;
  userId: string;
  customerName: string;
  customerEmail: string;
}): OpsRequestRow {
  const { request, userId, customerName, customerEmail } = params;
  return {
    requestId: request.id,
    requestCode: request.requestCode,
    userId,
    customerName,
    customerEmail,
    service: request.service,
    location: request.location,
    date: request.date,
    status: request.status,
    lifecycleStatus: request.lifecycleStatus,
    etaLabel: request.etaLabel,
    urgencyLabel: request.urgencyLabel,
  };
}

function applyOverviewRequestOverrides(params: {
  row: OpsRequestRow;
  requestStatusById: ReturnType<
    typeof useRequestsStore.getState
  >["requestStatusById"];
  requestOpsById: ReturnType<
    typeof useRequestsStore.getState
  >["requestOpsById"];
}): OpsRequestRow {
  const statusOverride = params.requestStatusById[params.row.requestId];
  const opsOverride = params.requestOpsById[params.row.requestId];
  const request = {
    ...params.row,
    status: statusOverride?.status ?? params.row.status,
    lifecycleStatus:
      statusOverride?.lifecycleStatus ?? params.row.lifecycleStatus,
    etaLabel: statusOverride?.etaLabel ?? params.row.etaLabel,
  };

  if (opsOverride?.delayedReason) {
    request.etaLabel = "Delayed";
  }

  if (opsOverride?.disputeReason) {
    request.status = "Pending";
  }

  if (opsOverride?.monitoringState === "paused") {
    request.lifecycleStatus = "Assigned";
  }

  return {
    ...params.row,
    requestCode: request.requestCode,
    service: request.service,
    location: request.location,
    date: request.date,
    status: request.status,
    lifecycleStatus: request.lifecycleStatus,
    etaLabel: request.etaLabel,
    urgencyLabel: request.urgencyLabel,
  };
}

function paymentToRevenueRecord(payment: PaymentRow): RevenueRecord {
  const amount =
    Number(payment.contractor_payout) || Number(payment.amount) || 0;

  return {
    id: payment.id,
    date: payment.created_at.slice(0, 10),
    amount,
  };
}

function getRequestStatusClasses(status: OpsRequestRow["status"]) {
  if (status === "Active") {
    return "bg-[#DCFCE7] text-[#15803D]";
  }

  if (status === "Pending") {
    return "bg-[#FFF4DB] text-[#B7791F]";
  }

  if (status === "Completed") {
    return "bg-[#EEF2F6] text-[#475467]";
  }

  return "bg-[#FEE4E2] text-[#B42318]";
}

function StatusPill({ status }: { status: OpsRequestRow["status"] }) {
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
        getRequestStatusClasses(status),
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function parseMinutes(label: string) {
  const match = label.match(/(\d+)\s*min/i);
  if (!match) {
    return null;
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function getAverageMinutes(labels: string[]) {
  const values = labels
    .map((label) => parseMinutes(label))
    .filter((value): value is number => typeof value === "number");

  if (!values.length) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

type OpsQueueCardTone = "warning" | "danger" | "neutral";

function OpsQueueCard({
  title,
  description,
  value,
  tone,
  onClick,
}: {
  title: string;
  description: string;
  value: string;
  tone: OpsQueueCardTone;
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
        "flex w-full items-start justify-between gap-4 rounded-[16px] border p-4 text-left shadow-sm transition hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15",
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

export default function Overview() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isGranularityPending, startGranularityTransition] = useTransition();
  const granularity =
    (searchParams.get("granularity") as RevenueGranularity | null) ?? "monthly";
  const { filters: dateFilters } = useUrlFilters({ schema: dateRangeSchema });
  const fromDate = useMemo(() => {
    const value = dateFilters.from;
    if (typeof value !== "string" || !value) return null;
    return parseDateForFilter(value);
  }, [dateFilters.from]);
  const toDate = useMemo(() => {
    const value = dateFilters.to;
    if (typeof value !== "string" || !value) return null;
    return parseDateForFilter(value);
  }, [dateFilters.to]);

  const [hoveredServiceLabel, setHoveredServiceLabel] = useState<string | null>(
    null,
  );
  const [requestsExpanded, setRequestsExpanded] = useState(false);
  const [requestPage, setRequestPage] = useState(1);
  const requestPageSize = requestsExpanded ? 10 : 5;

  const requestStatusById = useRequestsStore(
    (state) => state.requestStatusById,
  );
  const requestOpsById = useRequestsStore((state) => state.requestOpsById);
  const [liveRequestRows, setLiveRequestRows] = useState<
    OpsRequestRow[] | null
  >(null);
  const [liveRevenueRows, setLiveRevenueRows] = useState<
    RevenueRecord[] | null
  >(null);
  const [liveTopServiceRows, setLiveTopServiceRows] = useState<
    TopServiceRecord[] | null
  >(null);
  const [liveContractors, setLiveContractors] = useState<
    ContractorRecord[] | null
  >(null);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const loadLiveOverview = useCallback(
    async (options?: { silent?: boolean; source?: "initial" | "realtime" }) => {
      if (
        import.meta.env.MODE === "test" ||
        import.meta.env.VITEST ||
        !isSupabaseConfigured() ||
        !supabase
      ) {
        return;
      }

      if (!options?.silent) {
        setIsLiveLoading(true);
      }
      setLiveError(null);

      try {
        const [jobsResult, paymentsResult, liveContractorRecords] =
          await Promise.all([
            supabaseJobs.listLatest({ limit: 500 }),
            supabaseFinance.listPayments({ limit: 500 }),
            loadLiveContractorRecords(),
          ]);

        if (jobsResult.ok === false) {
          throw new Error(jobsResult.message);
        }
        if (paymentsResult.ok === false) {
          throw new Error(paymentsResult.message);
        }

        const profileIds = Array.from(
          new Set(jobsResult.data.map((job) => job.user_id).filter(Boolean)),
        );
        const profilesResult = await supabaseProfiles.listByIds(profileIds);
        if (profilesResult.ok === false) {
          throw new Error(profilesResult.message);
        }

        const profilesById = new Map(
          profilesResult.data.map((profile) => [profile.id, profile]),
        );

        const nextRequestRows = jobsResult.data.map((job) => {
          const userProfile = profilesById.get(job.user_id) ?? null;
          const request = mapJobRowToUserRequestHistoryItem({
            job,
            userProfile,
          });
          const customerName =
            userProfile?.full_name?.trim() ||
            `${userProfile?.first_name ?? ""} ${userProfile?.last_name ?? ""}`.trim() ||
            "Customer";

          return buildOpsRequestRow({
            request,
            userId: job.user_id,
            customerName,
            customerEmail: userProfile?.email?.trim() || "—",
          });
        });

        const nextRevenueRows = paymentsResult.data.map(paymentToRevenueRecord);
        const nextTopServiceRows = jobsResult.data.map((job) => ({
          id: `top-service-${job.id}`,
          date: job.created_at.slice(0, 10),
          label: job.service_type?.trim() || "Other",
          amount: Number(job.final_price) || Number(job.price_estimate) || 0,
        }));

        if (!isActiveRef.current) {
          return;
        }

        setLiveRequestRows(nextRequestRows);
        setLiveRevenueRows(nextRevenueRows);
        setLiveTopServiceRows(nextTopServiceRows);
        setLiveContractors(liveContractorRecords);
      } catch (error) {
        if (!isActiveRef.current) {
          return;
        }

        logger.error("Failed to load live overview data.", error);
        setLiveError(
          error instanceof Error
            ? error.message
            : "Unable to load live overview data right now.",
        );
      } finally {
        if (isActiveRef.current && !options?.silent) {
          setIsLiveLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadLiveOverview({ source: "initial" });
  }, [loadLiveOverview]);

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
    const refreshTimeoutRef: { current: ReturnType<typeof setTimeout> | null } =
      {
        current: null,
      };
    let refreshInFlight = false;
    let pendingRefresh = false;

    const scheduleRefresh = () => {
      pendingRefresh = true;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(async () => {
        if (!isActive || !pendingRefresh || refreshInFlight) {
          return;
        }

        pendingRefresh = false;
        refreshInFlight = true;

        try {
          logger.info("Received realtime update. Refreshing overview.");
          await loadLiveOverview({ silent: true, source: "realtime" });
        } finally {
          refreshInFlight = false;
        }
      }, 800);
    };

    const channel = supabase
      .channel("admin-overview-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => {
          if (!isActive) return;
          scheduleRefresh();
        },
      )
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
          logger.error("Overview realtime subscription failed.", status);
        }
      });

    return () => {
      isActive = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [loadLiveOverview]);

  const mockOpsRequestRows = useMemo<OpsRequestRow[]>(() => {
    return userDetailsRecords.flatMap((user) =>
      user.requestHistory.map((request) =>
        buildOpsRequestRow({
          request,
          userId: user.id,
          customerName: user.name,
          customerEmail: user.email,
        }),
      ),
    );
  }, []);

  const opsRequestRows = useMemo<OpsRequestRow[]>(() => {
    const baseRows = liveRequestRows ?? mockOpsRequestRows;
    return baseRows.map((row) =>
      applyOverviewRequestOverrides({
        row,
        requestStatusById,
        requestOpsById,
      }),
    );
  }, [liveRequestRows, mockOpsRequestRows, requestOpsById, requestStatusById]);

  const revenueSource = liveRevenueRows ?? revenueRecords;
  const contractorSource = liveContractors ?? contractorRecords;
  const topServiceSource = liveTopServiceRows ?? topServiceRecords;

  const filteredRevenueRecords = useMemo(() => {
    if (!fromDate && !toDate) return revenueSource;
    return revenueSource.filter((record) => {
      const parsed = parseDateForFilter(record.date);
      return parsed ? isWithinInclusiveRange(parsed, fromDate, toDate) : false;
    });
  }, [fromDate, revenueSource, toDate]);

  const revenueBars = useMemo<RevenueBar[]>(() => {
    const grouped = new Map<string, number>();
    for (const record of filteredRevenueRecords) {
      const parsed = parseDateForFilter(record.date);
      if (!parsed) continue;
      const key = buildGranularityKey(granularity, parsed);
      grouped.set(key, (grouped.get(key) ?? 0) + record.amount);
    }

    const entries = Array.from(grouped.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const amounts = entries.map(([, amount]) => amount);
    const maxAmount = Math.max(1, ...amounts);

    return entries.map(([key, amount]) => ({
      key,
      label: formatGranularityLabel(granularity, key),
      ariaLabel: formatGranularityAria(granularity, key),
      valuePercent: Math.round((amount / maxAmount) * 100),
      amount,
    }));
  }, [filteredRevenueRecords, granularity]);

  const filteredTopServiceRecords = useMemo(() => {
    if (!fromDate && !toDate) return topServiceSource;
    return topServiceSource.filter((record) => {
      const parsed = parseDateForFilter(record.date);
      return parsed ? isWithinInclusiveRange(parsed, fromDate, toDate) : false;
    });
  }, [fromDate, toDate, topServiceSource]);

  const serviceLegend = useMemo(() => {
    const totals = new Map<string, number>();
    for (const record of filteredTopServiceRecords) {
      totals.set(record.label, (totals.get(record.label) ?? 0) + record.amount);
    }

    if (liveTopServiceRows) {
      return Array.from(totals.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 4)
        .map(([label, amount], index) => ({
          label,
          amount,
          color: liveServicePalette[index % liveServicePalette.length],
        }));
    }

    return topServices.map((service) => ({
      label: service.label,
      amount: totals.get(service.label) ?? 0,
      color: service.color,
    }));
  }, [filteredTopServiceRecords, liveTopServiceRows]);

  const pieSegmentsSource = useMemo(() => {
    return serviceLegend.map((service) => ({
      label: service.label,
      amount: service.amount,
      color: service.color,
    }));
  }, [serviceLegend]);

  const totalTopServicesAmount = pieSegmentsSource.reduce(
    (total, service) => total + service.amount,
    0,
  );

  let currentAngle = 0;
  const pieSegments = pieSegmentsSource.map((service) => {
    const angle =
      totalTopServicesAmount > 0
        ? (service.amount / totalTopServicesAmount) * 360
        : 0;
    const startAngle = currentAngle;
    const endAngle = startAngle + angle;
    const middleAngle = startAngle + angle / 2;
    const tooltipAnchor = polarToCartesian(
      pieChartCenter,
      pieChartCenter,
      pieChartRadius + pieTooltipOffset,
      middleAngle,
    );

    currentAngle = endAngle;

    return {
      ...service,
      value: formatCurrency(service.amount),
      path: buildPieSlicePath(
        pieChartCenter,
        pieChartCenter,
        pieChartRadius,
        startAngle,
        endAngle,
      ),
      tooltipX: clamp(
        tooltipAnchor.x,
        pieTooltipBounds.minX,
        pieTooltipBounds.maxX,
      ),
      tooltipY: clamp(
        tooltipAnchor.y,
        pieTooltipBounds.minY,
        pieTooltipBounds.maxY,
      ),
    };
  });

  const hoveredService =
    pieSegments.find((segment) => segment.label === hoveredServiceLabel) ??
    null;

  const filteredRequestsByDate = useMemo(() => {
    if (!fromDate && !toDate) return opsRequestRows;
    return opsRequestRows.filter((request) => {
      const parsed = parseDateForFilter(request.date);
      return parsed ? isWithinInclusiveRange(parsed, fromDate, toDate) : false;
    });
  }, [fromDate, opsRequestRows, toDate]);

  const requestsTotalPages = Math.max(
    1,
    Math.ceil(filteredRequestsByDate.length / requestPageSize),
  );

  const currentRequestRows = filteredRequestsByDate.slice(
    (requestPage - 1) * requestPageSize,
    requestPage * requestPageSize,
  );

  const opsSnapshot = useMemo(() => {
    const delayedJobs = Object.values(requestOpsById).filter((entry) =>
      Boolean(entry?.delayedReason),
    ).length;
    const disputedJobs = Object.values(requestOpsById).filter((entry) =>
      Boolean(entry?.disputeReason),
    ).length;

    const payoutBlocked = contractorSource.filter(
      (contractor) => contractor.payoutStatus === "Blocked",
    ).length;

    const kycBlockers = contractorSource.filter(
      (contractor) => contractor.verificationState === "Pending review",
    ).length;

    const highRiskContractors = contractorSource.filter(
      (contractor) => contractor.riskLevel === "High" || contractor.rating < 4,
    ).length;

    const activeContractorsNow = contractorSource.filter(
      (contractor) => contractor.currentStatus === "Online",
    ).length;

    const avgResponseMinutes = getAverageMinutes(
      contractorSource.map((contractor) => contractor.responseTimeLabel),
    );

    const completionRates = contractorSource
      .map((contractor) => contractor.completionRate)
      .filter((value) => Number.isFinite(value));
    const avgCompletionRate = completionRates.length
      ? completionRates.reduce((sum, value) => sum + value, 0) /
        completionRates.length
      : 0;

    const jobsToday = opsRequestRows.filter(
      (request) => request.status === "Active" || request.status === "Pending",
    ).length;

    return {
      delayedJobs,
      disputedJobs,
      payoutBlocked,
      kycBlockers,
      highRiskContractors,
      jobsToday,
      activeContractorsNow,
      avgResponseMinutes,
      avgCompletionRate,
    };
  }, [contractorSource, opsRequestRows, requestOpsById]);

  const statistics = useMemo<OverviewStatistic[]>(
    () => [
      {
        title: "Jobs today",
        value: opsSnapshot.jobsToday.toLocaleString("en-US"),
        trend: liveRequestRows
          ? "Derived from live jobs"
          : "+ 2.3% vs Yesterday",
        Icon: TotalRequestsIcon,
        highlighted: true,
        patternSrc: totalRevenuePattern,
        patternClassName:
          "absolute -left-[27px] -top-[14px] hidden h-[156px] w-[318px] max-w-none rotate-180 opacity-80 lg:block",
      },
      {
        title: "Active contractors now",
        value: opsSnapshot.activeContractorsNow.toLocaleString("en-US"),
        trend: liveContractors
          ? "Derived from live contractors"
          : "+ 2.3% vs Yesterday",
        Icon: TotalContractorsIcon,
        patternSrc: summaryCardPattern,
        patternClassName:
          "absolute -left-[25px] -top-[14px] hidden h-[156px] w-[317px] max-w-none rotate-180 opacity-80 lg:block",
      },
      {
        title: "Avg response time",
        value:
          opsSnapshot.avgResponseMinutes !== null
            ? `${opsSnapshot.avgResponseMinutes} min avg`
            : "—",
        trend: liveContractors
          ? "Derived from live contractors"
          : "+ 2.3% vs Yesterday",
        Icon: TotalRevenueIcon,
        patternSrc: summaryCardPattern,
        patternClassName:
          "absolute -left-[25px] -top-[14px] hidden h-[156px] w-[317px] max-w-none rotate-180 opacity-80 lg:block",
      },
      {
        title: "Completion rate",
        value: formatPercent(opsSnapshot.avgCompletionRate),
        trend: liveContractors
          ? "Derived from live contractors"
          : "+ 2.3% vs Yesterday",
        Icon: TotalUsersIcon,
        patternSrc: requestsCardPattern,
        patternClassName:
          "absolute -left-[81px] -top-[14px] hidden h-[156px] w-[428px] max-w-none rotate-180 opacity-80 lg:block",
      },
    ],
    [liveContractors, liveRequestRows, opsSnapshot],
  );

  return (
    <DashboardLayout title="Dashboard">
      {isLiveLoading ? (
        <div className="mb-5 rounded-2xl border border-[#EAECF0] bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#667085] shadow-sm">
          Loading live overview data...
        </div>
      ) : null}
      {liveError ? (
        <div className="mb-5 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B42318] shadow-sm">
          {liveError}
        </div>
      ) : null}
      <section className="rounded-2xl border border-[#EAECF0] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#667085]">
              Operational queues
            </h2>
            <p className="mt-1 text-sm text-[#98A2B3]">
              Prioritize urgent blockers before diving into analytics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.requests)}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-[#667085] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
          >
            Open requests
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <OpsQueueCard
            title="Delayed jobs"
            description="SLA breach, missing check-ins, or overdue arrivals."
            value={opsSnapshot.delayedJobs.toLocaleString("en-US")}
            tone="warning"
            onClick={() => {
              toast.info("Delayed queue", {
                description:
                  "Open Requests to review delayed jobs and capture reasons.",
              });
              navigate(ROUTES.requests);
            }}
          />
          <OpsQueueCard
            title="Disputed jobs"
            description="Open disputes requiring evidence review and resolution."
            value={opsSnapshot.disputedJobs.toLocaleString("en-US")}
            tone="danger"
            onClick={() => {
              toast.info("Disputed queue", {
                description:
                  "Open Requests to review disputed jobs and escalation notes.",
              });
              navigate(ROUTES.requests);
            }}
          />
          <OpsQueueCard
            title="Failed payouts / blocked"
            description="Contractors blocked from payout until readiness issues are resolved."
            value={opsSnapshot.payoutBlocked.toLocaleString("en-US")}
            tone="danger"
            onClick={() => {
              toast.info("Payout blockers", {
                description:
                  "Open Transactions to review payout failures and blockers.",
              });
              navigate(ROUTES.transactions);
            }}
          />
          <OpsQueueCard
            title="KYC blockers"
            description="Contractors awaiting verification review before unrestricted dispatch."
            value={opsSnapshot.kycBlockers.toLocaleString("en-US")}
            tone="warning"
            onClick={() => {
              toast.info("KYC blockers", {
                description:
                  "Open Contractors to review pending verification states.",
              });
              navigate(ROUTES.contractors);
            }}
          />
          <OpsQueueCard
            title="High-risk contractors"
            description="Low-rated, complaint-heavy, or flagged contractors needing follow-up."
            value={opsSnapshot.highRiskContractors.toLocaleString("en-US")}
            tone="neutral"
            onClick={() => {
              toast.info("Trust watchlist", {
                description:
                  "Open Contractors to review risk watchlists and lifecycle actions.",
              });
              navigate(ROUTES.contractors);
            }}
          />
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[14px]">
        {statistics.map((item) => (
          <article
            key={item.title}
            className={[
              "relative overflow-hidden rounded-[10px] border p-[13px] shadow-sm",
              item.highlighted
                ? "border-[#07133A] bg-[linear-gradient(135deg,#020817_0%,#041B5C_100%)] text-white"
                : "border-[#F0F1F2] bg-[#FAFAFA] text-[#101828]",
            ].join(" ")}
          >
            <img
              src={item.patternSrc}
              alt=""
              aria-hidden="true"
              className={item.patternClassName}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={[
                    "truncate text-[14px] leading-[19px]",
                    item.highlighted ? "text-[#EEF3E6]" : "text-[#6B7280]",
                  ].join(" ")}
                >
                  {item.title}
                </p>
                <p
                  className={[
                    "mt-[10px] text-[24px] font-semibold leading-[33px] tracking-[-0.02em]",
                    item.highlighted ? "text-white" : "text-[#020715]",
                  ].join(" ")}
                >
                  {item.value}
                </p>
                <p
                  className={[
                    "mt-[8px] text-[12px] leading-[15px]",
                    item.highlighted ? "text-[#B1B5C0]" : "text-[#136C34]",
                  ].join(" ")}
                >
                  {item.trend}
                </p>
              </div>
              <div
                className={[
                  "relative flex h-[26px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] border p-[3px] [&_svg]:h-5 [&_svg]:w-5",
                  item.highlighted
                    ? "border-[#36415C] bg-[#02091C]"
                    : "border-[#F0F1F2] bg-white",
                ].join(" ")}
              >
                <item.Icon size={20} aria-hidden="true" className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>
      <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <article className="rounded-2xl border border-[#EAECF0] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#667085]">Revenue</h2>
              {liveRevenueRows ? (
                <p className="mt-1 text-xs text-[#98A2B3]">
                  Derived from live payments.
                </p>
              ) : null}
            </div>
            <ToggleGroup
              type="single"
              value={granularity}
              onValueChange={(nextValue) => {
                const next =
                  (nextValue as RevenueGranularity | "") || granularity;
                if (!next || next === granularity) return;
                startGranularityTransition(() => {
                  setSearchParams((prev) => {
                    const params = new URLSearchParams(prev);
                    if (next === "monthly") {
                      params.delete("granularity");
                    } else {
                      params.set("granularity", next);
                    }
                    return params;
                  });
                });
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-[#EAECF0] bg-white p-1"
              aria-label="Select revenue chart granularity"
            >
              {(["daily", "monthly", "yearly"] as const).map((item) => (
                <ToggleGroupItem
                  key={item}
                  value={item}
                  className={cn(
                    "h-7 rounded-md px-3 text-xs font-semibold capitalize",
                    item === granularity
                      ? "bg-[#041133] text-white"
                      : "text-[#667085] hover:bg-[#F8FAFC]",
                  )}
                  aria-label={`${item} view`}
                >
                  {item}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 sm:gap-4">
            <div className="flex h-[250px] flex-col justify-between pb-6 text-[11px] font-medium text-[#98A2B3]">
              <span>$10K</span>
              <span>$8K</span>
              <span>$6K</span>
              <span>$4K</span>
              <span>$2K</span>
              <span>$0</span>
            </div>
            <div className="relative">
              <div className="absolute inset-0 grid grid-rows-5 gap-0">
                {[0, 1, 2, 3, 4].map((line) => (
                  <div
                    key={line}
                    className="border-t border-dashed border-[#E4E7EC]"
                  />
                ))}
              </div>
              <div
                className={cn(
                  "relative flex h-[250px] items-end gap-1 pt-10 min-[420px]:gap-1.5 sm:gap-3",
                  isGranularityPending ? "opacity-60" : "",
                )}
                aria-busy={isGranularityPending}
              >
                {revenueBars.map((bar) => (
                  <div
                    key={bar.key}
                    className="relative flex min-w-0 flex-1 flex-col items-center justify-end gap-3"
                  >
                    <div className="flex h-[170px] items-end">
                      <div
                        className={[
                          "w-3 rounded-t-full sm:w-4",
                          "bg-[#071B58]",
                          isGranularityPending ? "animate-pulse" : "",
                        ].join(" ")}
                        style={{ height: `${bar.valuePercent}%` }}
                        aria-label={`${bar.ariaLabel} ${formatCurrency(bar.amount)}`}
                      />
                    </div>
                    <span
                      className="text-[10px] font-medium tracking-[-0.01em] text-[#98A2B3] sm:text-[11px]"
                      title={bar.ariaLabel}
                    >
                      <span className="sr-only">{bar.ariaLabel}</span>
                      <span aria-hidden="true">{bar.label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-[#EAECF0] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#667085]">
                Top services
              </h2>
              {liveTopServiceRows ? (
                <p className="mt-1 text-xs text-[#98A2B3]">
                  Derived from live jobs.
                </p>
              ) : null}
            </div>
            <FilterButton
              title="Filter top services by date"
              schema={dateRangeSchema}
              trigger={({ onClick, activeLabel }) => (
                <button
                  type="button"
                  onClick={onClick}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#EAECF0] px-2.5 py-1.5 text-xs font-semibold text-[#667085] transition hover:bg-[#F8FAFC]"
                  aria-label="Open date range filter for top services"
                >
                  {activeLabel ?? "All time"}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
            />
          </div>
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
            <div
              className="relative flex h-[220px] w-[220px] items-center justify-center"
              onMouseLeave={() => setHoveredServiceLabel(null)}
            >
              <svg
                viewBox={`0 0 ${pieChartSize} ${pieChartSize}`}
                className="h-[168px] w-[168px] overflow-visible"
                role="img"
                aria-label="Top services distribution"
              >
                {pieSegments.map((segment) => {
                  const isHovered = hoveredService?.label === segment.label;

                  return (
                    <path
                      key={segment.label}
                      d={segment.path}
                      fill={segment.color}
                      stroke="#FFFFFF"
                      strokeWidth={isHovered ? 4 : 3}
                      className="cursor-pointer transition-all duration-200 ease-out"
                      style={{
                        filter: isHovered
                          ? "drop-shadow(0 10px 20px rgba(15, 23, 42, 0.18))"
                          : "none",
                        transform: isHovered ? "scale(1.03)" : "scale(1)",
                        transformOrigin: `${pieChartCenter}px ${pieChartCenter}px`,
                      }}
                      onMouseEnter={() => setHoveredServiceLabel(segment.label)}
                      onFocus={() => setHoveredServiceLabel(segment.label)}
                      onBlur={() => setHoveredServiceLabel(null)}
                      tabIndex={0}
                      aria-label={`${segment.label} ${segment.value}`}
                    />
                  );
                })}
              </svg>
              <div
                className={[
                  "pointer-events-none absolute z-10 rounded-xl bg-white px-4 py-3 shadow-[0_16px_32px_rgba(15,23,42,0.12)] transition-all duration-200 ease-out",
                  hoveredService
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95",
                ].join(" ")}
                style={{
                  left: hoveredService ? `${hoveredService.tooltipX}px` : "50%",
                  top: hoveredService ? `${hoveredService.tooltipY}px` : "40px",
                  transform: hoveredService
                    ? "translate(-50%, -115%)"
                    : "translate(-50%, -115%)",
                }}
              >
                <div className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-[#667085]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: hoveredService?.color ?? "#22C55E",
                    }}
                  />
                  {hoveredService?.label ?? ""}
                </div>
                <p className="mt-1 whitespace-nowrap text-sm font-bold text-[#101828]">
                  {hoveredService?.value ?? ""}
                </p>
                <span className="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-white" />
              </div>
            </div>
            <div className="w-full space-y-3">
              {serviceLegend.map((service) => (
                <div
                  key={service.label}
                  className={[
                    "flex items-center justify-between gap-4 rounded-xl px-2 py-1.5 transition-colors duration-200",
                    hoveredService?.label === service.label
                      ? "bg-[#F8FAFC]"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: service.color }}
                    />
                    <span className="whitespace-nowrap text-sm font-medium text-[#667085]">
                      {service.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
      <section className="mt-5 rounded-2xl border border-[#EAECF0] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-[#EAECF0] px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-[#667085]">
              Recent requests
            </h2>
            {liveRequestRows ? (
              <p className="mt-1 text-xs text-[#98A2B3]">
                Read-only live jobs feed.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              setRequestsExpanded((prev) => !prev);
              setRequestPage(1);
            }}
            className="text-xs font-semibold text-[#667085] transition hover:text-[#101828]"
          >
            {requestsExpanded ? "See less" : "See all"}
          </button>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] divide-y divide-[#EAECF0]">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-xs font-semibold text-[#667085]">
                <th className="w-[260px] px-5 py-4">Customer</th>
                <th className="w-[180px] px-5 py-4">Service</th>
                <th className="w-[240px] px-5 py-4">Location</th>
                <th className="w-[180px] px-5 py-4">Date and time</th>
                <th className="w-[140px] px-5 py-4">Status</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {currentRequestRows.map((request) => (
                <tr key={request.requestId}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F4F7] text-sm font-semibold text-[#344054]">
                        {request.customerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#101828]">
                          {request.customerName}
                        </p>
                        <p className="truncate text-xs text-[#98A2B3]">
                          {request.customerEmail}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#101828]">
                    {request.service}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {request.location}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {request.date}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={request.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-11 min-h-11 w-11 min-w-11 touch-manipulation items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white text-[#667085] shadow-sm transition hover:bg-[#F8FAFC] active:bg-[#EEF2F6] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
                          aria-label={`More actions for ${request.customerName}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        collisionPadding={12}
                        className="w-[190px] rounded-[10px] border border-[#EAECF0] bg-white p-[10px] shadow-[0_18px_38px_rgba(15,23,42,0.14)]"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(
                              `/users/${request.userId}?tab=request-history&requestId=${request.requestId}`,
                            )
                          }
                          className="cursor-pointer rounded-none px-0 py-0 text-[12px] font-semibold text-[#2D3036] focus:bg-transparent focus:text-[#2D3036]"
                        >
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-[10px] bg-[#F0F1F2]" />
                        <DropdownMenuItem
                          onClick={() => navigate(ROUTES.requests)}
                          className="cursor-pointer rounded-none px-0 py-0 text-[12px] font-semibold text-[#071B58] focus:bg-transparent focus:text-[#071B58]"
                        >
                          Open requests
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-4 md:hidden">
          {currentRequestRows.map((request) => (
            <article
              key={request.requestId}
              className="relative rounded-2xl border border-[#EAECF0] p-4"
            >
              <div className="absolute right-4 top-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-11 min-h-11 w-11 min-w-11 touch-manipulation items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white text-[#667085] shadow-sm transition hover:bg-[#F8FAFC] active:bg-[#EEF2F6] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
                      aria-label={`More actions for ${request.customerName}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    collisionPadding={12}
                    className="w-[190px] rounded-[10px] border border-[#EAECF0] bg-white p-[10px] shadow-[0_18px_38px_rgba(15,23,42,0.14)]"
                  >
                    <DropdownMenuItem
                      onClick={() =>
                        navigate(
                          `/users/${request.userId}?tab=request-history&requestId=${request.requestId}`,
                        )
                      }
                      className="cursor-pointer rounded-none px-0 py-0 text-[12px] font-semibold text-[#2D3036] focus:bg-transparent focus:text-[#2D3036]"
                    >
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-[10px] bg-[#F0F1F2]" />
                    <DropdownMenuItem
                      onClick={() => navigate(ROUTES.requests)}
                      className="cursor-pointer rounded-none px-0 py-0 text-[12px] font-semibold text-[#071B58] focus:bg-transparent focus:text-[#071B58]"
                    >
                      Open requests
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex min-w-0 items-start gap-3 pr-16">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F4F7] text-sm font-semibold text-[#344054]">
                  {request.customerName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#101828]">
                    {request.customerName}
                  </p>
                  <p className="truncate text-xs text-[#98A2B3]">
                    {request.customerEmail}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-start">
                <StatusPill status={request.status} />
              </div>
              <div className="mt-4 grid gap-2 text-sm text-[#667085] sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-[#101828]">Service:</span>{" "}
                  {request.service}
                </p>
                <p>
                  <span className="font-semibold text-[#101828]">Date:</span>{" "}
                  {request.date}
                </p>
                <p className="sm:col-span-2">
                  <span className="font-semibold text-[#101828]">
                    Location:
                  </span>{" "}
                  {request.location}
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[#EAECF0] px-4 py-4 sm:px-5">
          <button
            type="button"
            onClick={() => setRequestPage((page) => Math.max(1, page - 1))}
            disabled={requestPage === 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D0D5DD] text-[#667085] transition hover:bg-[#F8FAFC]"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from(
            { length: requestsTotalPages },
            (_, index) => index + 1,
          ).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setRequestPage(page)}
              className={[
                "inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition",
                page === requestPage
                  ? "border border-[#101828] bg-white text-[#101828]"
                  : "text-[#98A2B3] hover:bg-[#F8FAFC] hover:text-[#344054]",
              ].join(" ")}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              setRequestPage((page) => Math.min(requestsTotalPages, page + 1))
            }
            disabled={requestPage === requestsTotalPages}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D0D5DD] text-[#667085] transition hover:bg-[#F8FAFC]"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}
