import { useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircleMore,
  MoreVertical,
  Settings,
  ShieldCheck,
  Users,
  UserSquare2,
  WalletCards,
  X,
} from "lucide-react";
import summaryCardPattern from "../../../.figma/image/mng1s49c-ytot67g.png";

const totalRevenueIconSvg = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.167 14.167L7.5 10.833L10 13.333L15.833 7.5" stroke="#020715" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12.5 7.5H15.833V10.833" stroke="#020715" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const totalUsersIconSvg = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.875 5.625C6.875 4.7962 7.20424 4.00134 7.79029 3.41529C8.37634 2.82924 9.1712 2.5 10 2.5C10.8288 2.5 11.6237 2.82924 12.2097 3.41529C12.7958 4.00134 13.125 4.7962 13.125 5.625C13.125 6.4538 12.7958 7.24866 12.2097 7.83471C11.6237 8.42076 10.8288 8.75 10 8.75C9.1712 8.75 8.37634 8.42076 7.79029 7.83471C7.20424 7.24866 6.875 6.4538 6.875 5.625ZM13.125 8.125C13.125 7.46196 13.3884 6.82607 13.8572 6.35723C14.3261 5.88839 14.962 5.625 15.625 5.625C16.288 5.625 16.9239 5.88839 17.3928 6.35723C17.8616 6.82607 18.125 7.46196 18.125 8.125C18.125 8.78804 17.8616 9.42393 17.3928 9.89277C16.9239 10.3616 16.288 10.625 15.625 10.625C14.962 10.625 14.3261 10.3616 13.8572 9.89277C13.3884 9.42393 13.125 8.78804 13.125 8.125ZM1.875 8.125C1.875 7.46196 2.13839 6.82607 2.60723 6.35723C3.07607 5.88839 3.71196 5.625 4.375 5.625C5.03804 5.625 5.67393 5.88839 6.14277 6.35723C6.61161 6.82607 6.875 7.46196 6.875 8.125C6.875 8.78804 6.61161 9.42393 6.14277 9.89277C5.67393 10.3616 5.03804 10.625 4.375 10.625C3.71196 10.625 3.07607 10.3616 2.60723 9.89277C2.13839 9.42393 1.875 8.78804 1.875 8.125ZM5.25833 12.5975C5.76662 11.8009 6.46757 11.1452 7.29635 10.6912C8.12513 10.2372 9.05501 9.99947 10 10C10.7915 9.99928 11.5743 10.1657 12.297 10.4885C13.0197 10.8112 13.6661 11.2829 14.1939 11.8728C14.7217 12.4627 15.119 13.1574 15.3597 13.9114C15.6004 14.6654 15.6792 15.4618 15.5908 16.2483C15.58 16.3461 15.5463 16.4398 15.4925 16.5221C15.4386 16.6043 15.3661 16.6727 15.2808 16.7217C13.6738 17.6438 11.8528 18.1277 10 18.125C8.07917 18.125 6.275 17.615 4.71917 16.7217C4.63391 16.6727 4.5614 16.6043 4.50754 16.5221C4.45367 16.4398 4.41997 16.3461 4.40917 16.2483C4.26921 14.9705 4.56872 13.6831 5.25833 12.5983V12.5975Z" fill="#020715"/>
  </svg>
`;

const totalContractorsIconSvg = totalUsersIconSvg;

const totalRequestsIconSvg = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.667 3.333H11.667L15.833 7.5V15.833C15.833 16.275 15.658 16.699 15.345 17.012C15.032 17.325 14.608 17.5 14.167 17.5H6.667C6.225 17.5 5.801 17.325 5.488 17.012C5.175 16.699 5 16.275 5 15.833V5C5 4.558 5.175 4.134 5.488 3.821C5.801 3.508 6.225 3.333 6.667 3.333Z" stroke="#020715" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M11.667 3.333V7.5H15.833" stroke="#020715" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>
`;

const totalRevenuePattern = summaryCardPattern;
const requestsCardPattern = summaryCardPattern;

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Users", icon: Users },
  { label: "Contractors", icon: UserSquare2 },
  { label: "Requests", icon: FileText },
  { label: "Transaction", icon: WalletCards },
  { label: "Support", icon: MessageCircleMore },
  { label: "Settings", icon: Settings },
];

const statistics = [
  {
    title: "Total Revenue",
    value: "$15,837",
    trend: "+ 2.3% vs Yesterday",
    iconSvg: totalRevenueIconSvg,
    highlighted: true,
    patternSrc: totalRevenuePattern,
    patternClassName:
      "absolute -left-[27px] -top-[14px] hidden h-[156px] w-[318px] max-w-none rotate-180 opacity-80 lg:block",
  },
  {
    title: "Total users",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    iconSvg: totalUsersIconSvg,
    patternSrc: summaryCardPattern,
    patternClassName:
      "absolute -left-[25px] -top-[14px] hidden h-[156px] w-[317px] max-w-none rotate-180 opacity-80 lg:block",
  },
  {
    title: "Total Contractors",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    iconSvg: totalContractorsIconSvg,
    patternSrc: summaryCardPattern,
    patternClassName:
      "absolute -left-[25px] -top-[14px] hidden h-[156px] w-[317px] max-w-none rotate-180 opacity-80 lg:block",
  },
  {
    title: "Total Request",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    iconSvg: totalRequestsIconSvg,
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

const notificationGroups = [
  {
    label: "Today",
    items: [
      {
        id: "new-request",
        title: "New request",
        preview:
          "Lorem ipsum dolor sit amet consectetur. Id nulla tristique vitae sapien ut egestas.",
        time: "2h ago",
      },
      {
        id: "lorem-consectetur",
        title: "Lorem ipsum dolor sit amet consectetur. Non sit nullam.",
        preview: "Lorem ipsum dolor sit amet consectetur.",
        time: "08:00am",
      },
      {
        id: "request-submitted",
        title: "Investment request submitted",
        preview: "Lorem ipsum dolor sit amet consectetur.",
        time: "08:00am",
      },
    ],
  },
  {
    label: "Yesterday",
    items: [
      {
        id: "lorem-yesterday",
        title: "Lorem ipsum",
        preview: "Lorem ipsum dolor sit amet consectetur.",
        time: "08:00am",
      },
      {
        id: "new-contractor",
        title: "New contractor sign up",
        preview: "Lorem ipsum dolor sit amet consectetur.",
        time: "08:00am",
      },
      {
        id: "announcements",
        title: "Announcements",
        preview: "Lorem ipsum dolor sit amet consectetur.",
        time: "08:00am",
      },
    ],
  },
];

function AidSprintLogo() {
  return (
    <div className="flex items-center gap-2 text-white">
      <span className="text-[18px] font-bold tracking-[-0.03em]">
        AidSprint
      </span>
      <div className="flex items-center gap-[2px]">
        <span className="h-5 w-[6px] skew-x-[-24deg] rounded-sm bg-[#FF2F3C]" />
        <span className="h-5 w-[6px] skew-x-[-24deg] rounded-sm bg-[#FF2F3C]" />
        <span className="h-5 w-[6px] skew-x-[-24deg] rounded-sm bg-[#FF2F3C]" />
      </div>
    </div>
  );
}

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

function Sidebar({
  mobile,
  onClose,
}: {
  mobile?: boolean;
  onClose?: () => void;
}) {
  return (
    <aside
      className={[
        "flex h-full flex-col bg-[linear-gradient(180deg,#072165_0%,#051742_100%)] text-white",
        mobile
          ? "w-[88vw] max-w-[312px] rounded-r-[28px] shadow-[0_28px_70px_rgba(2,12,37,0.45)]"
          : "w-[196px] border-r border-white/10",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-6 pb-6 pt-7">
        <AidSprintLogo />
        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              className={[
                "flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition",
                item.active
                  ? "bg-[#05163E] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
                  : "text-white/65 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-8 flex items-center gap-3 px-4 pb-6 pt-4">
        <div className="relative h-12 w-12 shrink-0 rounded-full bg-[linear-gradient(135deg,#F8D7BC_0%,#A85B39_100%)]">
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#051742] bg-[#22C55E]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            Alison Eyo
          </p>
          <p className="truncate text-xs text-[#94A3B8]">alison.@rayna.ui</p>
        </div>
        <button
          type="button"
          className="rounded-full p-2 text-[#FF5F77] transition hover:bg-white/10"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

export default function Overview() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] =
    useState("new-request");
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
    <div className="min-h-screen overflow-x-hidden bg-[#F6F8FB] text-[#101828]">
      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-[#020617]/45 backdrop-blur-[2px] lg:hidden">
          <Sidebar mobile onClose={() => setIsSidebarOpen(false)} />
        </div>
      ) : null}
      {isNotificationsOpen ? (
        <div className="fixed inset-0 z-50 bg-[rgba(15,23,42,0.16)] backdrop-blur-md">
          <div className="flex h-full justify-end">
            <div className="flex h-full w-full max-w-[420px] flex-col overflow-y-auto rounded-none bg-white px-5 pb-6 pt-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:px-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#0F172A]">
                    Notifications
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="rounded-full p-2 text-[#475467] transition hover:bg-[#F3F4F6]"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-6">
                {notificationGroups.map((group) => (
                  <div key={group.label} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                      {group.label}
                    </p>
                    <div className="space-y-3">
                      {group.items.map((item) => {
                        const expanded = expandedNotificationId === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setExpandedNotificationId(expanded ? "" : item.id)
                            }
                            className="w-full rounded-2xl border border-[#EAECF0] bg-[#FCFCFD] p-4 text-left transition hover:border-[#D0D5DD] hover:bg-white"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#071B58] text-white">
                                <Bell className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm font-semibold text-[#111827]">
                                    {item.title}
                                  </p>
                                  <ChevronDown
                                    className={[
                                      "mt-0.5 h-4 w-4 shrink-0 text-[#98A2B3] transition-transform",
                                      expanded ? "rotate-180" : "",
                                    ].join(" ")}
                                  />
                                </div>
                                <p
                                  className={[
                                    "mt-1 text-sm leading-6 text-[#667085]",
                                    expanded ? "" : "line-clamp-1",
                                  ].join(" ")}
                                >
                                  {item.preview}
                                </p>
                                <p className="mt-1 text-xs font-medium text-[#98A2B3]">
                                  {item.time}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="min-w-0 flex-1">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col px-4 pb-6 pt-4 sm:px-6 lg:px-5 lg:pb-8 lg:pt-7">
            <div className="mb-5 flex flex-col gap-4 border-b border-[#EAECF0] pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="rounded-xl border border-[#E4E7EC] bg-white p-2.5 text-[#344054] shadow-sm transition hover:bg-[#F8FAFC] lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-[24px] font-bold tracking-[-0.03em] text-[#101828] lg:text-[28px]">
                    Dashboard
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#EAECF0] bg-white px-4 py-2.5 text-sm font-medium text-[#667085] shadow-sm transition hover:bg-[#F8FAFC]"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>All time</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(true)}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#EAECF0] bg-white text-[#667085] shadow-sm transition hover:bg-[#F8FAFC]"
                  aria-label="Open notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-[11px] top-[11px] h-2.5 w-2.5 rounded-full border-2 border-white bg-[#F04438]" />
                </button>
                <div className="inline-flex items-center gap-3 rounded-xl border border-[#EAECF0] bg-white px-4 py-2.5 shadow-sm">
                  <span className="text-sm font-medium text-[#667085]">
                    System Status:
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-semibold text-[#12B76A]">
                    <span className="h-2 w-2 rounded-full bg-[#12B76A]" />
                    Active
                  </span>
                </div>
              </div>
            </div>
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
                          item.highlighted
                            ? "text-[#EEF3E6]"
                            : "text-[#6B7280]",
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
                          item.highlighted
                            ? "text-[#B1B5C0]"
                            : "text-[#136C34]",
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
                      <span
                        aria-hidden="true"
                        dangerouslySetInnerHTML={{ __html: item.iconSvg }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </section>
            <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
              <article className="rounded-2xl border border-[#EAECF0] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[#667085]">
                      Revenue
                    </h2>
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
                            <span
                              aria-hidden="true"
                              className="hidden sm:inline"
                            >
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
                        const isHovered =
                          hoveredService?.label === segment.label;

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
                            onMouseEnter={() =>
                              setHoveredServiceLabel(segment.label)
                            }
                            onFocus={() =>
                              setHoveredServiceLabel(segment.label)
                            }
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
                        left: hoveredService
                          ? `${hoveredService.tooltipX}px`
                          : "50%",
                        top: hoveredService
                          ? `${hoveredService.tooltipY}px`
                          : "40px",
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
                          <button
                            type="button"
                            className="rounded-xl border border-[#EAECF0] p-2 text-[#667085] transition hover:bg-[#F8FAFC]"
                            aria-label={`More actions for ${request.name}`}
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
                {requests.map((request) => (
                  <article
                    key={request.name}
                    className="rounded-2xl border border-[#EAECF0] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
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
                      <StatusPill status={request.status} />
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-[#667085] sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-[#101828]">
                          Service:
                        </span>{" "}
                        {request.service}
                      </p>
                      <p>
                        <span className="font-semibold text-[#101828]">
                          Date:
                        </span>{" "}
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
          </div>
        </main>
      </div>
    </div>
  );
}
