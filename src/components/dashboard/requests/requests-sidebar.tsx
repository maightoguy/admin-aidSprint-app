import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Ban,
  CheckCircle2,
  Clock3,
  CircleAlert,
  MapPinned,
  PauseCircle,
  PlayCircle,
  Radio,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabaseSupport, supabaseDisputes, supabaseJobOperations } from "@/lib/supabase/data";
import { useAuthStore } from "@/auth/auth.store";
import {
  RequestsChevronDownIcon,
  RequestsCloseIcon,
  RequestsLocationIcon,
  RequestsServiceIcon,
  RequestsStarIcon,
  RequestsStepperIcon,
} from "./requests-icons";
import type { UserRequestHistoryItem } from "../user-details/user-details.types";
import {
  getRequestPanelState,
  type RequestPanelState,
  type RequestStatusAction,
  type RequestMonitoringState,
  useRequestsStore,
} from "./requests.store";

const requestStatusActions: Array<{
  action: RequestStatusAction;
  label: string;
  description: string;
}> = [
  {
    action: "Complete order",
    label: "Complete order",
    description: "Mark the request as fulfilled and paid.",
  },
  {
    action: "Pending order",
    label: "Pending order",
    description: "Pause the request while waiting for reassignment.",
  },
  {
    action: "Cancel order",
    label: "Cancel order",
    description: "Stop this request and notify the customer.",
  },
];

const requestStateCopy: Record<
  RequestPanelState,
  {
    badgeLabel: string;
    badgeClassName: string;
    stepClassName: string;
    mutedStepClassName: string;
    infoTitle: string;
    infoDescription: string;
    supportLabel: string;
    supportDescription: string;
  }
> = {
  active: {
    badgeLabel: "Live request",
    badgeClassName: "bg-[#E9F9EF] text-[#15803D]",
    stepClassName: "bg-[#22C55E]",
    mutedStepClassName: "bg-[#D1FAE5]",
    infoTitle: "Provider is on the way",
    infoDescription:
      "Live tracking is enabled and the customer can receive progress updates in real time.",
    supportLabel: "Customer assets ready",
    supportDescription:
      "Uploaded images and service notes are ready for the assigned provider.",
  },
  pending: {
    badgeLabel: "Pending review",
    badgeClassName: "bg-[#FFF4DB] text-[#B7791F]",
    stepClassName: "bg-[#F59E0B]",
    mutedStepClassName: "bg-[#FDE7B3]",
    infoTitle: "Waiting for confirmation",
    infoDescription:
      "This request is paused while the operations team reviews the next assignment step.",
    supportLabel: "Tracking on hold",
    supportDescription:
      "Open the tracker again after the provider confirms availability.",
  },
  completed: {
    badgeLabel: "Completed order",
    badgeClassName: "bg-[#E0F2FE] text-[#0369A1]",
    stepClassName: "bg-[#0284C7]",
    mutedStepClassName: "bg-[#BAE6FD]",
    infoTitle: "Order delivered successfully",
    infoDescription:
      "The job is complete and the final payment snapshot is available for review.",
    supportLabel: "Tracking snapshot available",
    supportDescription:
      "The latest route and destination details remain available in the map overlay.",
  },
  cancelled: {
    badgeLabel: "Cancelled order",
    badgeClassName: "bg-[#FEE4E2] text-[#B42318]",
    stepClassName: "bg-[#F04438]",
    mutedStepClassName: "bg-[#FECACA]",
    infoTitle: "Order has been cancelled",
    infoDescription:
      "The request is no longer active. Operations can still update the final request outcome if needed.",
    supportLabel: "Tracking unavailable",
    supportDescription:
      "Live tracking is disabled after cancellation to avoid showing stale provider movement.",
  },
};

function getStatusRowClassName(state: RequestPanelState) {
  if (state === "completed") {
    return "text-[#0369A1]";
  }

  if (state === "cancelled") {
    return "text-[#B42318]";
  }

  if (state === "pending") {
    return "text-[#B7791F]";
  }

  return "text-[#0088FF]";
}

function getStatusLabel(state: RequestPanelState) {
  if (state === "completed") {
    return "Completed";
  }

  if (state === "cancelled") {
    return "Cancelled";
  }

  if (state === "pending") {
    return "Pending";
  }

  return "Current";
}

function ReasonDialog({
  open,
  onOpenChange,
  title,
  label,
  placeholder,
  confirmLabel,
  confirmTone = "primary",
  reason,
  onReasonChange,
  onConfirm,
  isSubmitting = false,
  errorMessage = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  placeholder: string;
  confirmLabel: string;
  confirmTone?: "primary" | "danger";
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => Promise<void> | void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[90] w-[calc(100vw-32px)] max-w-[520px] rounded-[18px] p-6">
        <DialogTitle className="text-[18px] font-bold text-[#101828]">
          {title}
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-6 text-[#667085]">
          Provide a reason that can be stored for audit and backend integration.
        </DialogDescription>
        <div className="mt-5">
          <label className="text-sm font-semibold text-[#101828]">
            {label}
          </label>
          <Textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            aria-label={label}
            className="mt-2 min-h-[132px]"
            placeholder={placeholder}
          />
          {!reason.trim() ? (
            <p className="mt-2 text-xs font-medium text-[#B42318]">
              A reason is required.
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onReasonChange("");
            }}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!reason.trim() || isSubmitting}
            className={cn(
              "inline-flex items-center justify-center rounded-[10px] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
              confirmTone === "danger"
                ? "bg-[#F04438] hover:bg-[#D92D20]"
                : "bg-[#041133] hover:bg-[#0A1C4E]",
            )}
          >
            {isSubmitting ? "Saving..." : confirmLabel}
          </button>
        </div>
        {errorMessage ? (
          <p className="mt-3 text-xs font-medium text-[#B42318]">
            {errorMessage}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MonitoringStatusPill({ state }: { state: RequestMonitoringState }) {
  const label =
    state === "paused"
      ? "Paused"
      : state === "lostSignal"
        ? "Lost signal"
        : "Live";
  const className =
    state === "paused"
      ? "bg-[#FFF4DB] text-[#B7791F]"
      : state === "lostSignal"
        ? "bg-[#FEE4E2] text-[#B42318]"
        : "bg-[#E9F9EF] text-[#15803D]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        className,
      )}
    >
      {label}
    </span>
  );
}

function UploadedImageCard({
  label,
  tone,
}: UserRequestHistoryItem["uploadedImages"][number]) {
  return (
    <div
      className={[
        "flex h-[44px] w-[44px] items-end justify-start overflow-hidden rounded-[10px] border border-[#D0D5DD] p-1.5 text-[8px] font-semibold tracking-[0.02em]",
        tone === "light"
          ? "bg-[linear-gradient(180deg,#F8FAFC_0%,#E5E7EB_100%)] text-[#667085]"
          : "bg-[linear-gradient(180deg,#D6D3D1_0%,#78716C_100%)] text-white",
      ].join(" ")}
    >
      <span>{label}</span>
    </div>
  );
}

function RequestStatusSteps({ state }: { state: RequestPanelState }) {
  const stateCopy = requestStateCopy[state];
  const completedSteps =
    state === "cancelled" ? 1 : state === "pending" ? 2 : 3;

  return (
    <div className="flex items-center gap-3 pt-1" aria-hidden="true">
      {[0, 1, 2].map((step) => (
        <div key={step} className="flex flex-1 items-center gap-3">
          <span
            className={[
              "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
              step < completedSteps
                ? stateCopy.stepClassName
                : stateCopy.mutedStepClassName,
            ].join(" ")}
          >
            <RequestsStepperIcon className="h-[14px] w-[14px]" />
          </span>
          {step < 2 ? (
            <span
              className={[
                "h-[2px] flex-1 rounded-full",
                step < completedSteps - 1
                  ? stateCopy.stepClassName
                  : stateCopy.mutedStepClassName,
              ].join(" ")}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function RequestStatusMenu({
  onUpdateStatus,
  disabled = false,
  isSaving = false,
}: {
  onUpdateStatus?: (action: RequestStatusAction) => Promise<void> | void;
  disabled?: boolean;
  isSaving?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-[10px] border border-[#B1B5C0] bg-[#041133] px-4 py-[13px] text-[14px] font-medium text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/25"
          aria-label="Update request status"
          disabled={disabled || isSaving}
        >
          {isSaving ? "Updating..." : "Update status"}
          <RequestsChevronDownIcon className="h-[14px] w-[14px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        avoidCollisions={false}
        sideOffset={8}
        collisionPadding={16}
        className="z-[90] w-[260px] rounded-[14px] border border-[#EAECF0] bg-white p-2 shadow-[0_24px_40px_rgba(15,23,42,0.14)]"
      >
        {requestStatusActions.map((item) => (
          <DropdownMenuItem
            key={item.action}
            onClick={() => onUpdateStatus?.(item.action)}
            disabled={disabled || isSaving}
            className="flex items-start gap-3 rounded-[10px] px-3 py-3 text-left focus:bg-[#F8FAFC] focus:text-[#101828]"
          >
            <span className="pt-0.5 text-[#071B58]">
              {item.action === "Complete order" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : item.action === "Pending order" ? (
                <Clock3 className="h-4 w-4" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
            </span>
            <span className="space-y-1">
              <span className="block text-sm font-semibold text-[#101828]">
                {item.label}
              </span>
              <span className="block text-xs text-[#667085]">
                {item.description}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RequestsCore({
  request,
  customerName,
  onClose,
  onOpenLiveTracker,
  onUpdateStatus,
  actionsDisabled = false,
  actionsDisabledReason,
}: {
  request: UserRequestHistoryItem;
  customerName: string;
  onClose?: () => void;
  onOpenLiveTracker?: () => void;
  onUpdateStatus?: (
    action: RequestStatusAction,
    options?: { cancellationReason?: string },
  ) => Promise<void> | void;
  actionsDisabled?: boolean;
  actionsDisabledReason?: string;
}) {
  const panelState = getRequestPanelState(request);
  const stateCopy = requestStateCopy[panelState];
  const isTrackerDisabled = panelState === "cancelled" || !onOpenLiveTracker;
  const session = useAuthStore((state) => state.session);
  const ops = useRequestsStore((state) => state.requestOpsById[request.id]);
  const monitoringState = ops?.monitoringState ?? "live";
  const setMonitoringState = useRequestsStore(
    (state) => state.setMonitoringState,
  );
  const flagDelayed = useRequestsStore((state) => state.flagDelayed);
  const clearDelayed = useRequestsStore((state) => state.clearDelayed);
  const openDispute = useRequestsStore((state) => state.openDispute);
  const resolveDispute = useRequestsStore((state) => state.resolveDispute);
  const setCancellationReason = useRequestsStore(
    (state) => state.setCancellationReason,
  );

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [delayOpen, setDelayOpen] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportReason, setSupportReason] = useState("");
  const [isEscalatingSupport, setIsEscalatingSupport] = useState(false);
  const [isCreatingDispute, setIsCreatingDispute] = useState(false);
  const [statusActionError, setStatusActionError] = useState<string | null>(
    null,
  );
  const [isStatusSaving, setIsStatusSaving] = useState(false);
  const [operationHistory, setOperationHistory] = useState<any[]>([]);
  const [operationLoading, setOperationLoading] = useState(false);

  const handleStatusUpdate = async (
    action: RequestStatusAction,
    options?: { cancellationReason?: string },
  ) => {
    if (action === "Cancel order") {
      setCancelOpen(true);
      return;
    }

    setStatusActionError(null);
    setIsStatusSaving(true);

    try {
      await onUpdateStatus?.(action, options);
    } catch (error) {
      setStatusActionError(
        error instanceof Error
          ? error.message
          : "Unable to update request status right now.",
      );
    } finally {
      setIsStatusSaving(false);
    }
  };

  // Fetch operation history when sidebar opens
  useEffect(() => {
    if (!open) return;

    const fetchOperationHistory = async () => {
      setOperationLoading(true);
      try {
        const result = await supabaseJobOperations.getOperationHistory(request.id);
        if (result.ok) {
          setOperationHistory(result.data);
        } else {
          const errorMessage = "message" in result ? result.message : "Failed to fetch operation history";
          console.error("Failed to fetch operation history:", errorMessage);
          setOperationHistory([]);
        }
      } catch (error) {
        console.error("Error fetching operation history:", error);
        setOperationHistory([]);
      } finally {
        setOperationLoading(false);
      }
    };

    fetchOperationHistory();
  }, [open, request.id]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[16px] font-bold text-black">Request details</h2>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-black transition hover:bg-[#F5F5F5]"
              aria-label="Close request details"
            >
              <RequestsCloseIcon className="h-6 w-6" />
            </button>
          ) : (
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-black transition hover:bg-[#F5F5F5]"
                aria-label="Close request details"
              >
                <RequestsCloseIcon className="h-6 w-6" />
              </button>
            </DialogClose>
          )}
        </div>
        <RequestStatusSteps state={panelState} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[#6B7280] bg-[radial-gradient(circle_at_top,#B7A6B1_0%,#5B6A80_100%)] text-[12px] font-semibold text-white">
                {customerName
                  .split(" ")
                  .slice(0, 2)
                  .map((value) => value.charAt(0))
                  .join("")}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[16px] font-medium leading-[18px] text-black">
                  {customerName}
                </p>
                <span
                  className={[
                    "mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    stateCopy.badgeClassName,
                  ].join(" ")}
                >
                  {stateCopy.badgeLabel}
                </span>
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 rounded-[47px] bg-[#E9F9EF] px-[6px] py-1">
              <RequestsStepperIcon className="h-4 w-4" />
              <span className="text-[10px] font-medium text-[#22C55E]">
                {request.completedRequests}
              </span>
            </div>
          </div>
          <div className="w-full shrink-0 rounded-[10px] border border-[#F0F1F2] bg-white px-[7px] py-[7px] sm:w-auto">
            <p className="text-[10px] leading-[13px] text-[#6B7280]">
              Request ID:
            </p>
            <p className="mt-1 text-[12px] font-bold leading-[15px] text-[#6B7280]">
              {request.requestCode}
            </p>
          </div>
        </div>
        <div className="rounded-[16px] border border-[#EAECF0] bg-[#FCFCFD] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-[#071B58]">
              {panelState === "completed" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : panelState === "pending" ? (
                <Clock3 className="h-5 w-5" />
              ) : panelState === "cancelled" ? (
                <CircleAlert className="h-5 w-5" />
              ) : (
                <MapPinned className="h-5 w-5" />
              )}
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#101828]">
                {stateCopy.infoTitle}
              </p>
              <p className="text-sm leading-6 text-[#667085]">
                {stateCopy.infoDescription}
              </p>
            </div>
          </div>
        </div>
        <div className="h-px bg-[#F0F1F2]" />
        <div className="flex items-start gap-[14px]">
          <div className="flex min-w-0 flex-1 items-center gap-[10px] rounded-[10px] border border-[#B1B5C0] bg-[#E6E7EB] p-[3px]">
            <div className="flex min-w-0 flex-1 items-center justify-between rounded-[10px] bg-white px-[10px] py-1">
              <div className="inline-flex min-w-0 items-center gap-1">
                <RequestsStarIcon className="h-4 w-4 shrink-0" />
                <span className="truncate text-[12px] font-medium text-[#020715]">
                  Ratings
                </span>
              </div>
              <span className="text-[12px] font-medium text-[#020715]">
                {request.rating}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenLiveTracker}
            disabled={isTrackerDisabled}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6E7EB] transition hover:bg-[#DADDE5] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Open live tracker"
            title={
              panelState === "cancelled"
                ? "Live tracker is unavailable for cancelled requests"
                : "Open live tracker"
            }
          >
            <RequestsLocationIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="rounded-[10px] border border-[#B1B5C0] bg-[#E6E7EB] p-[3px]">
          <div className="space-y-1 rounded-[10px] bg-white p-[10px]">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1">
                <RequestsServiceIcon className="h-6 w-6" />
                <span className="text-[12px] font-medium text-[#020715]">
                  {request.service} Service
                </span>
              </div>
              <span className="text-[10px] text-[#6B7280]">
                ~{request.urgencyLabel}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[10px] border border-[#F0F1F2] px-[5px] py-[5px]">
              <span className="text-[14px] text-[#6B7280]">Total payment</span>
              <span className="text-[14px] font-medium text-black">
                {request.totalPayment}
              </span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-[12px] font-medium text-[#6B7280]">
            Live monitoring
          </p>
          <div className="mt-2 rounded-[14px] border border-[#EAECF0] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#071B58]" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#101828]">
                  Tracker status
                </p>
              </div>
              <MonitoringStatusPill state={monitoringState} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={actionsDisabled}
                onClick={() => {
                  setMonitoringState(
                    request.id,
                    monitoringState === "paused" ? "live" : "paused",
                  );
                  toast.success("Monitoring updated", {
                    description:
                      monitoringState === "paused"
                        ? "Live monitoring has been resumed."
                        : "Live monitoring has been paused.",
                  });
                }}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#D0D5DD] bg-white px-3 py-2 text-[12px] font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
                aria-label={
                  monitoringState === "paused"
                    ? "Resume tracking"
                    : "Pause tracking"
                }
                title={actionsDisabled ? actionsDisabledReason : undefined}
              >
                {monitoringState === "paused" ? (
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <PauseCircle className="h-4 w-4" aria-hidden="true" />
                )}
                {monitoringState === "paused" ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                disabled={actionsDisabled}
                onClick={() => {
                  setMonitoringState(request.id, "lostSignal");
                  toast.success("Signal updated", {
                    description:
                      "Marked as lost signal for operational follow-up.",
                  });
                }}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#F04438]/25 bg-[#FEF3F2] px-3 py-2 text-[12px] font-semibold text-[#B42318] transition hover:bg-[#FEE4E2] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Report lost signal"
                title={actionsDisabled ? actionsDisabledReason : undefined}
              >
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                Lost signal
              </button>
            </div>
          </div>
        </div>
        <div>
          <p className="text-[12px] font-medium text-[#6B7280]">
            Interventions
          </p>
          <div className="mt-2 rounded-[14px] border border-[#EAECF0] bg-white p-4">
            <div className="flex flex-wrap gap-2">
              {ops?.delayedReason ? (
                <button
                  type="button"
                  disabled={actionsDisabled}
                  onClick={async () => {
                    if (!session?.userId) {
                      toast.error("Error", {
                        description: "User session not found. Please log in again.",
                      });
                      return;
                    }

                    try {
                      const result = await supabaseJobOperations.clearFlag({
                        jobId: request.id,
                        reason: "Cleared delay flag",
                        actorUserId: session.userId,
                      });

                      if (!result.ok) {
                        const errorMessage = "message" in result ? result.message : "Failed to clear delay";
                        toast.error("Failed to clear delay", {
                          description: errorMessage,
                        });
                        return;
                      }

                      clearDelayed(request.id);
                      toast.success("Delay cleared", {
                        description: "Removed the delayed flag for this request.",
                      });
                    } catch (error) {
                      toast.error("Error clearing delay", {
                        description: error instanceof Error ? error.message : "An unexpected error occurred.",
                      });
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[#D0D5DD] bg-white px-3 py-2 text-[12px] font-semibold text-[#344054] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Clear delayed flag"
                  title={actionsDisabled ? actionsDisabledReason : undefined}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Clear delay
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionsDisabled}
                  onClick={() => setDelayOpen(true)}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[#D0D5DD] bg-white px-3 py-2 text-[12px] font-semibold text-[#344054] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Flag request as delayed"
                  title={actionsDisabled ? actionsDisabledReason : undefined}
                >
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  Flag delayed
                </button>
              )}
              {ops?.disputeReason ? (
                <button
                  type="button"
                  disabled={actionsDisabled}
                  onClick={async () => {
                    if (!session?.userId) {
                      toast.error("Error", {
                        description: "User session not found. Please log in again.",
                      });
                      return;
                    }

                    try {
                      const result = await supabaseJobOperations.clearFlag({
                        jobId: request.id,
                        reason: "Resolved dispute flag",
                        actorUserId: session.userId,
                      });

                      if (!result.ok) {
                        const errorMessage = "message" in result ? result.message : "Failed to resolve dispute";
                        toast.error("Failed to resolve dispute", {
                          description: errorMessage,
                        });
                        return;
                      }

                      resolveDispute(request.id);
                      toast.success("Dispute resolved", {
                        description: "Marked this request as dispute cleared.",
                      });
                    } catch (error) {
                      toast.error("Error resolving dispute", {
                        description: error instanceof Error ? error.message : "An unexpected error occurred.",
                      });
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[#D0D5DD] bg-white px-3 py-2 text-[12px] font-semibold text-[#344054] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Resolve dispute"
                  title={actionsDisabled ? actionsDisabledReason : undefined}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Resolve dispute
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionsDisabled}
                  onClick={() => setDisputeOpen(true)}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[#175CD3]/20 bg-[#EFF8FF] px-3 py-2 text-[12px] font-semibold text-[#175CD3] transition hover:bg-[#DDEEFE] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Open dispute review"
                  title={actionsDisabled ? actionsDisabledReason : undefined}
                >
                  <CircleAlert className="h-4 w-4" aria-hidden="true" />
                  Dispute
                </button>
              )}
              <button
                type="button"
                disabled={actionsDisabled}
                onClick={() => setSupportOpen(true)}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#D0D5DD] bg-white px-3 py-2 text-[12px] font-semibold text-[#344054] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Escalate to support"
                title={actionsDisabled ? actionsDisabledReason : undefined}
              >
                <MapPinned className="h-4 w-4" aria-hidden="true" />
                Escalate
              </button>
            </div>
            {ops?.delayedReason ? (
              <p className="mt-3 text-[12px] leading-5 text-[#667085]">
                <span className="font-semibold text-[#101828]">
                  Delay reason:
                </span>{" "}
                {ops.delayedReason}
              </p>
            ) : null}
            {ops?.disputeReason ? (
              <p className="mt-2 text-[12px] leading-5 text-[#667085]">
                <span className="font-semibold text-[#101828]">
                  Dispute note:
                </span>{" "}
                {ops.disputeReason}
              </p>
            ) : null}
            {ops?.supportEscalationReason ? (
              <p className="mt-2 text-[12px] leading-5 text-[#667085]">
                <span className="font-semibold text-[#101828]">
                  Escalation:
                </span>{" "}
                {ops.supportEscalationReason}
              </p>
            ) : null}
          </div>
          {actionsDisabledReason ? (
            <p className="mt-3 text-[12px] leading-5 text-[#98A2B3]">
              {actionsDisabledReason}
            </p>
          ) : null}
        </div>

        {/* Operation History Audit Trail */}
        {(operationHistory.length > 0 || operationLoading) && (
          <div className="border-t pt-4">
            <p className="text-[12px] font-medium text-[#6B7280]">
              Operation history
            </p>
            {operationLoading ? (
              <p className="mt-2 text-[12px] leading-5 text-[#98A2B3]">
                Loading operation history...
              </p>
            ) : operationHistory.length === 0 ? (
              <p className="mt-2 text-[12px] leading-5 text-[#98A2B3]">
                No operations recorded yet.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {operationHistory.map((op: any) => {
                  const timestamp = new Date(op.created_at);
                  const formattedTime = timestamp.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const actorId = op.actor_id?.slice(0, 8).toUpperCase() ?? "UNKNOWN";

                  return (
                    <div
                      key={op.id}
                      className="rounded-lg border border-[#EAECF0] bg-[#FAFBFC] p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-[12px] font-semibold text-[#101828]">
                            {op.operation_type.charAt(0).toUpperCase() + op.operation_type.slice(1)}
                          </p>
                          {op.reason && (
                            <p className="mt-1 text-[11px] text-[#667085]">
                              {op.reason}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] text-[#98A2B3]">
                            {formattedTime} by {actorId}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div>
          <p className="text-[12px] font-medium text-[#6B7280]">
            Additional details
          </p>
          <div className="mt-[6px] overflow-hidden rounded-[10px]">
            {[
              ["Base fee", request.baseFee],
              ["Total hours", request.totalHours],
              ["Location", request.location],
              ["Urgency", `${request.urgencyLabel}(within 60mins) + $30`],
              ["Description", request.description],
              ["Platform fee", request.platformFee],
              ["Total payment", request.totalPayment],
              ["Status", `• ${getStatusLabel(panelState)}`],
              ...(ops?.cancellationReason
                ? [["Cancellation reason", ops.cancellationReason] as const]
                : []),
            ].map(([label, value], index, rows) => (
              <div
                key={label}
                className={[
                  "flex flex-col gap-2 border border-[#F0F1F2] bg-[#FAFAFA] px-[9px] py-[13px] sm:flex-row sm:items-start sm:justify-between sm:gap-4",
                  index === rows.length - 1 ? "rounded-b-[10px]" : "",
                ].join(" ")}
              >
                <span className="text-[14px] text-[#6B7280]">{label}</span>
                <span
                  className={[
                    "max-w-full text-left text-[14px] font-medium text-black sm:max-w-[60%] sm:text-right",
                    label === "Status" ? getStatusRowClassName(panelState) : "",
                  ].join(" ")}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[12px] font-medium text-[#98A2B3]">
            Uploaded images
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {request.uploadedImages.map((image) => (
              <UploadedImageCard key={image.id} {...image} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-auto pt-6">
        <div className="mb-4 overflow-hidden rounded-[16px] border border-[#EAECF0] bg-white">
          {[
            {
              label: stateCopy.supportLabel,
              value: stateCopy.supportDescription,
            },
            {
              label: "Customer note",
              value: request.description,
            },
          ].map((item, index) => (
            <div key={`${item.label}-${index}`}>
              <div className="px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#475467]">
                  {item.value}
                </p>
              </div>
              {index === 0 ? <div className="h-px bg-[#F0F1F2]" /> : null}
            </div>
          ))}
        </div>
        <RequestStatusMenu
          onUpdateStatus={handleStatusUpdate}
          disabled={actionsDisabled}
          isSaving={isStatusSaving}
        />
        {actionsDisabledReason ? (
          <p className="mt-3 text-xs font-medium text-[#98A2B3]">
            {actionsDisabledReason}
          </p>
        ) : null}
        {statusActionError ? (
          <p className="mt-3 text-xs font-medium text-[#B42318]">
            {statusActionError}
          </p>
        ) : null}
      </div>

      <ReasonDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) setCancelReason("");
        }}
        title="Cancel request"
        label="Cancellation reason"
        placeholder="Explain why this request is being cancelled"
        confirmLabel="Confirm cancellation"
        confirmTone="danger"
        reason={cancelReason}
        onReasonChange={setCancelReason}
        isSubmitting={isStatusSaving}
        errorMessage={statusActionError}
        onConfirm={async () => {
          setStatusActionError(null);
          setIsStatusSaving(true);

          try {
            await onUpdateStatus?.("Cancel order", {
              cancellationReason: cancelReason,
            });
            setCancellationReason(request.id, cancelReason);
            toast.success("Request cancelled", {
              description: "The request has been cancelled and recorded.",
            });
            setCancelOpen(false);
            setCancelReason("");
          } catch (error) {
            setStatusActionError(
              error instanceof Error
                ? error.message
                : "Unable to cancel this request right now.",
            );
          } finally {
            setIsStatusSaving(false);
          }
        }}
      />
      <ReasonDialog
        open={delayOpen}
        onOpenChange={(open) => {
          setDelayOpen(open);
          if (!open) setDelayReason("");
        }}
        title="Flag request as delayed"
        label="Delay reason"
        placeholder="Describe what caused the delay and what operations should do next"
        confirmLabel="Confirm delay flag"
        reason={delayReason}
        onReasonChange={setDelayReason}
        isSubmitting={false}
        onConfirm={async () => {
          if (!delayReason.trim()) return;
          if (!session?.userId) {
            toast.error("Error", {
              description: "User session not found. Please log in again.",
            });
            return;
          }

          try {
            const result = await supabaseJobOperations.flagDelay({
              jobId: request.id,
              reason: delayReason.trim(),
              actorUserId: session.userId,
            });

            if (!result.ok) {
              const errorMessage = "message" in result ? result.message : "Failed to flag delay";
              toast.error("Failed to flag delay", {
                description: errorMessage,
              });
              return;
            }

            // Also update the local store for UI consistency
            flagDelayed(request.id, delayReason);

            toast.success("Delay flagged", {
              description: "This request has been flagged as delayed.",
            });
            setDelayOpen(false);
            setDelayReason("");
          } catch (error) {
            toast.error("Error flagging delay", {
              description: error instanceof Error ? error.message : "An unexpected error occurred.",
            });
          }
        }}
      />
      <ReasonDialog
        open={disputeOpen}
        onOpenChange={(open) => {
          setDisputeOpen(open);
          if (!open) setDisputeReason("");
        }}
        title="Open dispute review"
        label="Dispute note"
        placeholder="Capture the dispute trigger and what evidence is expected"
        confirmLabel="Open dispute"
        reason={disputeReason}
        onReasonChange={setDisputeReason}
        isSubmitting={isCreatingDispute}
        onConfirm={async () => {
          if (!disputeReason.trim()) return;
          if (!session?.userId) {
            toast.error("Error", {
              description: "User session not found. Please log in again.",
            });
            return;
          }

          setIsCreatingDispute(true);
          try {
            // Log dispute flag to job_operations_log
            const jobOpResult = await supabaseJobOperations.flagDispute({
              jobId: request.id,
              reason: disputeReason.trim(),
              actorUserId: session.userId,
            });

            if (!jobOpResult.ok) {
              const errorMessage = "message" in jobOpResult ? jobOpResult.message : "Failed to flag dispute";
              toast.error("Failed to flag dispute", {
                description: errorMessage,
              });
              return;
            }

            // Create formal dispute record
            const result = await supabaseDisputes.createDisputeFromRequest({
              requestId: request.id,
              adminUserId: session.userId,
              disputeReason: disputeReason.trim(),
            });

            if (!result.ok) {
              const errorMessage = "message" in result ? result.message : "Failed to open dispute.";
              toast.error("Failed to open dispute", {
                description: errorMessage,
              });
              return;
            }

            // Also update the local store for UI consistency
            openDispute(request.id, disputeReason);

            toast.success("Dispute opened", {
              description: "This request is now marked for dispute review.",
            });
            setDisputeOpen(false);
            setDisputeReason("");
          } finally {
            setIsCreatingDispute(false);
          }
        }}
      />
      <ReasonDialog
        open={supportOpen}
        onOpenChange={(open) => {
          setSupportOpen(open);
          if (!open) setSupportReason("");
        }}
        title="Escalate to support"
        label="Escalation reason"
        placeholder="Describe why support intervention is required"
        confirmLabel="Escalate"
        reason={supportReason}
        onReasonChange={setSupportReason}
        isSubmitting={isEscalatingSupport}
        onConfirm={async () => {
          if (!session?.userId) {
            toast.error("Error", {
              description: "User session not found. Please log in again.",
            });
            return;
          }

          setIsEscalatingSupport(true);
          try {
            // Log escalation to job_operations_log
            const jobOpResult = await supabaseJobOperations.flagEscalation({
              jobId: request.id,
              reason: supportReason || "Support escalation required",
              actorUserId: session.userId,
            });

            if (!jobOpResult.ok) {
              const errorMessage = "message" in jobOpResult ? jobOpResult.message : "Failed to flag escalation";
              toast.error("Failed to flag escalation", {
                description: errorMessage,
              });
              return;
            }

            // Create support ticket
            const result = await supabaseSupport.createSupportTicket({
              requestId: request.id,
              requesterUserId: session.userId,
              requesterRole: "contractor",
              escalationReason: supportReason,
            });

            if (!result.ok) {
              const errorMessage = "message" in result ? result.message : "Failed to escalate to support.";
              toast.error("Escalation failed", {
                description: errorMessage,
              });
              return;
            }

            toast.success("Escalated to support", {
              description: "A support ticket has been created for this issue.",
            });
            setSupportOpen(false);
            setSupportReason("");
          } catch (error) {
            toast.error("Error", {
              description:
                error instanceof Error ? error.message : "Failed to escalate to support.",
            });
          } finally {
            setIsEscalatingSupport(false);
          }
        }}
      />
    </div>
  );
}

export function RequestsSidebar({
  open,
  request,
  customerName,
  onOpenChange,
  onOpenLiveTracker,
  onUpdateStatus,
  actionsDisabled = false,
  actionsDisabledReason,
}: {
  open: boolean;
  request: UserRequestHistoryItem | null;
  customerName: string;
  onOpenChange: (open: boolean) => void;
  onOpenLiveTracker?: () => void;
  onUpdateStatus?: (
    action: RequestStatusAction,
    options?: { cancellationReason?: string },
  ) => Promise<void> | void;
  actionsDisabled?: boolean;
  actionsDisabledReason?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inset-x-0 bottom-0 top-auto z-[60] grid h-[92dvh] max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-t-[28px] rounded-b-none border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] duration-300 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:inset-x-auto sm:left-auto sm:right-0 sm:top-0 sm:h-screen sm:max-h-screen sm:w-[523px] sm:rounded-none sm:rounded-l-[10px] sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right [&>button]:hidden">
        <DialogTitle className="sr-only">Request details</DialogTitle>
        <DialogDescription className="sr-only">
          Request details panel with status actions and live tracker access.
        </DialogDescription>
        <div className="h-full overflow-y-auto overscroll-contain px-[14px] pb-[max(14px,env(safe-area-inset-bottom))] pt-[18px] sm:px-[14px] sm:pb-[14px]">
          {request ? (
            <RequestsCore
              request={request}
              customerName={customerName}
              onOpenLiveTracker={onOpenLiveTracker}
              onUpdateStatus={onUpdateStatus}
              actionsDisabled={actionsDisabled}
              actionsDisabledReason={actionsDisabledReason}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm font-medium text-[#667085]">
                Request details are unavailable.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
