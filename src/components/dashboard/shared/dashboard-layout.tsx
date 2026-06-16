import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, ChevronDown, Menu, X } from "lucide-react";
import { DashboardSidebar } from "./dashboard-sidebar";
import type { DashboardNotificationGroup } from "./dashboard-types";
import type { FilterField } from "./filters/filter-schema";
import { FilterButton } from "./filters/filter-button";
import { useAuthStore } from "@/auth/auth.store";
import {
  type NotificationRow,
  supabaseNotifications,
} from "@/lib/supabase/data";
import { createLogger } from "@/lib/logger";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const fallbackNotificationGroups: DashboardNotificationGroup[] = [
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

const logger = createLogger("DashboardLayout");

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
  const adminUserId = useAuthStore((state) => state.session?.userId ?? "");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState("");
  const [notificationRows, setNotificationRows] = useState<
    NotificationRow[] | null
  >(null);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (
      import.meta.env.MODE === "test" ||
      import.meta.env.VITEST ||
      !adminUserId.trim() ||
      !isSupabaseConfigured() ||
      !supabase
    ) {
      return;
    }

    let isActive = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    let refreshInFlight = false;
    let pendingRefresh = false;

    const loadNotifications = async () => {
      const result = await supabaseNotifications.listLatestForRecipient({
        recipientId: adminUserId.trim(),
        limit: 50,
      });

      if (result.ok === false) {
        throw new Error(result.message);
      }

      if (!isActive) return;

      setNotificationRows(result.data);
      setNotificationsError(null);
      setExpandedNotificationId(
        (current) => current || result.data[0]?.id || "",
      );
    };

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
          await loadNotifications();
        } catch (error) {
          if (isActive) {
            logger.error(
              "Failed to refresh notifications from realtime.",
              error,
            );
            setNotificationsError(
              error instanceof Error
                ? error.message
                : "Unable to load notifications right now.",
            );
          }
        } finally {
          refreshInFlight = false;
        }
      }, 500);
    };

    void loadNotifications().catch((error) => {
      if (!isActive) return;
      logger.error("Failed to load notifications.", error);
      setNotificationsError(
        error instanceof Error
          ? error.message
          : "Unable to load notifications right now.",
      );
    });

    const channel = supabase
      .channel(`admin-notifications-${adminUserId.trim()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${adminUserId.trim()}`,
        },
        () => {
          if (!isActive) return;
          scheduleRefresh();
        },
      )
      .subscribe((status) => {
        if (!isActive) return;
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          logger.error("Notifications realtime subscription failed.", status);
        }
      });

    return () => {
      isActive = false;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      void supabase.removeChannel(channel);
    };
  }, [adminUserId]);

  const notificationGroups = useMemo<DashboardNotificationGroup[]>(() => {
    if (!notificationRows) {
      return fallbackNotificationGroups;
    }

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const today: DashboardNotificationGroup["items"] = [];
    const yesterday: DashboardNotificationGroup["items"] = [];
    const earlier: DashboardNotificationGroup["items"] = [];

    for (const row of notificationRows) {
      const createdAt = new Date(row.created_at);
      const diff = now - createdAt.getTime();

      const item = {
        id: row.id,
        title: row.title.trim() || "Notification",
        preview: row.body.trim() || "No additional details provided.",
        unread: !row.read_at,
        time:
          diff < dayMs
            ? `${Math.max(1, Math.floor(diff / (60 * 60 * 1000)))}h ago`
            : createdAt.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }),
      };

      if (diff < dayMs) {
        today.push(item);
      } else if (diff < dayMs * 2) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    }

    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yesterday },
      { label: "Earlier", items: earlier },
    ].filter((group) => group.items.length > 0);
  }, [notificationRows]);

  const unreadCount = useMemo(() => {
    if (!notificationRows) {
      return fallbackNotificationGroups.reduce(
        (total, group) => total + group.items.length,
        0,
      );
    }

    return notificationRows.filter((row) => !row.read_at).length;
  }, [notificationRows]);

  useEffect(() => {
    if (
      import.meta.env.MODE === "test" ||
      import.meta.env.VITEST ||
      !isNotificationsOpen ||
      !notificationRows ||
      !adminUserId.trim() ||
      !isSupabaseConfigured() ||
      !supabase
    ) {
      return;
    }

    const unreadIds = notificationRows
      .filter((row) => !row.read_at)
      .map((row) => row.id);
    if (unreadIds.length === 0) {
      return;
    }

    const readAt = new Date().toISOString();
    setNotificationRows((current) =>
      current
        ? current.map((row) =>
            row.read_at ? row : { ...row, read_at: readAt },
          )
        : current,
    );

    void supabaseNotifications
      .markAllReadForRecipient({ recipientId: adminUserId.trim(), readAt })
      .then((result) => {
        if (result.ok === false) {
          logger.warn(
            "Unable to persist notification read state.",
            result.message,
          );
        }
      });
  }, [adminUserId, isNotificationsOpen, notificationRows]);

  const handleToggleNotification = (notificationId: string) => {
    setExpandedNotificationId((current) =>
      current === notificationId ? "" : notificationId,
    );

    if (
      import.meta.env.MODE === "test" ||
      import.meta.env.VITEST ||
      !notificationRows ||
      !adminUserId.trim() ||
      !isSupabaseConfigured() ||
      !supabase
    ) {
      return;
    }

    const currentRow = notificationRows.find(
      (row) => row.id === notificationId,
    );
    if (!currentRow || currentRow.read_at) {
      return;
    }

    const readAt = new Date().toISOString();
    setNotificationRows((current) =>
      current
        ? current.map((row) =>
            row.id === notificationId ? { ...row, read_at: readAt } : row,
          )
        : current,
    );

    void supabaseNotifications
      .markRead({
        notificationId,
        recipientId: adminUserId.trim(),
        readAt,
      })
      .then((result) => {
        if (result.ok === false) {
          logger.warn(
            "Unable to persist notification read state.",
            result.message,
          );
        }
      });
  };

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
                {notificationsError ? (
                  <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B42318]">
                    {notificationsError}
                  </div>
                ) : null}
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
                            onClick={() => handleToggleNotification(item.id)}
                            className="w-full rounded-2xl border border-[#EAECF0] bg-[#FCFCFD] p-4 text-left transition hover:border-[#D0D5DD] hover:bg-white"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#071B58] text-white">
                                <Bell className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex min-w-0 items-start gap-2">
                                    {item.unread ? (
                                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#F04438]" />
                                    ) : null}
                                    <p className="min-w-0 text-sm font-semibold text-[#111827]">
                                      {item.title}
                                    </p>
                                  </div>
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
                {notificationGroups.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#D0D5DD] bg-[#FCFCFD] px-4 py-10 text-center text-sm font-medium text-[#98A2B3]">
                    No notifications yet.
                  </div>
                ) : null}
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
                  {unreadCount > 0 ? (
                    <>
                      <span className="absolute right-[11px] top-[11px] h-2.5 w-2.5 rounded-full border-2 border-white bg-[#F04438]" />
                      <span className="sr-only">
                        {unreadCount} unread notifications
                      </span>
                    </>
                  ) : null}
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
