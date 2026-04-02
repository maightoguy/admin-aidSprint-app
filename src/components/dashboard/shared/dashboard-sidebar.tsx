import {
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircleMore,
  Settings,
  UserSquare2,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import type { DashboardNavigationItem } from "./dashboard-types";

const navigationItems: DashboardNavigationItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/overview" },
  { label: "Users", icon: Users, path: "/users" },
  { label: "Contractors", icon: UserSquare2, path: "/contractors" },
  { label: "Requests", icon: FileText },
  { label: "Transaction", icon: WalletCards },
  { label: "Support", icon: MessageCircleMore },
  { label: "Settings", icon: Settings },
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

export function DashboardSidebar({
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
          const baseClassName =
            "flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition";

          if (item.path) {
            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={mobile ? onClose : undefined}
                className={({ isActive }) =>
                  [
                    baseClassName,
                    isActive
                      ? "bg-[#05163E] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
                      : "text-white/65 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              aria-disabled="true"
              className={[
                baseClassName,
                "cursor-not-allowed text-white/45",
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
