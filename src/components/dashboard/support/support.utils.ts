import type {
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
} from "./support.data";
import {
  isWithinInclusiveRange,
  parseDateForFilter,
} from "../shared/filters/filter-schema";

export type SupportTableFilters = {
  query: string;
  status: SupportTicketStatus | null;
  priority: SupportTicketPriority | null;
  from: string | null;
  to: string | null;
};

export function filterSupportTickets(
  tickets: SupportTicket[],
  filters: SupportTableFilters,
) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const fromDate = filters.from ? parseDateForFilter(filters.from) : null;
  const toDate = filters.to ? parseDateForFilter(filters.to) : null;

  return tickets.filter((ticket) => {
    if (filters.status && ticket.status !== filters.status) {
      return false;
    }

    if (filters.priority && ticket.priority !== filters.priority) {
      return false;
    }

    if (fromDate || toDate) {
      const createdDate = parseDateForFilter(ticket.dateCreated);
      if (!createdDate) {
        return false;
      }

      if (!isWithinInclusiveRange(createdDate, fromDate, toDate)) {
        return false;
      }
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      ticket.ticketId,
      ticket.userName,
      ticket.userEmail,
      ticket.category,
      ticket.subject,
      ticket.status,
      ticket.priority,
      ticket.dateCreated,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
}
