import { useMemo, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardLayout } from "../shared/dashboard-layout";
import { ContractorsActionsMenu } from "./contractors-actions-menu";
import { ContractorCard } from "./contractor-card";
import { ContractorFormModal } from "./contractor-form-modal";
import { ContractorSummaryCard } from "./contractor-summary-card";
import {
  contractorRecords,
  contractorsSummaryIconSvg,
  contractorsSummaryPattern,
} from "./contractors.data";
import type {
  ContractorAccountStatus,
  ContractorCurrentStatus,
  ContractorFilters,
  ContractorFormValues,
  ContractorMenuAction,
  ContractorRecord,
  ContractorsSummaryCard,
} from "./contractors.types";
import {
  filterContractors,
  getContractorAccountStatusClasses,
  getContractorCurrentStatusClasses,
  getContractorInitials,
} from "./contractors.utils";

function getSummaryCards(
  contractors: ContractorRecord[],
): ContractorsSummaryCard[] {
  const total = contractors.length;
  const active = contractors.filter(
    (item) => item.accountStatus === "Active",
  ).length;
  const deactivated = contractors.filter(
    (item) => item.accountStatus === "Deactivated",
  ).length;
  const online = contractors.filter(
    (item) => item.currentStatus === "Online",
  ).length;

  const formatCount = (value: number) => value.toLocaleString("en-US");

  return [
    {
      title: "Total Contractors",
      value: formatCount(total),
      trend: "+ 2.3% vs Yesterday",
      iconSvg: contractorsSummaryIconSvg,
    },
    {
      title: "Active contractors",
      value: formatCount(active),
      trend: "+ 2.3% vs Yesterday",
      iconSvg: contractorsSummaryIconSvg,
    },
    {
      title: "Pending contractors",
      value: formatCount(Math.max(0, total - online)),
      trend: "+ 2.3% vs Yesterday",
      iconSvg: contractorsSummaryIconSvg,
    },
    {
      title: "Deactivated contractors",
      value: formatCount(deactivated),
      trend: "+ 2.3% vs Yesterday",
      iconSvg: contractorsSummaryIconSvg,
    },
  ];
}

function buildDefaultFilters(): ContractorFilters {
  return {
    query: "",
    currentStatus: "all",
    accountStatus: "all",
  };
}

function mapFormValuesToRecord(
  values: ContractorFormValues,
  existing: ContractorRecord | null,
) {
  const id =
    existing?.id ??
    values.name.trim().toLowerCase().replace(/\s+/g, "-") +
      "-" +
      Math.random().toString(16).slice(2, 8);

  return {
    id,
    ...values,
  } satisfies ContractorRecord;
}

export type ContractorsPageProps = {
  initialContractors?: ContractorRecord[];
  isLoading?: boolean;
  errorMessage?: string | null;
};

export default function ContractorsPage({
  initialContractors,
  isLoading = false,
  errorMessage = null,
}: ContractorsPageProps) {
  const [contractors, setContractors] = useState<ContractorRecord[]>(
    initialContractors ?? contractorRecords,
  );
  const [filters, setFilters] =
    useState<ContractorFilters>(buildDefaultFilters);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formContractor, setFormContractor] = useState<ContractorRecord | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredContractors = useMemo(
    () => filterContractors(contractors, filters),
    [contractors, filters],
  );

  const summaryCards = useMemo(
    () => getSummaryCards(contractors),
    [contractors],
  );

  const handleAction = (
    action: ContractorMenuAction,
    contractor: ContractorRecord,
  ) => {
    if (action === "View profile") {
      setFormMode("edit");
      setFormContractor(contractor);
      setIsFormOpen(true);
      return;
    }

    if (action === "Activate account" || action === "Deactivate account") {
      const nextStatus: ContractorAccountStatus =
        action === "Activate account" ? "Active" : "Deactivated";

      if (contractor.accountStatus === nextStatus) {
        toast.info("No change", {
          description: `${contractor.name} is already ${nextStatus}.`,
        });
        return;
      }

      setContractors((prev) =>
        prev.map((item) =>
          item.id === contractor.id
            ? { ...item, accountStatus: nextStatus }
            : item,
        ),
      );

      toast.success(action, {
        description: `${contractor.name} is now ${nextStatus}.`,
      });
    }
  };

  const openAddContractor = () => {
    setFormMode("add");
    setFormContractor(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (values: ContractorFormValues) => {
    setIsSaving(true);

    try {
      const duplicateEmail = contractors.some(
        (item) =>
          item.email.toLowerCase() === values.email.toLowerCase() &&
          item.id !== formContractor?.id,
      );

      if (duplicateEmail) {
        toast.error("Unable to save contractor", {
          description: "Email address already exists for another contractor.",
        });
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 450));

      setContractors((prev) => {
        const nextRecord = mapFormValuesToRecord(values, formContractor);
        if (formMode === "add") {
          return [nextRecord, ...prev];
        }

        return prev.map((item) =>
          item.id === nextRecord.id ? nextRecord : item,
        );
      });

      toast.success(
        formMode === "add" ? "Contractor added" : "Contractor updated",
        {
          description: `${values.name} profile has been saved.`,
        },
      );

      setIsFormOpen(false);
      setFormContractor(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFilterStatus = (value: ContractorCurrentStatus | "all") => {
    setFilters((prev) => ({ ...prev, currentStatus: value }));
  };

  const handleFilterAccount = (value: ContractorAccountStatus | "all") => {
    setFilters((prev) => ({ ...prev, accountStatus: value }));
  };

  return (
    <DashboardLayout title="Contractor’s">
      <div className="space-y-8">
        {errorMessage ? (
          <div className="rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[134px] rounded-[16px] border border-[#E6E7EB] bg-white"
                />
              ))
            : summaryCards.map((card) => (
                <ContractorSummaryCard
                  key={card.title}
                  card={card}
                  backgroundImage={contractorsSummaryPattern}
                />
              ))}
        </section>

        <section className="rounded-[18px] border border-[#EAECF0] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 border-b border-[#EAECF0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="text-sm font-semibold text-[#101828]">
                All Contractors
              </p>
              <p className="mt-1 text-xs text-[#667085]">
                {filteredContractors.length.toLocaleString("en-US")} contractors
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                <input
                  value={filters.query}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      query: event.target.value,
                    }))
                  }
                  placeholder="Search Contractors ..."
                  className="w-full rounded-[10px] border border-[#D0D5DD] bg-white py-2.5 pl-10 pr-3 text-sm text-[#101828] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openAddContractor}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#041133] px-4 text-sm font-semibold text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20"
                >
                  <Plus className="h-4 w-4" />
                  Add contractor
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white text-[#667085] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
                      aria-label="Filter contractors"
                    >
                      <Filter className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={10}
                    collisionPadding={16}
                    className="w-[240px] rounded-[14px] border border-[#EAECF0] bg-white p-2 shadow-[0_24px_40px_rgba(15,23,42,0.14)]"
                  >
                    <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold text-[#667085]">
                      Current status
                    </DropdownMenuLabel>
                    {(["all", "Online", "Offline", "Busy"] as const).map(
                      (status) => (
                        <DropdownMenuCheckboxItem
                          key={status}
                          checked={filters.currentStatus === status}
                          onCheckedChange={() => handleFilterStatus(status)}
                          className="rounded-[10px] px-2 py-2 text-sm text-[#101828] focus:bg-[#F8FAFC]"
                        >
                          {status === "all" ? "All statuses" : status}
                        </DropdownMenuCheckboxItem>
                      ),
                    )}
                    <DropdownMenuSeparator className="my-2 bg-[#EAECF0]" />
                    <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold text-[#667085]">
                      Account status
                    </DropdownMenuLabel>
                    {(["all", "Active", "Deactivated"] as const).map(
                      (status) => (
                        <DropdownMenuCheckboxItem
                          key={status}
                          checked={filters.accountStatus === status}
                          onCheckedChange={() => handleFilterAccount(status)}
                          className="rounded-[10px] px-2 py-2 text-sm text-[#101828] focus:bg-[#F8FAFC]"
                        >
                          {status === "all" ? "All accounts" : status}
                        </DropdownMenuCheckboxItem>
                      ),
                    )}
                    <DropdownMenuSeparator className="my-2 bg-[#EAECF0]" />
                    <button
                      type="button"
                      onClick={() => setFilters(buildDefaultFilters())}
                      className="w-full rounded-[10px] px-2 py-2 text-left text-sm font-semibold text-[#041133] hover:bg-[#F8FAFC]"
                    >
                      Clear filters
                    </button>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-[#F9FAFB] text-xs font-semibold text-[#475467]">
                <tr className="border-b border-[#EAECF0]">
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Current Status</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Total service providing</th>
                  <th className="px-5 py-4">Date Joined</th>
                  <th className="px-5 py-4">Account Status</th>
                  <th className="px-5 py-4" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0]">
                {filteredContractors.map((contractor) => (
                  <tr key={contractor.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6E7EB] text-sm font-semibold text-[#0F172A]">
                          {getContractorInitials(contractor.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#101828]">
                            {contractor.name}
                          </p>
                          <p className="truncate text-xs text-[#667085]">
                            {contractor.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={getContractorCurrentStatusClasses(
                          contractor.currentStatus,
                        )}
                      >
                        {contractor.currentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#667085]">
                      <span className="line-clamp-1">
                        {contractor.location}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#667085]">
                      {contractor.totalServicesProvided}
                    </td>
                    <td className="px-5 py-4 text-[#667085]">
                      {contractor.dateJoined}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          getContractorAccountStatusClasses(
                            contractor.accountStatus,
                          ),
                        ].join(" ")}
                      >
                        {contractor.accountStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ContractorsActionsMenu
                        contractor={contractor}
                        onAction={handleAction}
                      />
                    </td>
                  </tr>
                ))}
                {!filteredContractors.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center text-sm text-[#667085]"
                    >
                      No contractors match your search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 px-4 py-5 md:hidden">
            {filteredContractors.map((contractor) => (
              <ContractorCard
                key={contractor.id}
                contractor={contractor}
                onAction={handleAction}
              />
            ))}
            {!filteredContractors.length ? (
              <p className="py-10 text-center text-sm text-[#667085]">
                No contractors match your search.
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-[#EAECF0] px-4 py-4">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white text-[#475467] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
              aria-label="Previous page"
            >
              <span className="text-lg">‹</span>
            </button>
            {["1", "2", "3", "4", "5", "6"].map((page) => (
              <button
                key={page}
                type="button"
                className={[
                  "inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-sm font-semibold",
                  page === "3"
                    ? "border border-[#101828] bg-white text-[#101828]"
                    : "border border-transparent text-[#98A2B3] hover:text-[#101828]",
                ].join(" ")}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white text-[#475467] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
              aria-label="Next page"
            >
              <span className="text-lg">›</span>
            </button>
          </div>
        </section>
      </div>

      <ContractorFormModal
        open={isFormOpen}
        mode={formMode}
        contractor={formContractor}
        isSaving={isSaving}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setFormContractor(null);
          }
        }}
        onSubmit={handleSubmit}
      />
    </DashboardLayout>
  );
}
