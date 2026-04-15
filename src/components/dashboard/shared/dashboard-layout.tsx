import { useState } from "react";
import { Bell, CalendarDays, ChevronDown, Menu, X } from "lucide-react";
import { DashboardSidebar } from "./dashboard-sidebar";
import type { DashboardNotificationGroup } from "./dashboard-types";
import type { FilterField } from "./filters/filter-schema";
import { FilterButton } from "./filters/filter-button";

const notificationGroups: DashboardNotificationGroup[] = [
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
        id: "new-contractor",
        title: "New contractor sign up",
        preview: "Lorem ipsum dolor sit amet consectetur.",
        time: "08:00am",
      },
    ],
  },
];

const dashboardDateRangeSchema: FilterField[] = [
  {
    type: "dateRange",
    key: "dateRange",
    label: "Date range",
    fromKey: "from",
    toKey: "to",
  },
];

export function DashboardLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] =
    useState("new-request");

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F6F8FB] text-[#101828]">
      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-[#020617]/45 backdrop-blur-[2px] lg:hidden">
          <DashboardSidebar mobile onClose={() => setIsSidebarOpen(false)} />
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
          <DashboardSidebar />
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
                    {title}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <FilterButton
                  title="Filter by date"
                  schema={dashboardDateRangeSchema}
                  trigger={({ onClick, activeLabel }) => (
                    <button
                      type="button"
                      onClick={onClick}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#EAECF0] bg-white px-4 py-2.5 text-sm font-medium text-[#667085] shadow-sm transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
                      aria-label="Open date range filter"
                    >
                      <CalendarDays className="h-4 w-4" />
                      <span>{activeLabel ?? "All time"}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  )}
                />
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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
