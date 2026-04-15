import {
  isWithinInclusiveRange,
  parseDateForFilter,
} from "../shared/filters/filter-schema";

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
