import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { UpdateAccountModal } from "../user-details/update-account-modal";
import { getStatusFromAccountAction } from "../user-details/user-details.utils";
import type { UpdateAccountAction } from "../user-details/user-details.types";
import { DashboardLayout } from "../shared/dashboard-layout";
import {
  ContractorKycProvider,
  useContractorKyc,
} from "./contractor-kyc-context";
import { ContractorKycTab } from "./contractor-kyc-tab";
import { contractorRecords } from "./contractors.data";
import { ContractorDetailsTabs } from "./contractor-details-tabs";
import type {
  ContractorAccountStatus,
  ContractorDetailsTabValue,
  ContractorRecord,
} from "./contractors.types";
import {
  getContractorAccountStatusClasses,
  getContractorDetailsById,
  getContractorInitials,
} from "./contractors.utils";

type ContractorDetailsPageProps = {
  initialContractorId?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  onStatusChange?: (
    contractor: ContractorRecord,
    status: ContractorAccountStatus,
  ) => Promise<void> | void;
};

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-6 w-40 animate-pulse rounded-xl bg-[#E5E7EB]" />
      <div className="h-[84px] animate-pulse rounded-[20px] bg-white" />
      <div className="h-[174px] animate-pulse rounded-[20px] bg-white" />
      <div className="h-[118px] animate-pulse rounded-[20px] bg-white" />
      <div className="h-[140px] animate-pulse rounded-[20px] bg-white" />
    </div>
  );
}

function ContractorStatusPill({ status }: { status: ContractorAccountStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        getContractorAccountStatusClasses(status),
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-[#EAECF0] px-4 py-4 sm:px-6">
      <h2 className="text-sm font-semibold text-[#667085]">{title}</h2>
      <p className="mt-1 text-sm text-[#98A2B3]">{description}</p>
    </div>
  );
}

function PersonalDetailsPanel({
  contractor,
}: {
  contractor: ContractorRecord;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-[16px] border border-[#EAECF0] bg-white shadow-sm">
        <SectionHeader
          title="Contractor’s information"
          description="This contains the user basic information"
        />
        <div className="grid gap-6 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <p className="text-sm text-[#98A2B3]">First name</p>
            <p className="mt-1 text-sm font-semibold text-[#101828]">
              {contractor.firstName}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#98A2B3]">Last name</p>
            <p className="mt-1 text-sm font-semibold text-[#101828]">
              {contractor.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#98A2B3]">Email address</p>
            <p className="mt-1 break-words text-sm font-semibold text-[#101828]">
              {contractor.email}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#98A2B3]">Gender</p>
            <p className="mt-1 text-sm font-semibold text-[#101828]">
              {contractor.gender}
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-sm text-[#98A2B3]">Date joined</p>
            <p className="mt-1 text-sm font-semibold text-[#101828]">
              {contractor.dateJoined}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[16px] border border-[#EAECF0] bg-white shadow-sm">
        <SectionHeader
          title="Service Provided"
          description="This contains a list of service the contractor selected"
        />
        <div className="px-4 py-5 sm:px-6">
          <p className="text-sm font-semibold text-[#101828]">
            {contractor.servicesProvided.join(", ")}
          </p>
        </div>
      </section>

      <section className="rounded-[16px] border border-[#EAECF0] bg-white shadow-sm">
        <SectionHeader
          title="Locations"
          description="This contains the User’s previous locations"
        />
        <div className="grid gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {contractor.locations.map((location) => (
            <article
              key={location.id}
              className="rounded-[12px] border border-[#EAECF0] bg-[#FCFCFD] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#344054]">
                    {location.primaryLine}
                  </p>
                  <p className="mt-2 text-sm text-[#667085]">
                    {location.secondaryLine}
                  </p>
                </div>
                {location.isCurrent ? (
                  <span className="inline-flex shrink-0 rounded-full bg-[#F2F4F7] px-2.5 py-1 text-[10px] font-semibold text-[#344054]">
                    Current
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ContractorDetailsContent({
  activeTab,
  contractor,
  isUpdateAccountOpen,
  busyAction,
  actionError,
  onTabChange,
  onOpenUpdateAccount,
  onUpdateAccountOpenChange,
  onStatusAction,
}: {
  activeTab: ContractorDetailsTabValue;
  contractor: ContractorRecord;
  isUpdateAccountOpen: boolean;
  busyAction: UpdateAccountAction | null;
  actionError: string | null;
  onTabChange: (value: ContractorDetailsTabValue) => void;
  onOpenUpdateAccount: () => void;
  onUpdateAccountOpenChange: (open: boolean) => void;
  onStatusAction: (action: UpdateAccountAction) => void;
}) {
  const { completedCount } = useContractorKyc();

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          onTabChange(value as ContractorDetailsTabValue)
        }
        className="space-y-5"
      >
        <ContractorDetailsTabs
          value={activeTab}
          verificationCount={completedCount}
        />
        <section className="flex flex-col gap-4 rounded-[20px] bg-transparent lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FCE7D4_0%,#E59F75_100%)] text-lg font-bold text-[#7A2E14]">
              {getContractorInitials(contractor.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[28px] font-bold tracking-[-0.03em] text-[#101828]">
                {contractor.name}
              </p>
              <div className="mt-2">
                <ContractorStatusPill status={contractor.accountStatus} />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenUpdateAccount}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877] focus:outline-none focus:ring-2 focus:ring-[#071B58]/25"
            aria-haspopup="dialog"
            aria-expanded={isUpdateAccountOpen}
          >
            Update account
            <ChevronDown className="h-4 w-4" />
          </button>
        </section>
        <TabsContent value="personal-details" className="mt-0">
          <PersonalDetailsPanel contractor={contractor} />
        </TabsContent>
        <TabsContent value="kyc-verification" className="mt-0">
          <ContractorKycTab contractor={contractor} />
        </TabsContent>
        <TabsContent value="request-history" className="mt-0" />
        <TabsContent value="transaction-history" className="mt-0" />
      </Tabs>
      <UpdateAccountModal
        open={isUpdateAccountOpen}
        busyAction={busyAction}
        errorMessage={actionError}
        onOpenChange={onUpdateAccountOpenChange}
        onSelectAction={onStatusAction}
      />
    </>
  );
}

export default function ContractorDetailsPage({
  initialContractorId,
  isLoading = false,
  errorMessage = null,
  onStatusChange,
}: ContractorDetailsPageProps) {
  const { contractorId: routeContractorId } = useParams();
  const resolvedContractorId = initialContractorId ?? routeContractorId;
  const matchedContractor = useMemo(
    () => getContractorDetailsById(contractorRecords, resolvedContractorId),
    [resolvedContractorId],
  );
  const [activeTab, setActiveTab] =
    useState<ContractorDetailsTabValue>("personal-details");
  const [isUpdateAccountOpen, setIsUpdateAccountOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<UpdateAccountAction | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [currentContractor, setCurrentContractor] =
    useState<ContractorRecord | null>(matchedContractor);

  useEffect(() => {
    setCurrentContractor(matchedContractor);
    setActiveTab("personal-details");
    setIsUpdateAccountOpen(false);
    setBusyAction(null);
    setActionError(null);
  }, [matchedContractor]);

  const handleStatusAction = async (action: UpdateAccountAction) => {
    if (!currentContractor) {
      return;
    }

    const nextStatus = getStatusFromAccountAction(
      action,
    ) as ContractorAccountStatus;

    setBusyAction(action);
    setActionError(null);

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 150);
      });

      await onStatusChange?.(currentContractor, nextStatus);

      setCurrentContractor({
        ...currentContractor,
        accountStatus: nextStatus,
      });
      setIsUpdateAccountOpen(false);

      toast.success(action, {
        description: `${currentContractor.name} is now ${nextStatus.toLowerCase()}.`,
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update account status right now.",
      );
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <DashboardLayout title="Contractor’s">
      <div className="space-y-5">
        <Link
          to="/contractors"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#475467] transition hover:text-[#101828]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to contractors
        </Link>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B42318]"
          >
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? <LoadingState /> : null}

        {!isLoading && !currentContractor ? (
          <div className="rounded-[16px] border border-[#FECACA] bg-white px-5 py-8 shadow-sm">
            <p className="text-base font-semibold text-[#101828]">
              Contractor profile not found
            </p>
            <p className="mt-2 text-sm text-[#667085]">
              The selected contractor profile could not be loaded.
            </p>
          </div>
        ) : null}

        {!isLoading && currentContractor ? (
          <ContractorKycProvider
            key={currentContractor.id}
            initialState={{ activeCategory: "id" }}
          >
            <ContractorDetailsContent
              activeTab={activeTab}
              contractor={currentContractor}
              isUpdateAccountOpen={isUpdateAccountOpen}
              busyAction={busyAction}
              actionError={actionError}
              onTabChange={setActiveTab}
              onOpenUpdateAccount={() => setIsUpdateAccountOpen(true)}
              onUpdateAccountOpenChange={setIsUpdateAccountOpen}
              onStatusAction={handleStatusAction}
            />
          </ContractorKycProvider>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
