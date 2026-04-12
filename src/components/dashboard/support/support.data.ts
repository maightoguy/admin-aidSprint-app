import { ContractorRecord } from "../contractors/contractors.types";

export type SupportTicketStatus = "Open" | "Pending" | "Resolved";
export type SupportTicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type SupportTicketAttachment = {
  id: string;
  url: string;
  name: string;
  type: string;
};

export type SupportTicket = {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  dateCreated: string;
  updatedAt: string;
  requestId?: string;
  attachments: SupportTicketAttachment[];
};

export const supportTicketSeeds: SupportTicket[] = [
  {
    id: "ticket-1",
    ticketId: "#12345",
    userId: "emery-torff",
    userName: "Emery Torff",
    userEmail: "thekdfisher@email.com",
    category: "Withdrawal",
    subject: "Withdrawal delay",
    description: "I have been waiting for my withdrawal for over 48 hours now.",
    status: "Open",
    priority: "High",
    dateCreated: "Apr 12, 2023",
    updatedAt: "Apr 12, 2023",
    requestId: "RE123456",
    attachments: [
      { id: "att-1", url: "/placeholder.svg", name: "receipt.png", type: "image/png" },
      { id: "att-2", url: "/placeholder.svg", name: "statement.pdf", type: "application/pdf" }
    ]
  },
  {
    id: "ticket-2",
    ticketId: "#12345",
    userId: "maren-dokidis",
    userName: "Maren Dokidis",
    userEmail: "thekdfisher@email.com",
    category: "Service payment",
    subject: "Wrong service provider",
    description: "The service provider assigned was not what I requested.",
    status: "Pending",
    priority: "Medium",
    dateCreated: "Apr 12, 2023",
    updatedAt: "Apr 12, 2023",
    requestId: "RE123456",
    attachments: []
  },
  {
    id: "ticket-3",
    ticketId: "#12345",
    userId: "cooper-siphron",
    userName: "Cooper Siphron",
    userEmail: "thekdfisher@email.com",
    category: "Withdrawal",
    subject: "Account verification issue",
    description: "My account verification is still pending after 3 days.",
    status: "Resolved",
    priority: "Low",
    dateCreated: "Apr 12, 2023",
    updatedAt: "Apr 13, 2023",
    attachments: []
  },
  {
    id: "ticket-4",
    ticketId: "#12345",
    userId: "marcus-dias",
    userName: "Marcus Dias",
    userEmail: "thekdfisher@email.com",
    category: "Service payment",
    subject: "Payment failed",
    description: "My payment was debited but the service is still showing as unpaid.",
    status: "Open",
    priority: "Urgent",
    dateCreated: "Apr 12, 2023",
    updatedAt: "Apr 12, 2023",
    requestId: "RE123456",
    attachments: []
  }
];
