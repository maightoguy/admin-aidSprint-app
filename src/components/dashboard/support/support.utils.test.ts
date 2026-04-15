import { describe, expect, it } from "vitest";
import { filterSupportTickets } from "./support.utils";
import type { SupportTicket } from "./support.data";

function createTicket(overrides: Partial<SupportTicket> = {}): SupportTicket {
  return {
    id: "ticket-1",
    ticketId: "#12345",
    userId: "user-1",
    userName: "Emery Torff",
    userEmail: "emery@example.com",
    category: "Withdrawal",
    subject: "Withdrawal delay",
    description: "Test description",
    status: "Open",
    priority: "High",
    dateCreated: "Apr 12, 2023",
    updatedAt: "Apr 12, 2023",
    attachments: [],
    ...overrides,
  };
}

describe("filterSupportTickets", () => {
  it("applies search, status, priority, and date range filters", () => {
    const tickets = [
      createTicket(),
      createTicket({
        id: "ticket-2",
        ticketId: "#12346",
        userName: "Maren Dokidis",
        userEmail: "maren@example.com",
        subject: "Payment failed",
        status: "Pending",
        priority: "Urgent",
        dateCreated: "Jun 20, 2023",
      }),
      createTicket({
        id: "ticket-3",
        ticketId: "#12347",
        userName: "Cooper Siphron",
        userEmail: "cooper@example.com",
        subject: "Account issue",
        status: "Resolved",
        priority: "Low",
        dateCreated: "Jul 04, 2023",
      }),
    ];

    const results = filterSupportTickets(tickets, {
      query: "maren",
      status: "Pending",
      priority: "Urgent",
      from: "2023-06-01",
      to: "2023-06-30",
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("ticket-2");
  });
});
