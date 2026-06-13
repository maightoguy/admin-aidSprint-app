import { DashboardLayout } from "@/components/dashboard/shared/dashboard-layout";
import { MarketplaceConfigTab } from "./marketplace-config";

export default function MarketplacePage() {
  return (
    <DashboardLayout title="Marketplace">
      <MarketplaceConfigTab />
    </DashboardLayout>
  );
}

