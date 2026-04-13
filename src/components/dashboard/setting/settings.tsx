import { toast } from "sonner";
import {
  Baby,
  Brush,
  Hammer,
  HeartPulse,
  Info,
  Lock,
  PawPrint,
  Search,
  PlugZap,
  Wrench,
  LogOut,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard/shared/dashboard-layout";
import {
  IntegrationToggle,
  type IntegrationToggleId,
} from "./integration-toggle";
import { SecurityForm, type SecurityFormValues } from "./security-form";

type SettingsTab = "integrations" | "security";

const integrationsCatalog: Array<{
  id: IntegrationToggleId;
  label: string;
  icon: ReactNode;
}> = [
  { id: "cleaning", label: "Cleaning", icon: <Brush className="h-5 w-5" /> },
  { id: "psw-care", label: "PSW care", icon: <HeartPulse className="h-5 w-5" /> },
  { id: "plumbing", label: "Plumbing", icon: <Wrench className="h-5 w-5" /> },
  { id: "locksmith", label: "Locksmith", icon: <Lock className="h-5 w-5" /> },
  {
    id: "electrician",
    label: "Electrician",
    icon: <PlugZap className="h-5 w-5" />,
  },
  { id: "babysitting", label: "Babysitting", icon: <Baby className="h-5 w-5" /> },
  { id: "petsitter", label: "Petsitter", icon: <PawPrint className="h-5 w-5" /> },
  { id: "handyman", label: "Handyman", icon: <Hammer className="h-5 w-5" /> },
];

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 w-full items-center rounded-[8px] px-4 text-left text-[14px] font-semibold",
        "transition focus:outline-none focus:ring-2 focus:ring-[#071B58]/20",
        active
          ? "border border-[#D0D5DD] bg-[#F2F4F7] text-[#0F172A]"
          : "border border-transparent bg-white text-[#98A2B3] hover:bg-[#F8FAFC] hover:text-[#344054]",
      )}
    >
      {children}
    </button>
  );
}

function SettingsSidePanel({
  activeTab,
  onSelectTab,
  onLogout,
}: {
  activeTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="w-full max-w-[260px] rounded-[14px] border border-[#EAECF0] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <div className="space-y-2">
        <TabButton
          active={activeTab === "integrations"}
          onClick={() => onSelectTab("integrations")}
        >
          - Integrations
        </TabButton>
        <TabButton
          active={activeTab === "security"}
          onClick={() => onSelectTab("security")}
        >
          - Security
        </TabButton>
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-[8px] border border-transparent bg-white px-4 text-left text-[14px] font-semibold text-[#F04438]",
            "transition hover:bg-[#FEF3F2] focus:outline-none focus:ring-2 focus:ring-[#F04438]/20",
          )}
          aria-label="Log out"
        >
          <span>→ Log-Out</span>
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

function IntegrationsTab({
  searchValue,
  onSearchChange,
  integrations,
  onToggleIntegration,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  integrations: Array<{
    id: IntegrationToggleId;
    label: string;
    icon: React.ReactNode;
    checked: boolean;
  }>;
  onToggleIntegration: (id: IntegrationToggleId, checked: boolean) => void;
}) {
  return (
    <section className="rounded-[14px] border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-6">
      <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#101828]">
        Services Intergration
      </h2>

      <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-[#F2F4F7] px-3 py-2 text-[12px] leading-4 text-[#475467]">
        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#101828] text-white">
          <Info className="h-3 w-3" aria-hidden="true" />
        </span>
        <p>
          Note that toggling off any of these integrations means that , it won’t
          be available for use on Aidsprint until it is toggled back on from
          here
        </p>
      </div>

      <div className="mt-4">
        <label htmlFor="integration-search" className="sr-only">
          Search integrations
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]"
            aria-hidden="true"
          />
          <input
            id="integration-search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search..."
            className={cn(
              "h-11 w-full rounded-[10px] border border-[#EAECF0] bg-white pl-9 pr-3 text-[12px] text-[#101828]",
              "placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20",
            )}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {integrations.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#D0D5DD] p-6 text-center">
            <p className="text-[14px] font-medium text-[#667085]">
              No integrations match your search.
            </p>
          </div>
        ) : (
          integrations.map((integration) => (
            <IntegrationToggle
              key={integration.id}
              id={integration.id}
              label={integration.label}
              icon={integration.icon}
              checked={integration.checked}
              onCheckedChange={(checked) =>
                onToggleIntegration(integration.id, checked)
              }
            />
          ))
        )}
      </div>
    </section>
  );
}

function SecurityTab({
  onSubmit,
}: {
  onSubmit: (values: SecurityFormValues) => void;
}) {
  return (
    <section className="rounded-[14px] border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-6">
      <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#101828]">
        Security
      </h2>
      <div className="mt-4 max-w-[560px]">
        <SecurityForm onSubmit={onSubmit} />
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("integrations");
  const [searchValue, setSearchValue] = useState("");
  const [integrationState, setIntegrationState] = useState<
    Record<IntegrationToggleId, boolean>
  >(() =>
    integrationsCatalog.reduce(
      (acc, item) => {
        acc[item.id] = true;
        return acc;
      },
      {} as Record<IntegrationToggleId, boolean>,
    ),
  );

  const integrations = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    const records = integrationsCatalog.map((item) => ({
      ...item,
      checked: integrationState[item.id],
    }));

    if (!query) return records;
    return records.filter((item) => item.label.toLowerCase().includes(query));
  }, [integrationState, searchValue]);

  const handleLogout = () => {
    toast.success("Logged out", {
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  const handleToggleIntegration = (
    id: IntegrationToggleId,
    checked: boolean,
  ) => {
    setIntegrationState((previous) => ({ ...previous, [id]: checked }));
    const label =
      integrationsCatalog.find((entry) => entry.id === id)?.label ??
      "Integration";
    toast.success("Integration updated", {
      description: `${label} is now ${checked ? "enabled" : "disabled"}.`,
    });
  };

  const handleSubmitSecurity = (_values: SecurityFormValues) => {
    toast.success("Password updated", {
      description: "Your password has been updated successfully.",
    });
  };

  return (
    <DashboardLayout title="Settings">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <SettingsSidePanel
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setSearchValue("");
          }}
          onLogout={handleLogout}
        />

        <div className="rounded-[14px] border border-[#EAECF0] bg-[#F9FAFB] p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#475467]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F2F4F7] text-[#344054]">
                <Info className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>Changes are applied immediately.</span>
            </div>
          </div>

          <div className="mt-4">
            {activeTab === "integrations" ? (
              <IntegrationsTab
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                integrations={integrations}
                onToggleIntegration={handleToggleIntegration}
              />
            ) : (
              <SecurityTab onSubmit={handleSubmitSecurity} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
