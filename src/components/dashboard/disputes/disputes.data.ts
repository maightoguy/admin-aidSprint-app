import type {
  DisputeRecord,
  DisputeActionLogEntry,
  DisputeAttachment,
  DisputeNote,
} from "./disputes.types";

function entry(id: string, createdAtLabel: string, actor: string, summary: string): DisputeActionLogEntry {
  return { id, createdAtLabel, actor, summary };
}

function note(id: string, createdAtLabel: string, createdBy: string, body: string): DisputeNote {
  return { id, createdAtLabel, createdBy, body };
}

function attachment(
  id: string,
  type: DisputeAttachment["type"],
  label: string,
  url: string,
): DisputeAttachment {
  return { id, type, label, url };
}

export const disputeSeeds: DisputeRecord[] = [
  {
    id: "dispute-1",
    disputeId: "DSP-001",
    disputeCode: "#DSP-001",
    title: "Customer reports overcharge after completion",
    lifecycleState: "Opened",
    reason: "Overcharge",
    priority: "High",
    payoutImpact: true,
    requestId: "req-001",
    requestCode: "#REQ-1001",
    service: "Plumbing",
    location: "163 Owode-Sango Road",
    createdAtLabel: "Jun 01, 2026",
    updatedAtLabel: "Jun 01, 2026",
    lastUpdatedBy: "Ops Admin",
    customerId: "user-001",
    customerName: "Emery Torff",
    contractorId: "contractor-001",
    contractorName: "Maren Dokidis",
    chargeAmount: 12000,
    payoutAmount: 9000,
    payoutStatus: "Ready",
    attachments: [
      attachment(
        "att-1",
        "Image",
        "Receipt photo",
        "https://placehold.co/300x300/png",
      ),
      attachment(
        "att-2",
        "Document",
        "Chat transcript",
        "https://placehold.co/600x400/pdf",
      ),
    ],
    notes: [
      note(
        "note-1",
        "Jun 01, 2026 · 09:12am",
        "Ops Admin",
        "Customer claims the final invoice exceeded the agreed quote.",
      ),
    ],
    actionLog: [
      entry(
        "log-1",
        "Jun 01, 2026 · 09:10am",
        "System",
        "Dispute opened from customer complaint intake.",
      ),
    ],
  },
  {
    id: "dispute-2",
    disputeId: "DSP-002",
    disputeCode: "#DSP-002",
    title: "Contractor no-show during urgent request",
    lifecycleState: "UnderReview",
    reason: "NoShow",
    priority: "Urgent",
    payoutImpact: false,
    requestId: "req-002",
    requestCode: "#REQ-1002",
    service: "Cleaning",
    location: "34 Awgu-Mgbidi Road",
    createdAtLabel: "Jun 02, 2026",
    updatedAtLabel: "Jun 03, 2026",
    lastUpdatedBy: "Support Admin",
    customerId: "user-002",
    customerName: "Cooper Siphron",
    contractorId: "contractor-002",
    contractorName: "Marcus Dias",
    chargeAmount: 6500,
    payoutAmount: 0,
    payoutStatus: "Unknown",
    attachments: [],
    notes: [
      note(
        "note-2",
        "Jun 03, 2026 · 11:20am",
        "Support Admin",
        "Checking contractor GPS and assignment logs to confirm whether the contractor accepted and then failed to appear.",
      ),
    ],
    actionLog: [
      entry(
        "log-2",
        "Jun 02, 2026 · 06:14pm",
        "System",
        "Dispute opened and queued for operations review.",
      ),
      entry(
        "log-3",
        "Jun 03, 2026 · 11:18am",
        "Support Admin",
        "Marked dispute as under review.",
      ),
    ],
  },
  {
    id: "dispute-3",
    disputeId: "DSP-003",
    disputeCode: "#DSP-003",
    title: "Safety complaint and request for contractor warning",
    lifecycleState: "EvidenceRequested",
    reason: "Safety",
    priority: "High",
    payoutImpact: true,
    requestId: "req-003",
    requestCode: "#REQ-1003",
    service: "Handyman",
    location: "170 Ejigbo-Apomu Road",
    createdAtLabel: "Jun 03, 2026",
    updatedAtLabel: "Jun 04, 2026",
    lastUpdatedBy: "Ops Admin",
    customerId: "user-003",
    customerName: "Ahmad Stanton",
    contractorId: "contractor-003",
    contractorName: "Ahmad Stanton (Contractor)",
    chargeAmount: 15000,
    payoutAmount: 11000,
    payoutStatus: "Blocked",
    attachments: [
      attachment(
        "att-3",
        "Document",
        "Incident statement",
        "https://placehold.co/600x400/pdf",
      ),
    ],
    notes: [],
    actionLog: [
      entry(
        "log-4",
        "Jun 03, 2026 · 02:50pm",
        "System",
        "Dispute opened for safety review.",
      ),
      entry(
        "log-5",
        "Jun 04, 2026 · 09:05am",
        "Ops Admin",
        "Evidence requested from customer and contractor.",
      ),
    ],
  },
];

