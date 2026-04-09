import {
  ContractorsIcon,
  DashboardIcon,
  RequestsIcon,
  RevenueIcon,
  SettingsIcon,
  SupportIcon,
  UsersIcon,
} from "@/ui/icons";
import type { DashboardNavigationItem } from "./dashboard-types";

export const dashboardNavigationItems: DashboardNavigationItem[] = [
  { label: "Dashboard", Icon: DashboardIcon, path: "/overview" },
  { label: "Users", Icon: UsersIcon, path: "/users" },
  { label: "Contractors", Icon: ContractorsIcon, path: "/contractors" },
  { label: "Requests", Icon: RequestsIcon, path: "/requests" },
  { label: "Transaction", Icon: RevenueIcon },
  { label: "Support", Icon: SupportIcon },
  { label: "Settings", Icon: SettingsIcon },
];
