import {
  isWithinInclusiveRange,
  parseDateForFilter,
} from "../shared/filters/filter-schema";
import type { StoredRequestOps } from "./requests.store";

export type RequestFilterStatus = "Active" | "Pending" | "Completed" | "Past";
export type RequestFilterPriority = "Emergency" | "Standard";

export type RequestFilterableRow = {
  id: string;
  userName: string;
  userEmail: string;
  request: {
    location: string;
    service: string;
    date: string;
    status: string;
    requestCode: string;
    urgencyLabel: string;
  };
};

export type RequestsTableFilters = {
  query: string;
  status: RequestFilterStatus | null;
  priority: RequestFilterPriority | null;
  from: string | null;
  to: string | null;
};

export type RequestOperationalQueue =
  | "urgent"
  | "awaiting-dispatch"
  | "needs-review"
  | "delayed"
  | "active"
  | "completed"
  | "cancelled";

export type RequestOperationalBadge = {
  label: string;
  className: string;
};

export function getRequestOperationalQueue(
  request: RequestFilterableRow["request"] & {
    lifecycleStatus?: string;
    etaLabel?: string;
  },
  ops?: StoredRequestOps,
): RequestOperationalQueue {
  const status = String(request.status);
  const lifecycleStatus = request.lifecycleStatus ? String(request.lifecycleStatus) : "";
  const etaLabel = request.etaLabel ? String(request.etaLabel) : "";

  if (status === "Cancelled" || lifecycleStatus === "Cancelled") {
    return "cancelled";
  }

  if (status === "Completed" || status === "Past" || lifecycleStatus === "Completed") {
    return "completed";
  }

  if (ops?.delayedReason || etaLabel.toLowerCase().includes("delayed")) {
    return "delayed";
  }

  if (request.urgencyLabel === "Emergency" && (status === "Active" || status === "Pending")) {
    return "urgent";
  }

  if (status === "Pending") {
    return "needs-review";
  }

  if (lifecycleStatus === "Assigned" && etaLabel.toLowerCase().includes("awaiting")) {
    return "awaiting-dispatch";
  }

  return "active";
}

export function getRequestOperationalBadges(
  request: RequestFilterableRow["request"] & {
    lifecycleStatus?: string;
    etaLabel?: string;
  },
  ops?: StoredRequestOps,
): RequestOperationalBadge[] {
  const badges: RequestOperationalBadge[] = [];
  const queue = getRequestOperationalQueue(request, ops);

  if (queue === "urgent") {
    badges.push({
      label: "Urgent",
      className: "bg-[#FEE4E2] text-[#B42318]",
    });
  }

  if (queue === "delayed") {
    badges.push({
      label: "Delayed",
      className: "bg-[#FFF4DB] text-[#B7791F]",
    });
  }

  if (ops?.disputeReason) {
    badges.push({
      label: "Dispute review",
      className: "bg-[#EFF8FF] text-[#175CD3]",
    });
  }

  if (ops?.supportEscalationReason) {
    badges.push({
      label: "Escalated",
      className: "bg-[#F2F4F7] text-[#344054]",
    });
  }

  if (queue === "awaiting-dispatch") {
    badges.push({
      label: "Awaiting dispatch",
      className: "bg-[#F2F4F7] text-[#344054]",
    });
  }

  if (queue === "needs-review") {
    badges.push({
      label: "Needs review",
      className: "bg-[#F2F4F7] text-[#344054]",
    });
  }

  return badges;
}

export function filterRequestRows<T extends RequestFilterableRow>(
  rows: T[],
  filters: RequestsTableFilters,
) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const fromDate = filters.from ? parseDateForFilter(filters.from) : null;
  const toDate = filters.to ? parseDateForFilter(filters.to) : null;

  return rows.filter((row) => {
    if (filters.status && row.request.status !== filters.status) {
      return false;
    }

    if (filters.priority && row.request.urgencyLabel !== filters.priority) {
      return false;
    }

    if (fromDate || toDate) {
      const requestDate = parseDateForFilter(row.request.date);
      if (!requestDate) {
        return false;
      }

      if (!isWithinInclusiveRange(requestDate, fromDate, toDate)) {
        return false;
      }
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      row.userName,
      row.userEmail,
      row.request.location,
      row.request.service,
      row.request.date,
      row.request.status,
      row.request.requestCode,
      row.request.urgencyLabel,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
}
