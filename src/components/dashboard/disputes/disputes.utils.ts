import type {
  DisputeLifecycleState,
  DisputePriority,
  DisputeReason,
  DisputeRecord,
} from "./disputes.types";

function parseDateLabel(label: string) {
  const parsed = new Date(label);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isWithinInclusiveRange(
  date: Date,
  from: Date | null,
  to: Date | null,
) {
  const time = date.getTime();
  const fromTime = from ? from.getTime() : null;
  const toTime = to ? to.getTime() : null;

  if (fromTime !== null && time < fromTime) return false;
  if (toTime !== null && time > toTime) return false;
  return true;
}

export type DisputesFilterState = {
  query: string;
  lifecycleState: DisputeLifecycleState | null;
  reason: DisputeReason | null;
  priority: DisputePriority | null;
  payoutImpact: "Yes" | "No" | null;
  from: string | null;
  to: string | null;
};

export function filterDisputes(
  disputes: DisputeRecord[],
  filters: DisputesFilterState,
) {
  const query = filters.query.trim().toLowerCase();
  const fromDate =
    typeof filters.from === "string" && filters.from
      ? parseDateLabel(filters.from)
      : null;
  const toDate =
    typeof filters.to === "string" && filters.to ? parseDateLabel(filters.to) : null;

  return disputes.filter((dispute) => {
    if (filters.lifecycleState && dispute.lifecycleState !== filters.lifecycleState) {
      return false;
    }

    if (filters.reason && dispute.reason !== filters.reason) {
      return false;
    }

    if (filters.priority && dispute.priority !== filters.priority) {
      return false;
    }

    if (filters.payoutImpact) {
      const expected = filters.payoutImpact === "Yes";
      if (dispute.payoutImpact !== expected) {
        return false;
      }
    }

    if (fromDate || toDate) {
      const created = parseDateLabel(dispute.createdAtLabel);
      if (!created) {
        return false;
      }
      if (!isWithinInclusiveRange(created, fromDate, toDate)) {
        return false;
      }
    }

    if (!query) {
      return true;
    }

    const haystack = [
      dispute.disputeId,
      dispute.disputeCode,
      dispute.title,
      dispute.requestId,
      dispute.requestCode,
      dispute.service,
      dispute.location,
      dispute.customerName,
      dispute.contractorName,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function getDisputeStatusPillClassName(
  state: DisputeLifecycleState,
) {
  if (state === "Opened") {
    return "bg-[#FFF7ED] text-[#F79009]";
  }

  if (state === "UnderReview" || state === "EvidenceRequested" || state === "ProposedResolution") {
    return "bg-[#EFF8FF] text-[#175CD3]";
  }

  if (state === "Resolved") {
    return "bg-[#ECFDF3] text-[#15803D]";
  }

  return "bg-[#FEF3F2] text-[#B42318]";
}

export function getDisputeReasonLabel(reason: DisputeReason) {
  if (reason === "ServiceQuality") return "Service quality";
  if (reason === "NoShow") return "No-show";
  return reason.replace(/([A-Z])/g, " $1").trim();
}

