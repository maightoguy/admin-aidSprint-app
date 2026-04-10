import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";
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
}: {
  onUpdateStatus?: (action: RequestStatusAction) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-[10px] border border-[#B1B5C0] bg-[#041133] px-4 py-[13px] text-[14px] font-medium text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/25"
          aria-label="Update request status"
        >
          Update status
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
}: {
  request: UserRequestHistoryItem;
  customerName: string;
  onClose?: () => void;
  onOpenLiveTracker?: () => void;
  onUpdateStatus?: (action: RequestStatusAction) => void;
}) {
  const panelState = getRequestPanelState(request);
  const stateCopy = requestStateCopy[panelState];
  const isTrackerDisabled = panelState === "cancelled" || !onOpenLiveTracker;

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
        <RequestStatusMenu onUpdateStatus={onUpdateStatus} />
      </div>
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
}: {
  open: boolean;
  request: UserRequestHistoryItem | null;
  customerName: string;
  onOpenChange: (open: boolean) => void;
  onOpenLiveTracker?: () => void;
  onUpdateStatus?: (action: RequestStatusAction) => void;
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
