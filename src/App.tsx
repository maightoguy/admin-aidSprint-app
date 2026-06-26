import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireAuth } from "@/auth/require-auth";
import { ROUTES } from "@/components/dashboard/shared/dashboard-navigation";
import ContractorDetailsPage from "./components/dashboard/contractors/contractor-details-page";
import Login from "./login/login";
import NotFound from "./not-found/not-found";
import ContractorsPage from "./components/dashboard/contractors/contractors";
import Overview from "./components/overview/overview";
import RequestsPage from "./components/dashboard/requests/requests";
import SupportPage from "./components/dashboard/support/support";
import TransactionsPage from "./components/dashboard/transactions/transactions";
import SettingsPage from "./components/dashboard/setting/settings";
import MarketplacePage from "./components/dashboard/setting/marketplace-page";
import DisputesPage from "./components/dashboard/disputes/disputes";
import UserDetailsPage from "./components/dashboard/user-details/user-details-page";
import Users from "./components/dashboard/users/users";
import { useAuthStore } from "@/auth/auth.store";
import { supabaseProfiles } from "@/lib/supabase/data";
import { useCallback } from "react";

const queryClient = new QueryClient();

function UserDetailsPageWithStatusHandler() {
  const session = useAuthStore((state) => state.session);

  const handleStatusChange = useCallback(
    async (user: { id: string; name: string }, status: string) => {
      const actorUserId = session?.userId?.trim() ?? "";
      if (!actorUserId) {
        throw new Error("You must be signed in to update account status.");
      }

      const active = status === "Active";
      const result = await supabaseProfiles.updateAccountStatus({
        userId: user.id,
        active,
        actorUserId,
      });

      if (result.ok === false) {
        throw new Error(result.message);
      }
    },
    [session?.userId],
  );

  return (
    <UserDetailsPage
      accountActionsEnabled
      requestActionsEnabled
      onStatusChange={handleStatusChange}
    />
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
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
            <Route path={ROUTES.marketplace} element={<MarketplacePage />} />
            <Route path={ROUTES.users} element={<Users accountActionsEnabled />} />
            <Route path={ROUTES.userDetails} element={<UserDetailsPageWithStatusHandler />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);