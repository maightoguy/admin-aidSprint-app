import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./login/login";
import NotFound from "./not-found/not-found";
import ContractorsPage from "./components/dashboard/contractors/contractors";
import Overview from "./components/dashboard/overview/overview";
import UserDetailsPage from "./components/dashboard/user-details/user-details-page";
import Users from "./components/dashboard/users/users";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/contractors" element={<ContractorsPage />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:userId" element={<UserDetailsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
