import { useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
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
  Wrench,
  X,
} from "lucide-react";

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
    icon: WalletCards,
    highlighted: true,
  },
  {
    title: "Total users",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    icon: Users,
  },
  {
    title: "Total Contractors",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    icon: UserSquare2,
  },
  {
    title: "Total Request",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    icon: FileText,
  },
];

const revenueBars = [
  { month: "Jan", value: 82 },
  { month: "Feb", value: 42 },
  { month: "Mar", value: 68, active: true },
  { month: "Apr", value: 53 },
  { month: "May", value: 74 },
  { month: "Jun", value: 61 },
  { month: "Jul", value: 80 },
  { month: "Aug", value: 58 },
  { month: "Sep", value: 47 },
  { month: "Oct", value: 56 },
  { month: "Nov", value: 66 },
  { month: "Dec", value: 54 },
];

const topServices = [
  { label: "Plumber", value: "₦6,000,000", color: "#22C55E" },
  { label: "Electrician", value: "₦5,200,000", color: "#22B8CF" },
  { label: "Cleaning", value: "₦3,400,000", color: "#8B5CF6" },
  { label: "Title", value: "₦4,100,000", color: "#EC4899" },
];

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
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
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
            <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {statistics.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className={[
                      "rounded-2xl border px-5 py-4 shadow-sm",
                      item.highlighted
                        ? "border-[#07133A] bg-[linear-gradient(135deg,#020817_0%,#041B5C_100%)] text-white"
                        : "border-[#EAECF0] bg-white text-[#101828]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className={[
                            "text-sm font-medium",
                            item.highlighted
                              ? "text-white/80"
                              : "text-[#98A2B3]",
                          ].join(" ")}
                        >
                          {item.title}
                        </p>
                        <p className="mt-3 text-[34px] font-bold leading-none tracking-[-0.04em]">
                          {item.value}
                        </p>
                        <p
                          className={[
                            "mt-3 text-xs font-medium",
                            item.highlighted
                              ? "text-white/65"
                              : "text-[#16A34A]",
                          ].join(" ")}
                        >
                          {item.trend}
                        </p>
                      </div>
                      <div
                        className={[
                          "flex h-10 w-10 items-center justify-center rounded-xl border",
                          item.highlighted
                            ? "border-white/15 bg-white/5 text-white"
                            : "border-[#EAECF0] bg-[#F8FAFC] text-[#0F172A]",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </article>
                );
              })}
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
                    <div className="relative flex h-[250px] items-end gap-2 pt-10 sm:gap-3">
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
                          <span className="text-[11px] font-medium text-[#98A2B3]">
                            {bar.month}
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
                  <div className="relative flex items-center justify-center">
                    <div
                      className="h-[168px] w-[168px] rounded-full"
                      style={{
                        background:
                          "conic-gradient(#EC4899 0deg 90deg, #8B5CF6 90deg 135deg, #22B8CF 135deg 270deg, #22C55E 270deg 360deg)",
                      }}
                    />
                    <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-xl bg-white px-4 py-3 shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
                      <div className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-[#667085]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                        Plumber
                      </div>
                      <p className="mt-1 whitespace-nowrap text-sm font-bold text-[#101828]">
                        ₦6,000,000
                      </p>
                    </div>
                  </div>
                  <div className="w-full space-y-3">
                    {topServices.map((service) => (
                      <div
                        key={service.label}
                        className="flex items-center justify-between gap-4"
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
                        <span className="whitespace-nowrap text-sm font-semibold text-[#101828]">
                          {service.value}
                        </span>
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
            <div className="mt-5 flex items-center gap-2 text-xs font-medium text-[#98A2B3]">
              <ShieldCheck className="h-4 w-4 text-[#12B76A]" />
              <span>
                Responsive overview optimized for mobile, tablet, and desktop.
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
