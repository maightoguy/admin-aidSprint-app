import { useState } from "react";
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
import {
  TotalContractorsIcon,
  TotalRequestsIcon,
  TotalRevenueIcon,
  TotalUsersIcon,
} from "@/ui/icons";
import { toast } from "sonner";
import summaryCardPattern from "@/assets/overview/summary-card-pattern.png";

const totalRevenuePattern = summaryCardPattern;
const requestsCardPattern = summaryCardPattern;

type OverviewStatistic = {
  title: string;
  value: string;
  trend: string;
  Icon: IconComponent;
  highlighted?: boolean;
  patternSrc: string;
  patternClassName: string;
};

const statistics: OverviewStatistic[] = [
  {
    title: "Total Revenue",
    value: "$15,837",
    trend: "+ 2.3% vs Yesterday",
    Icon: TotalRevenueIcon,
    highlighted: true,
    patternSrc: totalRevenuePattern,
    patternClassName:
      "absolute -left-[27px] -top-[14px] hidden h-[156px] w-[318px] max-w-none rotate-180 opacity-80 lg:block",
  },
  {
    title: "Total users",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    Icon: TotalUsersIcon,
    patternSrc: summaryCardPattern,
    patternClassName:
      "absolute -left-[25px] -top-[14px] hidden h-[156px] w-[317px] max-w-none rotate-180 opacity-80 lg:block",
  },
  {
    title: "Total Contractors",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    Icon: TotalContractorsIcon,
    patternSrc: summaryCardPattern,
    patternClassName:
      "absolute -left-[25px] -top-[14px] hidden h-[156px] w-[317px] max-w-none rotate-180 opacity-80 lg:block",
  },
  {
    title: "Total Request",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    Icon: TotalRequestsIcon,
    patternSrc: requestsCardPattern,
    patternClassName:
      "absolute -left-[81px] -top-[14px] hidden h-[156px] w-[428px] max-w-none rotate-180 opacity-80 lg:block",
  },
];

const revenueBars = [
  { month: "Jan", shortMonth: "J", fullMonth: "January", value: 82 },
  { month: "Feb", shortMonth: "F", fullMonth: "February", value: 42 },
  {
    month: "Mar",
    shortMonth: "M",
    fullMonth: "March",
    value: 68,
    active: true,
  },
  { month: "Apr", shortMonth: "A", fullMonth: "April", value: 53 },
  { month: "May", shortMonth: "M", fullMonth: "May", value: 74 },
  { month: "Jun", shortMonth: "J", fullMonth: "June", value: 61 },
  { month: "Jul", shortMonth: "J", fullMonth: "July", value: 80 },
  { month: "Aug", shortMonth: "A", fullMonth: "August", value: 58 },
  { month: "Sep", shortMonth: "S", fullMonth: "September", value: 47 },
  { month: "Oct", shortMonth: "O", fullMonth: "October", value: 56 },
  { month: "Nov", shortMonth: "N", fullMonth: "November", value: 66 },
  { month: "Dec", shortMonth: "D", fullMonth: "December", value: 54 },
];

type TopService = {
  label: string;
  amount: number;
  color: string;
};

const topServices: TopService[] = [
  { label: "Plumber", amount: 6000000, color: "#22C55E" },
  { label: "Electrician", amount: 5200000, color: "#22B8CF" },
  { label: "Cleaning", amount: 3400000, color: "#8B5CF6" },
  { label: "Title", amount: 4100000, color: "#EC4899" },
];

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

const requests = [
  {
    name: "Emery Torff",
    email: "thekdfisher@email.com",
    service: "Plumbing",
    location: "163 Owode-Sango Road",
    date: "Apr 12, 2023",
    status: "Active",
  },
  {
    name: "Maren Dokidis",
    email: "thekdfisher@email.com",
    service: "Cleaning",
    location: "34 Awgu-Mgbidi Road",
    date: "Apr 12, 2023",
    status: "Pending",
  },
  {
    name: "Cooper Siphron",
    email: "thekdfisher@email.com",
    service: "Baby sitting",
    location: "170 Ejigbo-Apomu Road",
    date: "Apr 12, 2023",
    status: "Active",
  },
  {
    name: "Marcus Dias",
    email: "thekdfisher@email.com",
    service: "Electrician",
    location: "178 Omu-Aran Township",
    date: "Apr 12, 2023",
    status: "Pending",
  },
  {
    name: "Ahmad Stanton",
    email: "thekdfisher@email.com",
    service: "Plumbing",
    location: "113 Gashua-Bursari Road",
    date: "Apr 12, 2023",
    status: "Active",
  },
];

function StatusPill({ status }: { status: string }) {
  const isActive = status === "Active";

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
        isActive
          ? "bg-[#DCFCE7] text-[#22A75A]"
          : "bg-[#FFF4DB] text-[#F59E0B]",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function RequestActionsMenu({ name }: { name: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-11 min-h-11 w-11 min-w-11 touch-manipulation items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white text-[#667085] shadow-sm transition hover:bg-[#F8FAFC] active:bg-[#EEF2F6] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
          aria-label={`More actions for ${name}`}
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
            toast.success("View profile", {
              description: `View profile selected for ${name}`,
            })
          }
          className="cursor-pointer rounded-none px-0 py-0 text-[12px] font-semibold text-[#2D3036] focus:bg-transparent focus:text-[#2D3036]"
        >
          View profile
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-[10px] bg-[#F0F1F2]" />
        <DropdownMenuItem
          onClick={() =>
            toast.success("Activate account", {
              description: `Activate account selected for ${name}`,
            })
          }
          className="cursor-pointer rounded-none px-0 py-0 text-[12px] font-semibold text-[#22C55E] focus:bg-transparent focus:text-[#22C55E]"
        >
          Activate account
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-[10px] bg-[#F0F1F2]" />
        <DropdownMenuItem
          onClick={() =>
            toast.success("Deactivate account", {
              description: `Deactivate account selected for ${name}`,
            })
          }
          className="cursor-pointer rounded-none px-0 py-0 text-[12px] font-semibold text-[#EF4444] focus:bg-transparent focus:text-[#EF4444]"
        >
          Deactivate account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Overview() {
  const [hoveredServiceLabel, setHoveredServiceLabel] = useState<string | null>(
    null,
  );

  const totalTopServicesAmount = topServices.reduce(
    (total, service) => total + service.amount,
    0,
  );

  let currentAngle = 0;
  const pieSegments = topServices.map((service) => {
    const angle = (service.amount / totalTopServicesAmount) * 360;
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

  return (
    <DashboardLayout title="Dashboard">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[14px]">
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
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-[#EAECF0] px-2.5 py-1.5 text-xs font-semibold text-[#667085]"
            >
              Monthly
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
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
              <div className="relative flex h-[250px] items-end gap-1 pt-10 min-[420px]:gap-1.5 sm:gap-3">
                {revenueBars.map((bar) => (
                  <div
                    key={bar.month}
                    className="relative flex min-w-0 flex-1 flex-col items-center justify-end gap-3"
                  >
                    {bar.active ? (
                      <div className="absolute left-1/2 top-[6px] -translate-x-1/2 rounded-xl bg-white px-3 py-2 text-center shadow-[0_16px_36px_rgba(15,23,42,0.12)]">
                        <p className="whitespace-nowrap text-[11px] font-medium text-[#667085]">
                          Mar. 7th 2025
                        </p>
                        <p className="whitespace-nowrap text-xs font-bold text-[#101828]">
                          ₦6,0000
                        </p>
                      </div>
                    ) : null}
                    <div className="flex h-[170px] items-end">
                      <div
                        className={[
                          "w-3 rounded-t-full sm:w-4",
                          bar.active ? "bg-[#071B58]" : "bg-[#F2F4F7]",
                        ].join(" ")}
                        style={{ height: `${bar.value}%` }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-medium tracking-[-0.01em] text-[#98A2B3] sm:text-[11px]"
                      title={bar.fullMonth}
                    >
                      <span className="sr-only">{bar.fullMonth}</span>
                      <span aria-hidden="true" className="sm:hidden">
                        {bar.shortMonth}
                      </span>
                      <span aria-hidden="true" className="hidden sm:inline">
                        {bar.month}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-[#EAECF0] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-[#667085]">
              Top services
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-[#EAECF0] px-2.5 py-1.5 text-xs font-semibold text-[#667085]"
            >
              All time
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
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
              {topServices.map((service) => (
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
          <h2 className="text-sm font-semibold text-[#667085]">
            Recent requests
          </h2>
          <button
            type="button"
            className="text-xs font-semibold text-[#667085] transition hover:text-[#101828]"
          >
            See all
          </button>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-[#EAECF0]">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-xs font-semibold text-[#667085]">
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Service</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Date and time</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {requests.map((request) => (
                <tr key={request.name}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F4F7] text-sm font-semibold text-[#344054]">
                        {request.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#101828]">
                          {request.name}
                        </p>
                        <p className="truncate text-xs text-[#98A2B3]">
                          {request.email}
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
                    <RequestActionsMenu name={request.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-4 md:hidden">
          {requests.map((request) => (
            <article
              key={request.name}
              className="relative rounded-2xl border border-[#EAECF0] p-4"
            >
              <div className="absolute right-4 top-4 z-10">
                <RequestActionsMenu name={request.name} />
              </div>
              <div className="flex min-w-0 items-start gap-3 pr-16">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F4F7] text-sm font-semibold text-[#344054]">
                  {request.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#101828]">
                    {request.name}
                  </p>
                  <p className="truncate text-xs text-[#98A2B3]">
                    {request.email}
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
    </DashboardLayout>
  );
}
