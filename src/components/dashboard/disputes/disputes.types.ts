export type DisputeLifecycleState =
  | "Opened"
  | "UnderReview"
  | "EvidenceRequested"
  | "ProposedResolution"
  | "Resolved"
  | "Rejected";

export type DisputeReason =
  | "ServiceQuality"
  | "NoShow"
  | "Overcharge"
  | "Safety"
  | "Fraud"
  | "Other";

export type DisputeResolutionType =
  | "RefundCustomer"
  | "ReversePayout"
  | "PartialRefund"
  | "NoAction"
  | "BanContractor"
  | "WarnContractor";

export type DisputePriority = "Low" | "Medium" | "High" | "Urgent";

export type DisputePayoutStatus = "Unknown" | "Ready" | "Blocked" | "Paid";

export type DisputeAttachment = {
  id: string;
  type: "Image" | "Document";
  label: string;
  url: string;
};

export type DisputeNote = {
  id: string;
  createdAtLabel: string;
  createdBy: string;
  body: string;
};

export type DisputeActionLogEntry = {
  id: string;
  createdAtLabel: string;
  actor: string;
  summary: string;
};

export type DisputeRecord = {
  id: string;
  disputeId: string;
  disputeCode: string;
  title: string;
  lifecycleState: DisputeLifecycleState;
  reason: DisputeReason;
  priority: DisputePriority;
  payoutImpact: boolean;
  requestId: string;
  requestCode: string;
  service: string;
  location: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  lastUpdatedBy: string;
  customerId: string;
  customerName: string;
  contractorId: string;
  contractorName: string;
  chargeAmount: number;
  payoutAmount: number;
  payoutStatus: DisputePayoutStatus;
  attachments: DisputeAttachment[];
  notes: DisputeNote[];
  actionLog: DisputeActionLogEntry[];
  proposedResolutionType?: DisputeResolutionType;
  backendStatus?: string;
  dataSource?: "mock" | "live";
};
