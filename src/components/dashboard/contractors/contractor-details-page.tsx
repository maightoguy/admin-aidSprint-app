import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "../shared/dashboard-layout";
import { useAuthStore } from "@/auth/auth.store";
import {
  ContractorKycProvider,
  useContractorKyc,
} from "./contractor-kyc-context";
import { ContractorKycTab } from "./contractor-kyc-tab";
import { ContractorRequestHistoryTab } from "./contractor-request-history-tab";
import { ContractorTransactionHistoryTab } from "./contractor-transaction-history-tab";
import { ContractorDetailsTabs } from "./contractor-details-tabs";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { supabaseContractors } from "@/lib/supabase/data";
import { createLogger } from "@/lib/logger";
import {
  contractorRecords,
  loadLiveContractorDetails,
} from "./contractors.data";
import type {
  ContractorAccountStatus,
  ContractorKycState,
  ContractorDetailsTabValue,
  ContractorLifecycleState,
  ContractorRecord,
} from "./contractors.types";
import {
  getContractorAccountStatusClasses,
  getContractorDetailsById,
  getContractorInitials,
  getContractorLifecycleClasses,
  getContractorPayoutClasses,
  getContractorRiskClasses,
  getContractorVerificationClasses,
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

const logger = createLogger("ContractorDetails");

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

function LifecyclePill({ state }: { state: ContractorLifecycleState }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        getContractorLifecycleClasses(state),
      ].join(" ")}
    >
      {state}
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
          title="Operations snapshot"
          description="Operational trust, lifecycle, and payout context for this contractor"
        />
        <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            {
              label: "Verification",
              value: contractor.verificationState,
              tone: getContractorVerificationClasses(
                contractor.verificationState,
              ),
            },
            {
              label: "Payout readiness",
              value: contractor.payoutStatus,
              tone: getContractorPayoutClasses(contractor.payoutStatus),
            },
            {
              label: "Risk level",
              value: `${contractor.riskLevel} risk`,
              tone: getContractorRiskClasses(contractor.riskLevel),
            },
            {
              label: "Lifecycle",
              value: contractor.lifecycleState,
              tone: getContractorLifecycleClasses(contractor.lifecycleState),
            },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-[14px] border border-[#EAECF0] bg-[#FCFCFD] p-4"
            >
              <p className="text-sm text-[#98A2B3]">{item.label}</p>
              <span
                className={[
                  "mt-4 inline-flex rounded-full px-3 py-1 text-sm font-semibold",
                  item.tone,
                ].join(" ")}
              >
                {item.value}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[16px] border border-[#EAECF0] bg-white shadow-sm">
        <SectionHeader
          title="Performance metrics"
          description="Backend-ready service, acceptance, and response indicators"
        />
        <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            {
              label: "Rating",
              value: `${contractor.rating.toFixed(1)} / 5`,
              helper: `${contractor.totalRatings} verified ratings`,
            },
            {
              label: "Acceptance rate",
              value: `${Math.round(contractor.acceptanceRate * 100)}%`,
              helper: `${contractor.totalJobsAccepted}/${contractor.totalJobsOffered} jobs accepted`,
            },
            {
              label: "Completion rate",
              value: `${Math.round(contractor.completionRate * 100)}%`,
              helper: `${contractor.totalJobsCompleted} jobs completed`,
            },
            {
              label: "Response speed",
              value: contractor.responseTimeLabel,
              helper: `Last active ${contractor.lastActiveLabel}`,
            },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-[14px] border border-[#EAECF0] bg-[#FCFCFD] p-4"
            >
              <p className="text-sm text-[#98A2B3]">{item.label}</p>
              <p className="mt-4 text-xl font-bold text-[#101828]">
                {item.value}
              </p>
              <p className="mt-2 text-xs text-[#667085]">{item.helper}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[16px] border border-[#EAECF0] bg-white shadow-sm">
        <SectionHeader
          title="Trust and payout review"
          description="Operational follow-up items and payout readiness details"
        />
        <div className="grid gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[14px] border border-[#EAECF0] bg-[#FCFCFD] p-4">
            <p className="text-sm text-[#98A2B3]">Trust/risk indicators</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {contractor.riskFlags.map((flag) => (
                <span
                  key={flag}
                  className="inline-flex rounded-full bg-[#F2F4F7] px-3 py-1 text-xs font-semibold text-[#344054]"
                >
                  {flag}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-[#667085]">
              {contractor.watchlistReason ??
                "No active trust watchlist issue is attached to this contractor."}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[12px] border border-[#EAECF0] bg-white p-3">
                <p className="text-xs text-[#98A2B3]">Repeated complaints</p>
                <p className="mt-2 text-lg font-bold text-[#101828]">
                  {contractor.repeatedComplaints}
                </p>
              </div>
              <div className="rounded-[12px] border border-[#EAECF0] bg-white p-3">
                <p className="text-xs text-[#98A2B3]">Service zone</p>
                <p className="mt-2 text-sm font-semibold text-[#101828]">
                  {contractor.serviceZoneLabel}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[14px] border border-[#EAECF0] bg-[#FCFCFD] p-4">
            <p className="text-sm text-[#98A2B3]">Payout readiness</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={[
                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  getContractorPayoutClasses(contractor.payoutStatus),
                ].join(" ")}
              >
                {contractor.payoutStatus}
              </span>
              <span
                className={[
                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  getContractorVerificationClasses(
                    contractor.verificationState,
                  ),
                ].join(" ")}
              >
                {contractor.verificationState}
              </span>
            </div>
            <div className="mt-4 rounded-[12px] border border-[#EAECF0] bg-white p-4">
              <p className="text-xs text-[#98A2B3]">Pending payout amount</p>
              <p className="mt-2 text-xl font-bold text-[#101828]">
                {contractor.pendingPayoutAmount}
              </p>
              <p className="mt-2 text-sm text-[#667085]">
                {contractor.payoutsBlockedReason ??
                  "No payout blocker is currently attached to this contractor."}
              </p>
            </div>
          </article>
        </div>
      </section>

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
  actionError,
  liveRequestRows,
  liveTransactions,
  lifecycleAction,
  lifecycleReason,
  manageDialogOpen,
  onTabChange,
  onManageDialogOpenChange,
  onLifecycleReasonChange,
  onOpenManageDialog,
  onConfirmLifecycleAction,
  isActionSaving,
}: {
  activeTab: ContractorDetailsTabValue;
  contractor: ContractorRecord;
  actionError: string | null;
  liveRequestRows?: Parameters<
    typeof ContractorRequestHistoryTab
  >[0]["initialRows"];
  liveTransactions?: Parameters<
    typeof ContractorTransactionHistoryTab
  >[0]["initialTransactions"];
  lifecycleAction: "suspend" | "restore";
  lifecycleReason: string;
  manageDialogOpen: boolean;
  onTabChange: (value: ContractorDetailsTabValue) => void;
  onManageDialogOpenChange: (open: boolean) => void;
  onLifecycleReasonChange: (reason: string) => void;
  onOpenManageDialog: () => void;
  onConfirmLifecycleAction: () => void;
  isActionSaving: boolean;
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
              <div className="mt-2 flex flex-wrap gap-2">
                <LifecyclePill state={contractor.lifecycleState} />
                <ContractorStatusPill status={contractor.accountStatus} />
                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                    getContractorVerificationClasses(
                      contractor.verificationState,
                    ),
                  ].join(" ")}
                >
                  {contractor.verificationState}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenManageDialog}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877] focus:outline-none focus:ring-2 focus:ring-[#071B58]/25"
            aria-haspopup="dialog"
            aria-expanded={manageDialogOpen}
          >
            Manage lifecycle
            <ChevronDown className="h-4 w-4" />
          </button>
        </section>
        <TabsContent value="personal-details" className="mt-0">
          <PersonalDetailsPanel contractor={contractor} />
        </TabsContent>
        <TabsContent value="kyc-verification" className="mt-0">
          <ContractorKycTab contractor={contractor} />
        </TabsContent>
        <TabsContent value="request-history" className="mt-0">
          <ContractorRequestHistoryTab
            contractor={contractor}
            initialRows={liveRequestRows}
          />
        </TabsContent>
        <TabsContent value="transaction-history" className="mt-0">
          <ContractorTransactionHistoryTab
            contractor={contractor}
            initialTransactions={liveTransactions}
          />
        </TabsContent>
      </Tabs>
      <Dialog open={manageDialogOpen} onOpenChange={onManageDialogOpenChange}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-[520px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
          <div className="px-6 py-6">
            <DialogTitle className="text-xl font-bold text-[#101828]">
              Manage lifecycle
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-[#667085]">
              {lifecycleAction === "suspend"
                ? "Capture a reason before removing this contractor from active operations."
                : "Capture a reason before restoring this contractor to active operations."}
            </DialogDescription>

            <div className="mt-4 rounded-[12px] border border-[#EAECF0] bg-[#FCFCFD] p-4">
              <p className="text-sm font-semibold text-[#101828]">
                {contractor.name}
              </p>
              <p className="mt-1 text-sm text-[#667085]">
                {contractor.verificationState} · Payout{" "}
                {contractor.payoutStatus} · {contractor.rating.toFixed(1)}{" "}
                rating
              </p>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-semibold text-[#344054]">
                {lifecycleAction === "suspend"
                  ? "Suspension reason"
                  : "Restore reason"}
              </label>
              <Textarea
                value={lifecycleReason}
                onChange={(event) =>
                  onLifecycleReasonChange(event.target.value)
                }
                className="mt-2 min-h-[132px]"
                placeholder={
                  lifecycleAction === "suspend"
                    ? "Describe why this contractor is being suspended"
                    : "Describe why this contractor can be restored"
                }
                aria-label={
                  lifecycleAction === "suspend"
                    ? "Suspension reason"
                    : "Restore reason"
                }
              />
              {!lifecycleReason.trim() ? (
                <p className="mt-2 text-xs font-medium text-[#B42318]">
                  A reason is required.
                </p>
              ) : null}
              {actionError ? (
                <p className="mt-2 text-xs font-medium text-[#B42318]">
                  {actionError}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onManageDialogOpenChange(false)}
                disabled={isActionSaving}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmLifecycleAction}
                disabled={!lifecycleReason.trim() || isActionSaving}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
                  lifecycleAction === "suspend"
                    ? "bg-[#F04438] hover:bg-[#D92D20]"
                    : "bg-[#071B58] hover:bg-[#0C2877]",
                ].join(" ")}
              >
                {lifecycleAction === "suspend" ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {isActionSaving
                  ? "Saving..."
                  : lifecycleAction === "suspend"
                    ? "Confirm suspension"
                    : "Confirm restore"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ContractorDetailsPage({
  initialContractorId,
  isLoading = false,
  errorMessage = null,
  onStatusChange,
}: ContractorDetailsPageProps) {
  const adminUserId = useAuthStore((state) => state.session?.userId ?? "");
  const { contractorId: routeContractorId } = useParams();
  const resolvedContractorId = initialContractorId ?? routeContractorId;
  const matchedContractor = useMemo(
    () => getContractorDetailsById(contractorRecords, resolvedContractorId),
    [resolvedContractorId],
  );
  const [activeTab, setActiveTab] =
    useState<ContractorDetailsTabValue>("personal-details");
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lifecycleReason, setLifecycleReason] = useState("");
  const [currentContractor, setCurrentContractor] =
    useState<ContractorRecord | null>(matchedContractor);
  const [kycInitialState, setKycInitialState] = useState<
    Partial<ContractorKycState>
  >({
    activeCategory: "id",
  });
  const [liveRequestRows, setLiveRequestRows] =
    useState<
      Parameters<typeof ContractorRequestHistoryTab>[0]["initialRows"]
    >();
  const [liveTransactions, setLiveTransactions] =
    useState<
      Parameters<
        typeof ContractorTransactionHistoryTab
      >[0]["initialTransactions"]
    >();
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveErrorMessage, setLiveErrorMessage] = useState<string | null>(null);
  const [hasLiveContractorDetails, setHasLiveContractorDetails] =
    useState(false);
  const [isActionSaving, setIsActionSaving] = useState(false);

  useEffect(() => {
    setCurrentContractor(matchedContractor);
    setActiveTab("personal-details");
    setManageDialogOpen(false);
    setActionError(null);
    setLifecycleReason("");
  }, [matchedContractor]);

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      if (
        !resolvedContractorId ||
        import.meta.env.MODE === "test" ||
        import.meta.env.VITEST ||
        !isSupabaseConfigured()
      ) {
        return;
      }

      setIsLiveLoading(true);
      setLiveErrorMessage(null);

      try {
        const details = await loadLiveContractorDetails(resolvedContractorId);
        if (cancelled || !details) {
          return;
        }

        setCurrentContractor(details.contractor);
        setKycInitialState({
          activeCategory: "id",
          ...details.kycState,
        });
        setLiveRequestRows(details.requestRows);
        setLiveTransactions(details.transactions);
        setHasLiveContractorDetails(true);
      } catch (error) {
        if (!cancelled) {
          setHasLiveContractorDetails(false);
          setLiveErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load contractor details right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLiveLoading(false);
        }
      }
    }

    void loadDetails();
    return () => {
      cancelled = true;
    };
  }, [resolvedContractorId]);

  useEffect(() => {
    if (
      import.meta.env.MODE === "test" ||
      import.meta.env.VITEST ||
      !hasLiveContractorDetails ||
      !isSupabaseConfigured() ||
      !supabase ||
      !resolvedContractorId
    ) {
      return;
    }

    let isActive = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    let refreshInFlight = false;
    let pendingRefresh = false;

    const scheduleRefresh = () => {
      pendingRefresh = true;
      if (refreshTimeout) clearTimeout(refreshTimeout);

      refreshTimeout = setTimeout(async () => {
        if (!isActive || !pendingRefresh || refreshInFlight) return;
        pendingRefresh = false;
        refreshInFlight = true;

        try {
          const refreshedDetails = await loadLiveContractorDetails(
            resolvedContractorId,
          );
          if (!isActive || !refreshedDetails) return;

          setCurrentContractor(refreshedDetails.contractor);
          setKycInitialState({
            activeCategory: "id",
            ...refreshedDetails.kycState,
          });
          setLiveRequestRows(refreshedDetails.requestRows);
          setLiveTransactions(refreshedDetails.transactions);
          setHasLiveContractorDetails(true);
        } catch (error) {
          if (isActive) {
            logger.error("Failed to refresh contractor details from realtime.", error);
          }
        } finally {
          refreshInFlight = false;
        }
      }, 700);
    };

    const channel = supabase
      .channel(`admin-contractor-details-${resolvedContractorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contractors",
          filter: `id=eq.${resolvedContractorId}`,
        },
        () => {
          if (!isActive) return;
          scheduleRefresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          filter: `contractor_id=eq.${resolvedContractorId}`,
        },
        () => {
          if (!isActive) return;
          scheduleRefresh();
        },
      )
      .subscribe((status) => {
        if (!isActive) return;
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          logger.error("Contractor details realtime subscription failed.", status);
        }
      });

    return () => {
      isActive = false;
      if (refreshTimeout) clearTimeout(refreshTimeout);
      void supabase.removeChannel(channel);
    };
  }, [hasLiveContractorDetails, resolvedContractorId]);

  const lifecycleAction =
    currentContractor?.lifecycleState === "Suspended" ? "restore" : "suspend";

  const closeManageDialog = () => {
    setManageDialogOpen(false);
    setActionError(null);
    setLifecycleReason("");
  };

  const handleLifecycleAction = async () => {
    if (!currentContractor) {
      return;
    }

    const trimmedReason = lifecycleReason.trim();
    if (!trimmedReason) {
      setActionError("A reason is required.");
      return;
    }

    const nextStatus: ContractorAccountStatus =
      lifecycleAction === "suspend" ? "Deactivated" : "Active";
    const nextLifecycleState: ContractorLifecycleState =
      lifecycleAction === "suspend" ? "Suspended" : "Active";
    const isLiveLifecycleFlow =
      hasLiveContractorDetails && isSupabaseConfigured();

    setActionError(null);
    setIsActionSaving(true);

    try {
      if (isLiveLifecycleFlow) {
        const actorUserId = adminUserId.trim();
        if (!actorUserId) {
          throw new Error(
            "Your admin session is missing a user id. Please sign in again.",
          );
        }

        const updateResult = await supabaseContractors.updateLifecycle({
          contractorId: currentContractor.id,
          action: lifecycleAction,
          actorUserId,
          reason: trimmedReason,
        });

        if (updateResult.ok === false) {
          throw new Error(updateResult.message);
        }

        const refreshedDetails = await loadLiveContractorDetails(
          currentContractor.id,
        );
        if (!refreshedDetails) {
          throw new Error("Unable to reload contractor details after saving.");
        }

        setCurrentContractor(refreshedDetails.contractor);
        setKycInitialState({
          activeCategory: "id",
          ...refreshedDetails.kycState,
        });
        setLiveRequestRows(refreshedDetails.requestRows);
        setLiveTransactions(refreshedDetails.transactions);
        setHasLiveContractorDetails(true);
      } else {
        await onStatusChange?.(currentContractor, nextStatus);

        setCurrentContractor({
          ...currentContractor,
          accountStatus: nextStatus,
          lifecycleState: nextLifecycleState,
          riskLevel:
            lifecycleAction === "suspend"
              ? "High"
              : currentContractor.riskLevel,
          riskFlags:
            lifecycleAction === "suspend"
              ? Array.from(
                  new Set([...currentContractor.riskFlags, "Suspended"]),
                )
              : currentContractor.riskFlags.filter(
                  (flag) => flag !== "Suspended",
                ),
          suspensionReason:
            lifecycleAction === "suspend" ? trimmedReason : undefined,
          restoreReason:
            lifecycleAction === "restore" ? trimmedReason : undefined,
        });
      }

      closeManageDialog();

      toast.success(
        lifecycleAction === "suspend"
          ? "Contractor suspended"
          : "Contractor restored",
        {
          description:
            lifecycleAction === "suspend"
              ? `${currentContractor.name} has been moved out of the active contractor queue.`
              : `${currentContractor.name} has been returned to the active contractor queue.`,
        },
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update account status right now.",
      );
    } finally {
      setIsActionSaving(false);
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

        {errorMessage || liveErrorMessage ? (
          <div
            role="alert"
            className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B42318]"
          >
            {liveErrorMessage ?? errorMessage}
          </div>
        ) : null}

        {isLoading || isLiveLoading ? <LoadingState /> : null}

        {!isLoading && !isLiveLoading && !currentContractor ? (
          <div className="rounded-[16px] border border-[#FECACA] bg-white px-5 py-8 shadow-sm">
            <p className="text-base font-semibold text-[#101828]">
              Contractor profile not found
            </p>
            <p className="mt-2 text-sm text-[#667085]">
              The selected contractor profile could not be loaded.
            </p>
          </div>
        ) : null}

        {!isLoading && !isLiveLoading && currentContractor ? (
          <ContractorKycProvider
            key={currentContractor.id}
            contractorId={currentContractor.id}
            initialState={kycInitialState}
          >
            <ContractorDetailsContent
              activeTab={activeTab}
              contractor={currentContractor}
              actionError={actionError}
              liveRequestRows={liveRequestRows}
              liveTransactions={liveTransactions}
              lifecycleAction={lifecycleAction}
              lifecycleReason={lifecycleReason}
              manageDialogOpen={manageDialogOpen}
              onTabChange={setActiveTab}
              onManageDialogOpenChange={(open) => {
                if (!open) {
                  closeManageDialog();
                  return;
                }

                setManageDialogOpen(true);
              }}
              onLifecycleReasonChange={(reason) => {
                setLifecycleReason(reason);
                if (actionError) {
                  setActionError(null);
                }
              }}
              onOpenManageDialog={() => setManageDialogOpen(true)}
              onConfirmLifecycleAction={handleLifecycleAction}
              isActionSaving={isActionSaving}
            />
          </ContractorKycProvider>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
