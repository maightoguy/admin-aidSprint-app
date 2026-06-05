import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireAuth } from "@/auth/require-auth";
import { ROUTES } from "@/components/dashboard/shared/dashboard-navigation";
import { DashboardLayout } from "@/components/dashboard/shared/dashboard-layout";
import ContractorDetailsPage from "./components/dashboard/contractors/contractor-details-page";
import Login from "./login/login";
import NotFound from "./not-found/not-found";
import ContractorsPage from "./components/dashboard/contractors/contractors";
import Overview from "./components/overview/overview";
import RequestsPage from "./components/dashboard/requests/requests";
import SupportPage from "./components/dashboard/support/support";
import TransactionsPage from "./components/dashboard/transactions/transactions";
import SettingsPage from "./components/dashboard/setting/settings";
import DisputesPage from "./components/dashboard/disputes/disputes";
import UserDetailsPage from "./components/dashboard/user-details/user-details-page";
import Users from "./components/dashboard/users/users";

const queryClient = new QueryClient();

function PlannedModulePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <DashboardLayout title={title}>
      <div className="rounded-[16px] border border-[#EAECF0] bg-white px-5 py-6 shadow-sm">
        <p className="text-base font-semibold text-[#101828]">{title}</p>
        <p className="mt-2 text-sm text-[#667085]">{description}</p>
      </div>
    </DashboardLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.login} element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path={ROUTES.overview} element={<Overview />} />
            <Route path={ROUTES.contractors} element={<ContractorsPage />} />
            <Route
              path={ROUTES.contractorDetails}
              element={<ContractorDetailsPage />}
            />
            <Route path={ROUTES.requests} element={<RequestsPage />} />
            <Route path={ROUTES.transactions} element={<TransactionsPage />} />
            <Route path={ROUTES.support} element={<SupportPage />} />
            <Route path={ROUTES.disputes} element={<DisputesPage />} />
            <Route path={ROUTES.settings} element={<SettingsPage />} />
            <Route
              path={ROUTES.marketplace}
              element={
                <PlannedModulePlaceholder
                  title="Marketplace"
                  description="This module is planned. It will house service categories, pricing tiers, promos, and notification management."
                />
              }
            />
            <Route path={ROUTES.users} element={<Users />} />
            <Route path={ROUTES.userDetails} element={<UserDetailsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
