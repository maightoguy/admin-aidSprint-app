import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  X,
  FileText,
  ChevronDown,
  CheckCircle2,
  ShieldAlert,
  CircleAlert,
  Gavel,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import type {
  DisputeActionLogEntry,
  DisputeLifecycleState,
  DisputeRecord,
  DisputeResolutionType,
} from "./disputes.types";
import {
  getDisputeReasonLabel,
  getDisputeStatusPillClassName,
} from "./disputes.utils";

type DisputeSidebarAction =
  | "requestEvidence"
  | "proposeResolution"
  | "resolve"
  | "reject"
  | null;

type DisputeActionRequest = {
  action: Exclude<DisputeSidebarAction, null>;
  reason: string;
  message?: string;
  resolutionType?: DisputeResolutionType;
};

const resolutionOptions: Array<{
  value: DisputeResolutionType;
  label: string;
}> = [
  { value: "RefundCustomer", label: "Refund customer" },
  { value: "ReversePayout", label: "Reverse payout" },
  { value: "PartialRefund", label: "Partial refund" },
  { value: "NoAction", label: "No action" },
  { value: "BanContractor", label: "Ban contractor" },
  { value: "WarnContractor", label: "Warn contractor" },
];

function nextLogEntry(
  summary: string,
  actor: string = "Ops Admin",
): DisputeActionLogEntry {
  return {
    id: `log-${Math.random().toString(16).slice(2, 9)}`,
    createdAtLabel: new Date().toLocaleString(),
    actor,
    summary,
  };
}

function getLifecycleLabel(state: DisputeLifecycleState) {
  if (state === "Opened") return "Opened";
  if (state === "UnderReview") return "Under review";
  if (state === "EvidenceRequested") return "Evidence requested";
  if (state === "ProposedResolution") return "Proposed resolution";
  if (state === "Resolved") return "Resolved";
  return "Rejected";
}

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EAECF0] px-[10px] py-[11px] last:border-b-0">
      <span className="text-[14px] font-normal leading-5 text-[#98A2B3]">
        {label}
      </span>
      <span
        className={cn(
          "text-right text-[14px] font-semibold leading-5 text-[#2D2D2D]",
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ActionReasonDialog({
  open,
  title,
  label,
  placeholder,
  confirmLabel,
  confirmTone,
  reason,
  isSubmitting,
  onReasonChange,
  onConfirm,
  onOpenChange,
  children,
}: {
  open: boolean;
  title: string;
  label: string;
  placeholder: string;
  confirmLabel: string;
  confirmTone: "danger" | "primary";
  reason: string;
  isSubmitting?: boolean;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const canConfirm = Boolean(reason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[120] w-[calc(100vw-32px)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-[#EAECF0] bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] outline-none">
        <div className="px-6 py-6">
          <DialogTitle className="text-xl font-bold text-[#101828]">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[#667085]">
            Capture a reason so this action can be audited later.
          </DialogDescription>

          {children ? <div className="mt-5">{children}</div> : null}

          <div className="mt-5">
            <label className="block text-sm font-semibold text-[#344054]">
              {label}
            </label>
            <Textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              className="mt-2 min-h-[132px]"
              aria-label={label}
              placeholder={placeholder}
            />
            {!canConfirm ? (
              <p className="mt-2 text-xs font-medium text-[#B42318]">
                A reason is required.
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canConfirm || isSubmitting}
              onClick={onConfirm}
              className={cn(
                "inline-flex items-center justify-center rounded-[10px] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
                confirmTone === "danger"
                  ? "bg-[#F04438] hover:bg-[#D92D20]"
                  : "bg-[#071B58] hover:bg-[#0C2877]",
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </DialogPrimitive.Content>
    </Dialog>
  );
}

function ResolutionSelector({
  value,
  onChange,
}: {
  value: DisputeResolutionType;
  onChange: (value: DisputeResolutionType) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#344054]">Resolution type</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {resolutionOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-11 rounded-[10px] border px-3 text-sm font-semibold transition",
              value === option.value
                ? "border-[#071B58] bg-white text-[#101828]"
                : "border-[#EAECF0] bg-[#FCFCFD] text-[#667085] hover:bg-[#F8FAFC]",
            )}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DisputeDetailsSidebar({
  open,
  onOpenChange,
  dispute,
  initialAction,
  onConsumeInitialAction,
  onUpdateDispute,
  onApplyAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispute: DisputeRecord | null;
  initialAction: DisputeSidebarAction;
  onConsumeInitialAction: () => void;
  onUpdateDispute: (updated: DisputeRecord) => void;
  onApplyAction?: (request: DisputeActionRequest) => Promise<
    | {
        ok: true;
      }
    | {
        ok: false;
        message: string;
      }
  >;
}) {
  const [activeSection, setActiveSection] = React.useState<
    "overview" | "evidence" | "timeline"
  >("overview");
  const [action, setAction] = React.useState<DisputeSidebarAction>(null);
  const [reason, setReason] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [resolutionType, setResolutionType] =
    React.useState<DisputeResolutionType>("RefundCustomer");
  const [isApplyingAction, setIsApplyingAction] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setActiveSection("overview");
      setAction(null);
      setReason("");
      setMessage("");
      setResolutionType("RefundCustomer");
      setIsApplyingAction(false);
      return;
    }
    if (initialAction) {
      setAction(initialAction);
      onConsumeInitialAction();
    }
  }, [initialAction, onConsumeInitialAction, open]);

  if (!dispute) return null;

  const applyUpdate = (patch: Partial<DisputeRecord>, logSummary: string) => {
    const updated: DisputeRecord = {
      ...dispute,
      ...patch,
      updatedAtLabel: new Date().toLocaleDateString(),
      lastUpdatedBy: "Ops Admin",
      actionLog: [nextLogEntry(logSummary), ...dispute.actionLog],
    };
    onUpdateDispute(updated);
  };

  const openAction = (next: Exclude<DisputeSidebarAction, null>) => {
    setAction(next);
    setReason("");
    setMessage("");
    setResolutionType(dispute.proposedResolutionType ?? "RefundCustomer");
  };

  const closeAction = () => {
    if (isApplyingAction) {
      return;
    }
    setAction(null);
    setReason("");
    setMessage("");
  };

  const applyActionUpdate = async (
    request: DisputeActionRequest,
    patch: Partial<DisputeRecord>,
    logSummary: string,
    successTitle: string,
    successDescription: string,
  ) => {
    if (isApplyingAction) {
      return;
    }

    if (onApplyAction) {
      setIsApplyingAction(true);
      const result = await onApplyAction(request);
      setIsApplyingAction(false);

      if (result.ok === false) {
        toast.error(successTitle, {
          description: result.message,
        });
        return;
      }
    } else {
      applyUpdate(patch, logSummary);
    }

    toast.success(successTitle, {
      description: successDescription,
    });
    closeAction();
  };

  const canModify =
    dispute.lifecycleState !== "Resolved" &&
    dispute.lifecycleState !== "Rejected";

  const statusBadge = (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-[12px] font-semibold",
        getDisputeStatusPillClassName(dispute.lifecycleState),
      )}
    >
      {getLifecycleLabel(dispute.lifecycleState)}
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[60] bg-[rgba(15,23,42,0.16)] backdrop-blur-[4px]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 right-0 z-[70] h-full w-full bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] outline-none duration-300 sm:w-[420px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          )}
        >
          <div className="flex h-full flex-col overflow-y-auto px-3 pb-3 pt-[14px]">
            <div className="flex items-center justify-between gap-4 px-[2px]">
              <div className="min-w-0">
                <DialogTitle className="text-[16px] font-bold leading-6 text-[#101828]">
                  Dispute details
                </DialogTitle>
                <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#98A2B3]">
                  <span className="text-[#667085]">{dispute.disputeCode}</span>
                  {statusBadge}
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#101828] transition hover:bg-[#F2F4F7]"
                aria-label="Close dispute details"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="mt-4 rounded-[14px] border border-[#EAECF0] bg-[#FCFCFD] px-4 py-3">
              <p className="text-sm font-semibold text-[#101828]">
                {dispute.title}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-[#667085]">
                <span className="rounded-full bg-white px-3 py-1">
                  {getDisputeReasonLabel(dispute.reason)}
                </span>
                <span className="rounded-full bg-white px-3 py-1">
                  Priority {dispute.priority}
                </span>
                <span className="rounded-full bg-white px-3 py-1">
                  Payout impact {dispute.payoutImpact ? "Yes" : "No"}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-[12px] border border-[#EAECF0] bg-white p-2">
              {(
                [
                  { key: "overview", label: "Overview" },
                  { key: "evidence", label: "Evidence" },
                  { key: "timeline", label: "Timeline" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveSection(tab.key)}
                  className={cn(
                    "h-10 rounded-[10px] text-sm font-semibold transition",
                    activeSection === tab.key
                      ? "bg-[#F2F4F7] text-[#101828]"
                      : "text-[#98A2B3] hover:bg-[#F8FAFC] hover:text-[#344054]",
                  )}
                  aria-pressed={activeSection === tab.key}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeSection === "overview" ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD]">
                  <DetailRow label="Dispute ID" value={dispute.disputeId} />
                  <DetailRow label="Request code" value={dispute.requestCode} />
                  <DetailRow label="Service" value={dispute.service} />
                  <DetailRow label="Location" value={dispute.location} />
                  <DetailRow label="Created" value={dispute.createdAtLabel} />
                  <DetailRow
                    label="Last update"
                    value={dispute.updatedAtLabel}
                  />
                </div>

                <div className="rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD]">
                  <DetailRow label="Customer" value={dispute.customerName} />
                  <DetailRow
                    label="Contractor"
                    value={dispute.contractorName}
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-[#EAECF0] px-[10px] py-[11px]">
                    <Link
                      to={`/users/${dispute.customerId}`}
                      className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#EAECF0] px-3 text-xs font-semibold text-[#344054] transition hover:bg-[#F9FAFB]"
                    >
                      View customer
                    </Link>
                    <Link
                      to={`/contractors/${dispute.contractorId}`}
                      className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#EAECF0] px-3 text-xs font-semibold text-[#344054] transition hover:bg-[#F9FAFB]"
                    >
                      View contractor
                    </Link>
                  </div>
                </div>

                <div className="rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD]">
                  <DetailRow
                    label="Charge amount"
                    value={`₦${dispute.chargeAmount.toLocaleString("en-US")}`}
                  />
                  <DetailRow
                    label="Payout amount"
                    value={`₦${dispute.payoutAmount.toLocaleString("en-US")}`}
                  />
                  <DetailRow
                    label="Payout status"
                    value={dispute.payoutStatus}
                  />
                  {dispute.proposedResolutionType ? (
                    <DetailRow
                      label="Proposed resolution"
                      value={dispute.proposedResolutionType}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeSection === "evidence" ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[10px] border border-[#EAECF0] bg-white p-4">
                  <p className="text-xs font-semibold text-[#101828]">
                    Attachments
                  </p>
                  {dispute.attachments.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {dispute.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-3 rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD] px-3 py-3 transition hover:bg-[#F8FAFC]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-[#98A2B3]">
                              <FileText className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#101828]">
                                {att.label}
                              </p>
                              <p className="mt-1 text-xs text-[#98A2B3]">
                                {att.type}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-[#175CD3]">
                            View
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#98A2B3]">
                      No attachments have been submitted yet.
                    </p>
                  )}
                </div>

                <div className="rounded-[10px] border border-[#EAECF0] bg-white p-4">
                  <p className="text-xs font-semibold text-[#101828]">
                    Admin notes
                  </p>
                  {dispute.notes.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {dispute.notes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-[12px] border border-[#EAECF0] bg-[#FCFCFD] px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#667085]">
                            <span>{note.createdBy}</span>
                            <span className="text-[#98A2B3]">
                              {note.createdAtLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[#101828]">
                            {note.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#98A2B3]">
                      No admin notes yet.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {activeSection === "timeline" ? (
              <div className="mt-4 space-y-3">
                {dispute.actionLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[14px] border border-[#EAECF0] bg-[#FCFCFD] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#667085]">
                      <span>{entry.actor}</span>
                      <span className="text-[#98A2B3]">
                        {entry.createdAtLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#101828]">
                      {entry.summary}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-auto pt-5">
              <div className="grid gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={!canModify}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-[10px] border border-[#B1B5C0] bg-[#041133] px-4 py-[13px] text-[14px] font-medium text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/25 disabled:cursor-not-allowed disabled:opacity-70"
                      aria-label="Open dispute actions"
                    >
                      Dispute actions
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    side="top"
                    avoidCollisions={false}
                    sideOffset={8}
                    collisionPadding={16}
                    className="z-[90] w-[360px] max-w-[calc(100vw-40px)] rounded-[14px] border border-[#EAECF0] bg-white p-2 shadow-[0_24px_40px_rgba(15,23,42,0.14)]"
                  >
                    <DropdownMenuItem
                      onClick={() => openAction("requestEvidence")}
                      className="rounded-[10px] px-4 py-3 text-[14px] font-medium outline-none transition focus:bg-[#F8FAFC]"
                    >
                      <div className="flex items-center gap-2">
                        <CircleAlert className="h-4 w-4 text-[#175CD3]" />
                        Request evidence
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openAction("proposeResolution")}
                      className="rounded-[10px] px-4 py-3 text-[14px] font-medium outline-none transition focus:bg-[#F8FAFC]"
                    >
                      <div className="flex items-center gap-2">
                        <Gavel className="h-4 w-4 text-[#175CD3]" />
                        Propose resolution
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openAction("resolve")}
                      className="rounded-[10px] px-4 py-3 text-[14px] font-medium outline-none transition focus:bg-[#F8FAFC]"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
                        Mark resolved
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openAction("reject")}
                      className="rounded-[10px] px-4 py-3 text-[14px] font-medium outline-none transition focus:bg-[#F8FAFC]"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-[#B42318]" />
                        Reject dispute
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <ActionReasonDialog
            open={action === "requestEvidence"}
            onOpenChange={(open) =>
              open ? setAction("requestEvidence") : closeAction()
            }
            title="Request evidence"
            label="Evidence request reason"
            placeholder="Explain what evidence is missing and what to request"
            confirmLabel="Send request"
            confirmTone="primary"
            reason={reason}
            isSubmitting={isApplyingAction}
            onReasonChange={setReason}
            onConfirm={async () => {
              if (!reason.trim()) return;
              await applyActionUpdate(
                {
                  action: "requestEvidence",
                  reason: reason.trim(),
                  message: message.trim() || undefined,
                },
                {
                  lifecycleState: "EvidenceRequested",
                },
                `Evidence requested. ${reason.trim()}`,
                "Evidence requested",
                "Evidence request has been logged for audit.",
              );
            }}
          >
            <div>
              <p className="text-sm font-semibold text-[#344054]">
                Message template (optional)
              </p>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-2 min-h-[92px]"
                aria-label="Evidence request message"
                placeholder="Add a note that will be sent to the customer/contractor"
              />
            </div>
          </ActionReasonDialog>

          <ActionReasonDialog
            open={action === "proposeResolution"}
            onOpenChange={(open) =>
              open ? setAction("proposeResolution") : closeAction()
            }
            title="Propose resolution"
            label="Proposal reason"
            placeholder="Explain why this resolution is appropriate"
            confirmLabel="Confirm proposal"
            confirmTone="primary"
            reason={reason}
            isSubmitting={isApplyingAction}
            onReasonChange={setReason}
            onConfirm={async () => {
              if (!reason.trim()) return;
              await applyActionUpdate(
                {
                  action: "proposeResolution",
                  reason: reason.trim(),
                  resolutionType,
                },
                {
                  lifecycleState: "ProposedResolution",
                  proposedResolutionType: resolutionType,
                },
                `Proposed resolution: ${resolutionType}. ${reason.trim()}`,
                "Resolution proposed",
                "Proposal recorded and ready for next steps.",
              );
            }}
          >
            <ResolutionSelector
              value={resolutionType}
              onChange={setResolutionType}
            />
          </ActionReasonDialog>

          <ActionReasonDialog
            open={action === "resolve"}
            onOpenChange={(open) =>
              open ? setAction("resolve") : closeAction()
            }
            title="Resolve dispute"
            label="Resolution reason"
            placeholder="Describe what was decided and why"
            confirmLabel="Confirm resolution"
            confirmTone="primary"
            reason={reason}
            isSubmitting={isApplyingAction}
            onReasonChange={setReason}
            onConfirm={async () => {
              if (!reason.trim()) return;
              await applyActionUpdate(
                {
                  action: "resolve",
                  reason: reason.trim(),
                  resolutionType,
                },
                {
                  lifecycleState: "Resolved",
                  proposedResolutionType: resolutionType,
                },
                `Resolved with ${resolutionType}. ${reason.trim()}`,
                "Dispute resolved",
                "Resolution recorded for audit.",
              );
            }}
          >
            <ResolutionSelector
              value={resolutionType}
              onChange={setResolutionType}
            />
          </ActionReasonDialog>

          <ActionReasonDialog
            open={action === "reject"}
            onOpenChange={(open) =>
              open ? setAction("reject") : closeAction()
            }
            title="Reject dispute"
            label="Rejection reason"
            placeholder="Explain why this dispute is rejected"
            confirmLabel="Confirm rejection"
            confirmTone="danger"
            reason={reason}
            isSubmitting={isApplyingAction}
            onReasonChange={setReason}
            onConfirm={async () => {
              if (!reason.trim()) return;
              await applyActionUpdate(
                {
                  action: "reject",
                  reason: reason.trim(),
                },
                {
                  lifecycleState: "Rejected",
                },
                `Rejected. ${reason.trim()}`,
                "Dispute rejected",
                "Rejection recorded for audit.",
              );
            }}
          />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
