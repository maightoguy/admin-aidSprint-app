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

export const ROUTES = {
  login: "/",
  overview: "/overview",
  users: "/users",
  userDetails: "/users/:userId",
  contractors: "/contractors",
  contractorDetails: "/contractors/:contractorId",
  requests: "/requests",
  transactions: "/transactions",
  support: "/support",
  disputes: "/disputes",
  settings: "/settings",
  marketplace: "/marketplace",
} as const;

export const dashboardNavigationItems: DashboardNavigationItem[] = [
  { label: "Dashboard", Icon: DashboardIcon, path: ROUTES.overview },
  { label: "Users", Icon: UsersIcon, path: ROUTES.users },
  { label: "Contractors", Icon: ContractorsIcon, path: ROUTES.contractors },
  { label: "Requests", Icon: RequestsIcon, path: ROUTES.requests },
  { label: "Transactions", Icon: RevenueIcon, path: ROUTES.transactions },
  { label: "Support", Icon: SupportIcon, path: ROUTES.support },
  { label: "Disputes", Icon: SupportIcon, path: ROUTES.disputes },
  { label: "Settings", Icon: SettingsIcon, path: ROUTES.settings },
  { label: "Marketplace", Icon: SettingsIcon, path: ROUTES.marketplace },
];
