import type { LucideIcon } from "lucide-react";

export type DashboardNavigationItem = {
  label: string;
  icon: LucideIcon;
  path?: string;
};

export type DashboardNotificationItem = {
  id: string;
  title: string;
  preview: string;
  time: string;
};

export type DashboardNotificationGroup = {
  label: string;
  items: DashboardNotificationItem[];
};
