import type { IconComponent } from "@/ui/icons";

export type DashboardNavigationItem = {
  label: string;
  Icon: IconComponent;
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
