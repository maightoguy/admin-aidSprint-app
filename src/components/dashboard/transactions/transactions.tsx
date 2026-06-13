import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  supabaseContractorBankAccounts,
  supabaseFinance,
  supabaseProfiles,
  type ContractorBankAccountRow,
  type PaymentRow,
  type ProfileRow,
  type WithdrawalRow,
} from "@/lib/supabase/data";
import { formatDateLabel } from "@/lib/supabase/mappers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import summaryCardPattern from "@/assets/overview/summary-card-pattern.png";
import { RevenueIcon, TotalRequestsIcon, TotalRevenueIcon } from "@/ui/icons";
import { DashboardLayout } from "../shared/dashboard-layout";
import type {
  FilterField,
  FiltersState,
} from "../shared/filters/filter-schema";
import { FilterButton } from "../shared/filters/filter-button";
import { useUrlFilters } from "../shared/filters/use-url-filters";
import { paginateItems } from "../shared/pagination-utils";
import { contractorRecords } from "../contractors/contractors.data";
import type { ContractorRecord } from "../contractors/contractors.types";
import { toast } from "sonner";
import { filterTransactions } from "./transactions.utils";

type FinanceTransactionType = "Withdrawal" | "Service payment";

type WithdrawalLifecycleStatus =
  | "Requested"
  | "UnderReview"
  | "Approved"
  | "Processing"
  | "Completed"
  | "Failed"
  | "Reversed";

type ServicePaymentLifecycleStatus =
  | "Authorized"
  | "Captured"
  | "Refunded"
  | "Chargeback"
  | "Failed";

type FinanceTransactionStatus =
  | WithdrawalLifecycleStatus
  | ServicePaymentLifecycleStatus;

type PayoutReadiness = "Ready" | "Blocked" | "NeedsReview";

type ReconciliationState = "Pending" | "Flagged" | "Reconciled";

type FinanceQueueFilter =
  | "all"
  | "failed-payouts"
  | "pending-review"
  | "blocked-payouts"
  | "completed";

type FinanceAction =
  | "approvePayout"
  | "rejectPayout"
  | "markReconciled"
  | "flagForReview"
  | "reversePayout";

type FinanceSummaryCard = {
  title: string;
  value: string;
  subtitle: string;
  highlighted?: boolean;
  Icon: typeof TotalRevenueIcon;
};

type FinanceAuditEntry = {
  id: string;
  actor: string;
  createdAtLabel: string;
  summary: string;
};

type FinanceTransactionRecord = {
  id: string;
  transactionCode: string;
  externalReference: string;
  contractorId: string;
  contractorName: string;
  contractorEmail: string;
  type: FinanceTransactionType;
  amount: number;
  createdAtLabel: string;
  updatedAtLabel: string;
  status: FinanceTransactionStatus;
  payoutReadiness: PayoutReadiness;
  reconciliationState: ReconciliationState;
  blockerReason?: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  fee: number;
  netAmount: number;
  payoutBatchCode: string;
  auditTrail: FinanceAuditEntry[];
};

type ReasonDialogConfig = {
  title: string;
  description: string;
  reasonLabel: string;
  confirmLabel: string;
  confirmTone: "primary" | "danger";
};

const financeTypes: FinanceTransactionType[] = [
  "Withdrawal",
  "Service payment",
];
const financeStatuses: FinanceTransactionStatus[] = [
  "Requested",
  "UnderReview",
  "Approved",
  "Processing",
  "Completed",
  "Failed",
  "Reversed",
  "Authorized",
  "Captured",
  "Refunded",
  "Chargeback",
];

const transactionFiltersSchema: FilterField[] = [
  {
    type: "dateRange",
    key: "dateRange",
    label: "Date range",
    fromKey: "from",
    toKey: "to",
  },
  {
    type: "select",
    key: "type",
    label: "Type",
    options: financeTypes.map((type) => ({
      label: type,
      value: type,
    })),
  },
  {
    type: "select",
    key: "status",
    label: "Status",
    options: financeStatuses.map((status) => ({
      label: formatFinanceStatus(status),
      value: status,
    })),
  },
  {
    type: "numberRange",
    key: "amountRange",
    label: "Amount range",
    minKey: "minAmount",
    maxKey: "maxAmount",
    minLabel: "Minimum amount",
    maxLabel: "Maximum amount",
  },
];

const transactionFilterDefaults: FiltersState = {
  type: null,
  status: null,
  minAmount: null,
  maxAmount: null,
  from: null,
  to: null,
};

const financeQueueDefinitions: Array<{
  key: FinanceQueueFilter;
  label: string;
  description: string;
}> = [
  {
    key: "failed-payouts",
    label: "Failed payouts",
    description: "Need intervention or retry",
  },
  {
    key: "pending-review",
    label: "Pending review",
    description: "Requires finance approval",
  },
  {
    key: "blocked-payouts",
    label: "Blocked payouts",
    description: "Blocked by readiness checks",
  },
  {
    key: "completed",
    label: "Completed",
    description: "Processed and settled",
  },
];

function formatFinanceStatus(status: FinanceTransactionStatus) {
  if (status === "UnderReview") {
    return "Under review";
  }

  return status.replace(/([A-Z])/g, " $1").trim();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatSignedCurrency(amount: number) {
  const absoluteAmount = Math.abs(amount);
  const formatted = formatCurrency(absoluteAmount);

  if (amount > 0) {
    return `+${formatted}`;
  }

  if (amount < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

function getStatusPillClassName(status: FinanceTransactionStatus) {
  if (status === "Completed" || status === "Captured") {
    return "bg-[#ECFDF3] text-[#15803D]";
  }

  if (
    status === "Requested" ||
    status === "UnderReview" ||
    status === "Approved" ||
    status === "Processing" ||
    status === "Authorized"
  ) {
    return "bg-[#FEF3E8] text-[#F79009]";
  }

  if (status === "Refunded" || status === "Reversed") {
    return "bg-[#EFF8FF] text-[#175CD3]";
  }

  return "bg-[#FEE4E2] text-[#F04438]";
}

function getReadinessPillClassName(readiness: PayoutReadiness) {
  if (readiness === "Ready") {
    return "bg-[#ECFDF3] text-[#15803D]";
  }

  if (readiness === "NeedsReview") {
    return "bg-[#FEF3E8] text-[#F79009]";
  }

  return "bg-[#FEE4E2] text-[#F04438]";
}

function getReconciliationPillClassName(state: ReconciliationState) {
  if (state === "Reconciled") {
    return "bg-[#ECFDF3] text-[#15803D]";
  }

  if (state === "Flagged") {
    return "bg-[#FEF3E8] text-[#F79009]";
  }

  return "bg-[#EFF8FF] text-[#175CD3]";
}

function getTransactionInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 1);
}

function createAuditEntry(
  summary: string,
  actor: string = "Finance Admin",
): FinanceAuditEntry {
  return {
    id: `audit-${Math.random().toString(16).slice(2, 9)}`,
    actor,
    createdAtLabel: new Date().toLocaleString(),
    summary,
  };
}

function getQueueForTransaction(
  transaction: FinanceTransactionRecord,
): Exclude<FinanceQueueFilter, "all"> {
  if (transaction.type === "Withdrawal" && transaction.status === "Failed") {
    return "failed-payouts";
  }

  if (
    transaction.type === "Withdrawal" &&
    transaction.payoutReadiness === "Blocked"
  ) {
    return "blocked-payouts";
  }

  if (
    transaction.type === "Withdrawal" &&
    ["Requested", "UnderReview", "Approved", "Processing"].includes(
      transaction.status,
    )
  ) {
    return "pending-review";
  }

  return "completed";
}

function getQueuePriority(transaction: FinanceTransactionRecord) {
  const queue = getQueueForTransaction(transaction);
  if (queue === "failed-payouts") return 0;
  if (queue === "pending-review") return 1;
  if (queue === "blocked-payouts") return 2;
  return 3;
}

function sortTransactionsForOps(records: FinanceTransactionRecord[]) {
  return [...records].sort((left, right) => {
    const queueDelta = getQueuePriority(left) - getQueuePriority(right);
    if (queueDelta !== 0) {
      return queueDelta;
    }

    return right.transactionCode.localeCompare(left.transactionCode);
  });
}

function formatCsvValue(value: string | number | boolean | null | undefined) {
  const normalized = String(value ?? "").replace(/"/g, '""');
  return `"${normalized}"`;
}

function downloadCsv(rows: FinanceTransactionRecord[]) {
  const headers = [
    "transaction_code",
    "external_reference",
    "contractor_name",
    "type",
    "amount",
    "fee",
    "net_amount",
    "status",
    "payout_readiness",
    "reconciliation_state",
    "blocker_reason",
    "created_at",
    "updated_at",
  ];

  const lines = rows.map((row) =>
    [
      row.transactionCode,
      row.externalReference,
      row.contractorName,
      row.type,
      row.amount,
      row.fee,
      row.netAmount,
      row.status,
      row.payoutReadiness,
      row.reconciliationState,
      row.blockerReason ?? "",
      row.createdAtLabel,
      row.updatedAtLabel,
    ]
      .map(formatCsvValue)
      .join(","),
  );

  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `finance-ops-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function compactTransactionCode(prefix: string, id: string) {
  const fragment = String(id)
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 8)
    .toUpperCase();
  return `#${prefix}-${fragment || "UNKNOWN"}`;
}

function mapPaymentStatusToFinanceStatus(
  value: string,
): Extract<FinanceTransactionStatus, ServicePaymentLifecycleStatus> {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "captured" || normalized === "paid") return "Captured";
  if (normalized === "authorized") return "Authorized";
  if (normalized === "refunded") return "Refunded";
  if (normalized.includes("chargeback")) return "Chargeback";
  if (
    normalized === "failed" ||
    normalized === "requires_payment_method" ||
    normalized === "cancelled"
  ) {
    return "Failed";
  }
  return "Authorized";
}

function mapWithdrawalStatusToFinanceStatus(
  value: string,
): Extract<FinanceTransactionStatus, WithdrawalLifecycleStatus> {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "completed") return "Completed";
  if (normalized === "failed") return "Failed";
  if (normalized === "processing") return "Processing";
  if (normalized === "reversed") return "Reversed";
  return "Requested";
}

function pickBankAccount(
  accounts: ContractorBankAccountRow[],
  bankAccountId: string | null,
) {
  if (bankAccountId) {
    const match = accounts.find((account) => account.id === bankAccountId);
    if (match) return match;
  }
  return accounts[0] ?? null;
}

function mapPaymentRowToFinanceTransactionRecord(params: {
  payment: PaymentRow;
  contractorProfile?: Pick<ProfileRow, "id" | "full_name" | "email"> | null;
  bankAccount?: ContractorBankAccountRow | null;
}): FinanceTransactionRecord {
  const { payment, contractorProfile, bankAccount } = params;
  const amount = Number(payment.amount) || 0;
  const fee = Number(payment.platform_fee) || 0;
  const netAmount = Number(payment.contractor_payout) || amount - fee;
  const status = mapPaymentStatusToFinanceStatus(payment.status);
  const payoutReadiness: PayoutReadiness = bankAccount ? "Ready" : "Blocked";
  const blockerReason = bankAccount ? undefined : "Missing bank details.";

  return {
    id: payment.id,
    transactionCode:
      payment.stripe_payment_intent_id?.trim() ||
      compactTransactionCode("PAY", payment.id),
    externalReference:
      payment.stripe_charge_id?.trim() ||
      payment.stripe_transfer_id?.trim() ||
      payment.stripe_payment_intent_id?.trim() ||
      payment.id,
    contractorId: payment.payee_id ?? payment.payer_id,
    contractorName: contractorProfile?.full_name?.trim() || "—",
    contractorEmail: contractorProfile?.email?.trim() || "—",
    type: "Service payment",
    amount,
    createdAtLabel: formatDateLabel(payment.created_at),
    updatedAtLabel: formatDateLabel(payment.updated_at || payment.created_at),
    status,
    payoutReadiness,
    reconciliationState: status === "Captured" ? "Reconciled" : "Pending",
    blockerReason,
    accountNumber: bankAccount?.account_number || "—",
    accountName:
      bankAccount?.account_name || contractorProfile?.full_name?.trim() || "—",
    bankName: bankAccount?.bank_name || "—",
    fee,
    netAmount,
    payoutBatchCode: "—",
    auditTrail: [],
  };
}

function mapWithdrawalRowToFinanceTransactionRecord(params: {
  withdrawal: WithdrawalRow;
  contractorProfile?: Pick<ProfileRow, "id" | "full_name" | "email"> | null;
  bankAccount?: ContractorBankAccountRow | null;
}): FinanceTransactionRecord {
  const { withdrawal, contractorProfile, bankAccount } = params;
  const amount = -(Number(withdrawal.amount) || 0);
  const status = mapWithdrawalStatusToFinanceStatus(withdrawal.status);
  const payoutReadiness: PayoutReadiness = bankAccount ? "Ready" : "Blocked";
  const blockerReason = bankAccount ? undefined : "Missing bank details.";

  return {
    id: withdrawal.id,
    transactionCode:
      withdrawal.reference?.trim() ||
      compactTransactionCode("WDR", withdrawal.id),
    externalReference:
      withdrawal.stripe_payout_id?.trim() ||
      withdrawal.reference?.trim() ||
      withdrawal.id,
    contractorId: withdrawal.contractor_id,
    contractorName: contractorProfile?.full_name?.trim() || "—",
    contractorEmail: contractorProfile?.email?.trim() || "—",
    type: "Withdrawal",
    amount,
    createdAtLabel: formatDateLabel(withdrawal.created_at),
    updatedAtLabel: formatDateLabel(
      withdrawal.processed_at || withdrawal.created_at,
    ),
    status,
    payoutReadiness,
    reconciliationState: status === "Completed" ? "Reconciled" : "Pending",
    blockerReason,
    accountNumber: bankAccount?.account_number || "—",
    accountName:
      bankAccount?.account_name || contractorProfile?.full_name?.trim() || "—",
    bankName: bankAccount?.bank_name || "—",
    fee: 0,
    netAmount: amount,
    payoutBatchCode: "—",
    auditTrail: [],
  };
}

function buildTransactions(
  contractors: ContractorRecord[],
): FinanceTransactionRecord[] {
  const contractorById = new Map(
    contractors.map((contractor) => [contractor.id, contractor]),
  );

  const blueprints: Array<{
    contractorId: string;
    type: FinanceTransactionType;
    amount: number;
    status: FinanceTransactionStatus;
    createdAtLabel: string;
    updatedAtLabel: string;
    payoutReadiness: PayoutReadiness;
    blockerReason?: string;
    bankName: string;
    payoutBatchCode: string;
  }> = [
    {
      contractorId: "emery-torff",
      type: "Withdrawal",
      amount: -1200,
      status: "UnderReview",
      createdAtLabel: "Jun 04, 2026",
      updatedAtLabel: "Jun 05, 2026",
      payoutReadiness: "NeedsReview",
      blockerReason: "Large payout requires manual approval.",
      bankName: "United Bank for Africa",
      payoutBatchCode: "BAT-9001",
    },
    {
      contractorId: "maren-dokidis",
      type: "Withdrawal",
      amount: -890,
      status: "Failed",
      createdAtLabel: "Jun 04, 2026",
      updatedAtLabel: "Jun 05, 2026",
      payoutReadiness: "Ready",
      blockerReason: "Bank transfer failed. Retry needed.",
      bankName: "Access Bank",
      payoutBatchCode: "BAT-9002",
    },
    {
      contractorId: "cooper-siphron",
      type: "Withdrawal",
      amount: -540,
      status: "Requested",
      createdAtLabel: "Jun 05, 2026",
      updatedAtLabel: "Jun 05, 2026",
      payoutReadiness: "NeedsReview",
      blockerReason: "KYC refresh pending.",
      bankName: "First Bank",
      payoutBatchCode: "BAT-9003",
    },
    {
      contractorId: "marcus-dias",
      type: "Withdrawal",
      amount: -740,
      status: "Completed",
      createdAtLabel: "Jun 05, 2026",
      updatedAtLabel: "Jun 05, 2026",
      payoutReadiness: "Ready",
      bankName: "Zenith Bank",
      payoutBatchCode: "BAT-9004",
    },
    {
      contractorId: "ahmad-stanton-1",
      type: "Withdrawal",
      amount: -660,
      status: "Processing",
      createdAtLabel: "Jun 05, 2026",
      updatedAtLabel: "Jun 05, 2026",
      payoutReadiness: "Ready",
      bankName: "Access Bank",
      payoutBatchCode: "BAT-9005",
    },
    {
      contractorId: "ahmad-stanton-2",
      type: "Withdrawal",
      amount: -430,
      status: "Approved",
      createdAtLabel: "Jun 03, 2026",
      updatedAtLabel: "Jun 05, 2026",
      payoutReadiness: "Blocked",
      blockerReason:
        "Payouts blocked until service complaint review is cleared.",
      bankName: "Sterling Bank",
      payoutBatchCode: "BAT-9006",
    },
    {
      contractorId: "ahmad-stanton-3",
      type: "Service payment",
      amount: 960,
      status: "Chargeback",
      createdAtLabel: "Jun 02, 2026",
      updatedAtLabel: "Jun 05, 2026",
      payoutReadiness: "Blocked",
      blockerReason: "Chargeback investigation in progress.",
      bankName: "Wema Bank",
      payoutBatchCode: "BAT-9007",
    },
    {
      contractorId: "ahmad-stanton-4",
      type: "Service payment",
      amount: 780,
      status: "Captured",
      createdAtLabel: "Jun 01, 2026",
      updatedAtLabel: "Jun 05, 2026",
      payoutReadiness: "Ready",
      bankName: "GTBank",
      payoutBatchCode: "BAT-9008",
    },
  ];

  return blueprints.map((blueprint, index) => {
    const contractor =
      contractorById.get(blueprint.contractorId) ??
      contractors[index % contractors.length];
    const fee = Number((Math.abs(blueprint.amount) * 0.025).toFixed(2));
    const netBase = Math.abs(blueprint.amount) - fee;
    const netAmount = blueprint.amount < 0 ? -netBase : netBase;

    return {
      id: `transaction-${index + 1}`,
      transactionCode: `#FIN-${4100 + index}`,
      externalReference: `EXT-${8300 + index}`,
      contractorId: contractor.id,
      contractorName: contractor.name,
      contractorEmail: contractor.email,
      type: blueprint.type,
      amount: blueprint.amount,
      createdAtLabel: blueprint.createdAtLabel,
      updatedAtLabel: blueprint.updatedAtLabel,
      status: blueprint.status,
      payoutReadiness: blueprint.payoutReadiness,
      reconciliationState:
        blueprint.status === "Completed" || blueprint.status === "Captured"
          ? "Reconciled"
          : "Pending",
      blockerReason: blueprint.blockerReason,
      accountNumber: `00${2134567800 + index}`,
      accountName: contractor.name,
      bankName: blueprint.bankName,
      fee,
      netAmount,
      payoutBatchCode: blueprint.payoutBatchCode,
      auditTrail: [
        {
          id: `seed-audit-open-${index}`,
          actor: "System",
          createdAtLabel: `${blueprint.createdAtLabel} � 09:15am`,
          summary: `${blueprint.type} created and queued for finance operations.`,
        },
        {
          id: `seed-audit-update-${index}`,
          actor: "Finance Admin",
          createdAtLabel: `${blueprint.updatedAtLabel} � 01:05pm`,
          summary:
            blueprint.status === "Failed"
              ? "Failure recorded and retry review opened."
              : `Current lifecycle state recorded as ${formatFinanceStatus(blueprint.status)}.`,
        },
      ],
    };
  });
}

function getReasonDialogConfig(action: FinanceAction): ReasonDialogConfig {
  if (action === "approvePayout") {
    return {
      title: "Approve payout",
      description: "Confirm approval and capture a reason for the audit trail.",
      reasonLabel: "Approval reason",
      confirmLabel: "Confirm approval",
      confirmTone: "primary",
    };
  }

  if (action === "rejectPayout") {
    return {
      title: "Reject payout",
      description: "Capture why this payout is being rejected or failed.",
      reasonLabel: "Rejection reason",
      confirmLabel: "Confirm rejection",
      confirmTone: "danger",
    };
  }

  if (action === "markReconciled") {
    return {
      title: "Mark as reconciled",
      description:
        "Capture the reconciliation note for downstream finance review.",
      reasonLabel: "Reconciliation note",
      confirmLabel: "Mark reconciled",
      confirmTone: "primary",
    };
  }

  if (action === "flagForReview") {
    return {
      title: "Flag for review",
      description:
        "Explain why this transaction needs another finance review pass.",
      reasonLabel: "Review reason",
      confirmLabel: "Flag for review",
      confirmTone: "primary",
    };
  }

  return {
    title: "Reverse payout",
    description: "Explain why this payout must be reversed.",
    reasonLabel: "Reversal reason",
    confirmLabel: "Reverse payout",
    confirmTone: "danger",
  };
}

function ReasonCaptureDialog({
  open,
  config,
  reason,
  onReasonChange,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  config: ReasonDialogConfig | null;
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const canConfirm = Boolean(reason.trim());

  if (!config) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] max-w-[560px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
        <div className="px-6 py-6">
          <DialogTitle className="text-xl font-bold text-[#101828]">
            {config.title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[#667085]">
            {config.description}
          </DialogDescription>

          <div className="mt-5">
            <label className="block text-sm font-semibold text-[#344054]">
              {config.reasonLabel}
            </label>
            <Textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              className="mt-2 min-h-[132px]"
              aria-label={config.reasonLabel}
              placeholder="Enter a reason"
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
              disabled={!canConfirm}
              onClick={onConfirm}
              className={cn(
                "inline-flex items-center justify-center rounded-[10px] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
                config.confirmTone === "danger"
                  ? "bg-[#F04438] hover:bg-[#D92D20]"
                  : "bg-[#071B58] hover:bg-[#0C2877]",
              )}
            >
              {config.confirmLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransactionSummaryCard({ card }: { card: FinanceSummaryCard }) {
  const Icon = card.Icon;

  return (
    <article
      className={cn(
        "relative min-h-[127px] overflow-hidden rounded-[14px] border p-5 shadow-sm",
        card.highlighted
          ? "border-[#07133A] bg-[linear-gradient(135deg,#020817_0%,#041B5C_100%)]"
          : "border-[#EAECF0] bg-[#FAFAFA]",
      )}
    >
      <img
        src={summaryCardPattern}
        alt=""
        aria-hidden="true"
        className={cn(
          "absolute -left-[27px] -top-[14px] hidden h-[156px] max-w-none rotate-180 opacity-80 lg:block",
          card.highlighted ? "w-[428px]" : "w-[318px]",
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={cn(
              "text-[14px] font-medium leading-5",
              card.highlighted ? "text-[#EEF3E6]" : "text-[#98A2B3]",
            )}
          >
            {card.title}
          </p>
          <p
            className={cn(
              "mt-[18px] text-[18px] font-bold tracking-[-0.03em] text-[#101828] sm:text-[30px] sm:leading-[38px]",
              card.highlighted && "text-white",
            )}
          >
            {card.value}
          </p>
          <p
            className={cn(
              "mt-3 text-[14px] font-medium leading-5",
              card.highlighted ? "text-[#B1B5C0]" : "text-[#16A34A]",
            )}
          >
            {card.subtitle}
          </p>
        </div>
        <span
          className={cn(
            "mt-[30px] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border",
            card.highlighted
              ? "border-[#36415C] bg-[#02091C]"
              : "border-[#EAECF0] bg-white",
          )}
        >
          <Icon
            size={20}
            color={card.highlighted ? "#EEF3E6" : "#071B58"}
            aria-hidden="true"
          />
        </span>
      </div>
    </article>
  );
}

function QueueCard({
  label,
  description,
  value,
  active,
  onClick,
}: {
  label: string;
  description: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[14px] border p-4 text-left transition",
        active
          ? "border-[#071B58] bg-[#F8FAFC] shadow-sm"
          : "border-[#EAECF0] bg-white hover:bg-[#FCFCFD]",
      )}
    >
      <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#98A2B3]">
        {label}
      </p>
      <p className="mt-3 text-[28px] font-bold leading-8 text-[#101828]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[#667085]">{description}</p>
    </button>
  );
}

function FinanceActionMenu({
  transactionCode,
  onViewDetails,
  onOpenAction,
}: {
  transactionCode: string;
  onViewDetails: () => void;
  onOpenAction: (action: FinanceAction) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#D0D5DD] bg-white text-[#101828] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20"
          aria-label={`Open actions for transaction ${transactionCode}`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[210px] rounded-[10px] border border-[#EAECF0] bg-white p-0 shadow-[0_18px_38px_rgba(15,23,42,0.12)]"
      >
        <DropdownMenuItem
          onClick={onViewDetails}
          className="h-[36px] rounded-[10px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#2D3036] focus:bg-[#F8FAFC]"
        >
          View details
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#EAECF0]" />
        <DropdownMenuItem
          onClick={() => onOpenAction("approvePayout")}
          className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#15803D] focus:bg-[#F8FAFC]"
        >
          Approve payout
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpenAction("rejectPayout")}
          className="h-[36px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#F04438] focus:bg-[#F8FAFC]"
        >
          Reject payout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TransactionRowName({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAECF0] text-[20px] font-semibold leading-7 text-[#19213D]">
        {getTransactionInitials(name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[16px] font-semibold leading-6 text-[#101828]">
          {name}
        </p>
        <p className="truncate text-[14px] leading-5 text-[#98A2B3]">{email}</p>
      </div>
    </div>
  );
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

function FinanceStatusMenu({
  onSelectAction,
}: {
  onSelectAction: (action: FinanceAction) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-[10px] border border-[#B1B5C0] bg-[#041133] px-4 py-[13px] text-[14px] font-medium text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/25"
          aria-label="Open finance actions"
        >
          Finance actions
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side="top"
        avoidCollisions={false}
        sideOffset={8}
        collisionPadding={16}
        className="z-[90] w-[352px] max-w-[calc(100vw-48px)] rounded-[14px] border border-[#EAECF0] bg-white p-0 shadow-[0_24px_40px_rgba(15,23,42,0.14)]"
      >
        <DropdownMenuItem
          onClick={() => onSelectAction("approvePayout")}
          className="rounded-none px-4 py-3 text-[14px] font-medium text-[#15803D] focus:bg-[#F8FAFC]"
        >
          Approve payout
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#EAECF0]" />
        <DropdownMenuItem
          onClick={() => onSelectAction("rejectPayout")}
          className="rounded-none px-4 py-3 text-[14px] font-medium text-[#F04438] focus:bg-[#F8FAFC]"
        >
          Reject payout
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#EAECF0]" />
        <DropdownMenuItem
          onClick={() => onSelectAction("markReconciled")}
          className="rounded-none px-4 py-3 text-[14px] font-medium text-[#175CD3] focus:bg-[#F8FAFC]"
        >
          Mark as reconciled
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#EAECF0]" />
        <DropdownMenuItem
          onClick={() => onSelectAction("flagForReview")}
          className="rounded-none px-4 py-3 text-[14px] font-medium text-[#F79009] focus:bg-[#F8FAFC]"
        >
          Flag for review
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#EAECF0]" />
        <DropdownMenuItem
          onClick={() => onSelectAction("reversePayout")}
          className="rounded-none px-4 py-3 text-[14px] font-medium text-[#F04438] focus:bg-[#F8FAFC]"
        >
          Reverse payout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TransactionDetailsSidebar({
  open,
  transaction,
  onOpenChange,
  initialAction,
  onConsumeInitialAction,
  onApplyAction,
}: {
  open: boolean;
  transaction: FinanceTransactionRecord | null;
  onOpenChange: (open: boolean) => void;
  initialAction: FinanceAction | null;
  onConsumeInitialAction: () => void;
  onApplyAction: (action: FinanceAction, reason: string) => void;
}) {
  const [pendingAction, setPendingAction] = useState<FinanceAction | null>(
    null,
  );
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setPendingAction(null);
      setReason("");
      return;
    }

    if (initialAction) {
      setPendingAction(initialAction);
      setReason("");
      onConsumeInitialAction();
    }
  }, [initialAction, onConsumeInitialAction, open]);

  const reasonConfig = pendingAction
    ? getReasonDialogConfig(pendingAction)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[60] bg-[rgba(15,23,42,0.16)] backdrop-blur-[4px] data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 top-auto z-[70] grid h-[92dvh] max-h-[92dvh] w-full translate-y-0 gap-0 rounded-t-[28px] border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] outline-none duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom sm:inset-x-auto sm:right-0 sm:top-0 sm:h-screen sm:max-h-screen sm:w-[390px] sm:rounded-none sm:rounded-l-[10px] sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right">
          <DialogTitle className="sr-only">Transaction details</DialogTitle>
          <DialogDescription className="sr-only">
            Review finance transaction details and perform audited actions.
          </DialogDescription>
          <div className="flex h-full flex-col overflow-y-auto px-[12px] pb-[12px] pt-[14px]">
            {transaction ? (
              <>
                <div className="flex items-center justify-between gap-4 px-[2px]">
                  <h2 className="text-[16px] font-bold leading-6 text-[#101828]">
                    Transaction details
                  </h2>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#101828] transition hover:bg-[#F2F4F7] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20"
                    aria-label="Close transaction details"
                  >
                    <X className="h-[18px] w-[18px]" />
                  </button>
                </div>

                <div className="mt-4 rounded-[14px] border border-[#EAECF0] bg-[#FCFCFD] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold leading-5 text-[#101828]">
                      {transaction.transactionCode}
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-semibold",
                        getStatusPillClassName(transaction.status),
                      )}
                    >
                      {formatFinanceStatus(transaction.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#667085]">
                    {transaction.type} | {transaction.externalReference}
                  </p>
                </div>

                <div className="mt-[14px]">
                  <p className="text-[12px] font-semibold leading-4 text-[#101828]">
                    Contractor
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#D4AF7A_0%,#6B4E2E_100%)] text-[11px] font-semibold text-white">
                        {getTransactionInitials(transaction.contractorName)}
                      </div>
                      <span className="truncate text-[24px] font-medium leading-7 text-[#2D2D2D]">
                        {transaction.contractorName}
                      </span>
                    </div>
                    <Link
                      to={`/contractors/${transaction.contractorId}`}
                      className="inline-flex h-8 shrink-0 items-center justify-center rounded-[4px] border border-[#EAECF0] px-3 text-[12px] font-semibold text-[#344054] transition hover:bg-[#F9FAFB]"
                    >
                      View profile
                    </Link>
                  </div>
                </div>

                <div className="mt-[16px] overflow-hidden rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD]">
                  <DetailRow
                    label="Transaction ID"
                    value={transaction.transactionCode}
                  />
                  <DetailRow
                    label="Reference"
                    value={transaction.externalReference}
                  />
                  <DetailRow
                    label="Transaction type"
                    value={transaction.type}
                  />
                  <DetailRow
                    label="Requested at"
                    value={transaction.createdAtLabel}
                  />
                  <DetailRow
                    label="Last update"
                    value={transaction.updatedAtLabel}
                  />
                  <DetailRow
                    label="Batch ID"
                    value={transaction.payoutBatchCode}
                  />
                  <DetailRow
                    label="Bank account"
                    value={transaction.bankName}
                  />
                  <DetailRow
                    label="Account number"
                    value={transaction.accountNumber}
                  />
                  <DetailRow
                    label="Account name"
                    value={transaction.accountName}
                  />
                  <DetailRow
                    label="Gross amount"
                    value={formatCurrency(Math.abs(transaction.amount))}
                  />
                  <DetailRow
                    label="Fee"
                    value={formatCurrency(transaction.fee)}
                  />
                  <DetailRow
                    label="Net amount"
                    value={formatCurrency(Math.abs(transaction.netAmount))}
                  />
                  <DetailRow
                    label="Lifecycle state"
                    value={formatFinanceStatus(transaction.status)}
                  />
                </div>

                <div className="mt-4 overflow-hidden rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD]">
                  <div className="flex items-center justify-between gap-4 border-b border-[#EAECF0] px-[10px] py-[11px]">
                    <span className="text-[14px] font-normal leading-5 text-[#98A2B3]">
                      Payout readiness
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                        getReadinessPillClassName(transaction.payoutReadiness),
                      )}
                    >
                      {transaction.payoutReadiness}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-[10px] py-[11px]">
                    <span className="text-[14px] font-normal leading-5 text-[#98A2B3]">
                      Reconciliation
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                        getReconciliationPillClassName(
                          transaction.reconciliationState,
                        ),
                      )}
                    >
                      {transaction.reconciliationState}
                    </span>
                  </div>
                  {transaction.blockerReason ? (
                    <div className="border-t border-[#EAECF0] px-[10px] py-[11px]">
                      <p className="text-[14px] font-normal leading-5 text-[#98A2B3]">
                        Blocker reason
                      </p>
                      <p className="mt-2 text-[14px] font-semibold leading-5 text-[#2D2D2D]">
                        {transaction.blockerReason}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD] px-4 py-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#98A2B3]">
                    Audit trail
                  </p>
                  <div className="mt-3 space-y-3">
                    {transaction.auditTrail.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-[12px] border border-[#EAECF0] bg-white px-4 py-3"
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
                </div>

                <div className="mt-auto pt-6">
                  <FinanceStatusMenu onSelectAction={setPendingAction} />
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm font-medium text-[#667085]">
                  Transaction details are unavailable.
                </p>
              </div>
            )}
          </div>

          <ReasonCaptureDialog
            open={Boolean(pendingAction)}
            config={reasonConfig}
            reason={reason}
            onReasonChange={setReason}
            onOpenChange={(nextOpen) => {
              if (!nextOpen) {
                setPendingAction(null);
                setReason("");
              }
            }}
            onConfirm={() => {
              if (!pendingAction || !reason.trim()) {
                return;
              }

              onApplyAction(pendingAction, reason.trim());
              setPendingAction(null);
              setReason("");
            }}
          />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<FinanceTransactionRecord[]>(
    () => buildTransactions(contractorRecords),
  );
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveCounts, setLiveCounts] = useState<{
    payments: number;
    withdrawals: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [queueFilter, setQueueFilter] = useState<FinanceQueueFilter>("all");
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [sidebarAction, setSidebarAction] = useState<FinanceAction | null>(
    null,
  );
  const pageSize = expanded ? 10 : 5;
  const { filters: urlFilters } = useUrlFilters({
    schema: transactionFiltersSchema,
    defaults: transactionFilterDefaults,
  });

  const typeFilter =
    urlFilters.type &&
    financeTypes.includes(urlFilters.type as FinanceTransactionType)
      ? String(urlFilters.type)
      : null;
  const statusFilter =
    urlFilters.status &&
    financeStatuses.includes(urlFilters.status as FinanceTransactionStatus)
      ? String(urlFilters.status)
      : null;
  const minAmountFilter =
    typeof urlFilters.minAmount === "number" ? urlFilters.minAmount : null;
  const maxAmountFilter =
    typeof urlFilters.maxAmount === "number" ? urlFilters.maxAmount : null;
  const fromFilter =
    typeof urlFilters.from === "string" && urlFilters.from
      ? urlFilters.from
      : null;
  const toFilter =
    typeof urlFilters.to === "string" && urlFilters.to ? urlFilters.to : null;

  useEffect(() => {
    const isTestEnv = import.meta.env.MODE === "test" || import.meta.env.VITEST;
    if (isTestEnv || !isSupabaseConfigured()) {
      return;
    }

    let cancelled = false;

    const loadLiveFinance = async () => {
      try {
        setIsLiveLoading(true);
        setLiveError(null);

        const [paymentsResult, withdrawalsResult] = await Promise.all([
          supabaseFinance.listPayments({ limit: 200 }),
          supabaseFinance.listWithdrawals({ limit: 200 }),
        ]);

        if (paymentsResult.ok === false)
          throw new Error(paymentsResult.message);
        if (withdrawalsResult.ok === false) {
          throw new Error(withdrawalsResult.message);
        }

        const payments = paymentsResult.data;
        const withdrawals = withdrawalsResult.data;

        const contractorIds = Array.from(
          new Set([
            ...payments.map((row) => row.payee_id).filter(Boolean),
            ...withdrawals.map((row) => row.contractor_id),
          ]),
        ) as string[];

        const [profilesResult, bankAccountsResult] = await Promise.all([
          supabaseProfiles.listByIds(contractorIds),
          supabaseContractorBankAccounts.listByContractorIds(contractorIds),
        ]);

        if (profilesResult.ok === false)
          throw new Error(profilesResult.message);
        if (bankAccountsResult.ok === false) {
          throw new Error(bankAccountsResult.message);
        }

        const profileById = new Map<string, ProfileRow>(
          profilesResult.data.map((profile) => [profile.id, profile]),
        );
        const accountsByContractorId = bankAccountsResult.data.reduce<
          Record<string, ContractorBankAccountRow[]>
        >((acc, account) => {
          const key = account.contractor_id;
          if (!acc[key]) acc[key] = [];
          acc[key].push(account);
          return acc;
        }, {});

        const paymentRecords = payments.map((payment) => {
          const contractorId = payment.payee_id ?? "";
          const profile = contractorId
            ? (profileById.get(contractorId) ?? null)
            : null;
          const accounts = contractorId
            ? (accountsByContractorId[contractorId] ?? [])
            : [];
          const bankAccount = pickBankAccount(accounts, null);

          return mapPaymentRowToFinanceTransactionRecord({
            payment,
            contractorProfile: profile,
            bankAccount,
          });
        });

        const withdrawalRecords = withdrawals.map((withdrawal) => {
          const contractorId = withdrawal.contractor_id;
          const profile = profileById.get(contractorId) ?? null;
          const accounts = accountsByContractorId[contractorId] ?? [];
          const bankAccount = pickBankAccount(
            accounts,
            withdrawal.bank_account_id,
          );

          return mapWithdrawalRowToFinanceTransactionRecord({
            withdrawal,
            contractorProfile: profile,
            bankAccount,
          });
        });

        if (cancelled) return;

        setTransactions([...withdrawalRecords, ...paymentRecords]);
        setLiveCounts({
          payments: payments.length,
          withdrawals: withdrawals.length,
        });
      } catch (error) {
        if (cancelled) return;
        setLiveCounts(null);
        setLiveError(
          error instanceof Error
            ? error.message
            : "Unable to load live finance data.",
        );
      } finally {
        if (!cancelled) {
          setIsLiveLoading(false);
        }
      }
    };

    void loadLiveFinance();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    expanded,
    queueFilter,
    typeFilter,
    statusFilter,
    minAmountFilter,
    maxAmountFilter,
    fromFilter,
    toFilter,
  ]);

  const queueCounts = useMemo(() => {
    return transactions.reduce<
      Record<Exclude<FinanceQueueFilter, "all">, number>
    >(
      (counts, transaction) => {
        const queue = getQueueForTransaction(transaction);
        counts[queue] += 1;
        return counts;
      },
      {
        "failed-payouts": 0,
        "pending-review": 0,
        "blocked-payouts": 0,
        completed: 0,
      },
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const queueScopedTransactions =
      queueFilter === "all"
        ? transactions
        : transactions.filter(
            (transaction) =>
              getQueueForTransaction(transaction) === queueFilter,
          );

    return sortTransactionsForOps(
      filterTransactions(queueScopedTransactions, {
        query: searchQuery,
        type: typeFilter,
        status: statusFilter,
        minAmount: minAmountFilter,
        maxAmount: maxAmountFilter,
        from: fromFilter,
        to: toFilter,
      }),
    );
  }, [
    transactions,
    queueFilter,
    searchQuery,
    typeFilter,
    statusFilter,
    minAmountFilter,
    maxAmountFilter,
    fromFilter,
    toFilter,
  ]);

  const paginatedTransactions = useMemo(
    () => paginateItems(filteredTransactions, currentPage, pageSize),
    [filteredTransactions, currentPage, pageSize],
  );
  const totalPages = paginatedTransactions.totalPages;
  const currentRows = paginatedTransactions.items;
  const selectedTransaction = useMemo(
    () =>
      transactions.find(
        (transaction) => transaction.id === selectedTransactionId,
      ) ?? null,
    [selectedTransactionId, transactions],
  );

  const summaryCards = useMemo<FinanceSummaryCard[]>(() => {
    const totalPayoutsThisWeek = transactions
      .filter((transaction) => transaction.type === "Withdrawal")
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
    const pendingPayouts = transactions.filter(
      (transaction) =>
        transaction.type === "Withdrawal" &&
        ["Requested", "UnderReview", "Approved", "Processing"].includes(
          transaction.status,
        ),
    ).length;
    const failedPayouts = transactions.filter(
      (transaction) =>
        transaction.type === "Withdrawal" && transaction.status === "Failed",
    ).length;
    const blockedPayouts = transactions.filter(
      (transaction) =>
        transaction.type === "Withdrawal" &&
        (transaction.payoutReadiness === "Blocked" ||
          transaction.payoutReadiness === "NeedsReview"),
    ).length;

    return [
      {
        title: "Total payouts",
        value: formatCurrency(totalPayoutsThisWeek),
        subtitle: "This week across withdrawal batches",
        highlighted: true,
        Icon: TotalRevenueIcon,
      },
      {
        title: "Pending payouts",
        value: String(pendingPayouts),
        subtitle: "Requested, approved, or processing",
        Icon: TotalRequestsIcon as typeof TotalRevenueIcon,
      },
      {
        title: "Failed payouts",
        value: String(failedPayouts),
        subtitle: "Need retry or rejection handling",
        Icon: RevenueIcon as typeof TotalRevenueIcon,
      },
      {
        title: "Blocked / review",
        value: String(blockedPayouts),
        subtitle: "Readiness blockers and manual review",
        Icon: RevenueIcon as typeof TotalRevenueIcon,
      },
    ];
  }, [transactions]);

  const handleViewDetails = (
    transactionId: string,
    initialAction: FinanceAction | null = null,
  ) => {
    setSelectedTransactionId(transactionId);
    setSidebarAction(initialAction);
  };

  const handleApplyAction = (action: FinanceAction, reason: string) => {
    if (!selectedTransactionId) {
      return;
    }

    setTransactions((currentTransactions) =>
      currentTransactions.map((transaction) => {
        if (transaction.id !== selectedTransactionId) {
          return transaction;
        }

        let nextStatus = transaction.status;
        let nextReadiness = transaction.payoutReadiness;
        let nextReconciliation = transaction.reconciliationState;
        let nextBlockerReason = transaction.blockerReason;

        if (action === "approvePayout") {
          nextStatus =
            transaction.type === "Withdrawal" ? "Approved" : "Captured";
          nextReadiness = "Ready";
          nextBlockerReason = undefined;
        }

        if (action === "rejectPayout") {
          nextStatus = "Failed";
          nextReadiness = "Blocked";
          nextBlockerReason = reason;
        }

        if (action === "markReconciled") {
          nextReconciliation = "Reconciled";
        }

        if (action === "flagForReview") {
          nextStatus =
            transaction.type === "Withdrawal"
              ? "UnderReview"
              : transaction.status;
          nextReadiness = "NeedsReview";
          nextReconciliation = "Flagged";
          nextBlockerReason = reason;
        }

        if (action === "reversePayout") {
          nextStatus =
            transaction.type === "Withdrawal" ? "Reversed" : "Refunded";
          nextReadiness = "Blocked";
          nextReconciliation = "Flagged";
          nextBlockerReason = reason;
        }

        const actionSummaryMap: Record<FinanceAction, string> = {
          approvePayout: `Payout approved. ${reason}`,
          rejectPayout: `Payout rejected. ${reason}`,
          markReconciled: `Marked as reconciled. ${reason}`,
          flagForReview: `Flagged for review. ${reason}`,
          reversePayout: `Payout reversal initiated. ${reason}`,
        };

        return {
          ...transaction,
          status: nextStatus,
          payoutReadiness: nextReadiness,
          reconciliationState: nextReconciliation,
          blockerReason: nextBlockerReason,
          updatedAtLabel: new Date().toLocaleDateString(),
          auditTrail: [
            createAuditEntry(actionSummaryMap[action]),
            ...transaction.auditTrail,
          ],
        };
      }),
    );

    const toastSummary: Record<FinanceAction, string> = {
      approvePayout: "Payout approved successfully.",
      rejectPayout: "Payout rejected successfully.",
      markReconciled: "Transaction marked as reconciled.",
      flagForReview: "Transaction flagged for review.",
      reversePayout: "Payout reversal recorded.",
    };

    toast.success(
      `${toastSummary[action]}${liveCounts ? " (local-only)" : ""}`,
    );
  };

  const handleExport = () => {
    downloadCsv(filteredTransactions);
    toast.success("Finance export completed.", {
      description: `${filteredTransactions.length} records exported for finance ops review.`,
    });
  };

  return (
    <DashboardLayout title="Transactions">
      <div className="space-y-5">
        {isLiveLoading ? (
          <div className="rounded-[14px] border border-[#EAECF0] bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#667085]">
            Loading live finance transactions from Supabase...
          </div>
        ) : null}
        {liveError ? (
          <div className="rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B42318]">
            {liveError}
          </div>
        ) : null}
        {liveCounts ? (
          <div className="rounded-[14px] border border-[#D0D5DD] bg-[#FCFCFD] px-4 py-3 text-sm text-[#475467]">
            Live finance data loaded from Supabase: {liveCounts.withdrawals}{" "}
            withdrawals, {liveCounts.payments} payments. Admin status actions
            remain local-only until a supported finance write contract is added.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <TransactionSummaryCard key={card.title} card={card} />
          ))}
        </div>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {financeQueueDefinitions.map((queue) => (
            <QueueCard
              key={queue.key}
              label={queue.label}
              description={queue.description}
              value={queueCounts[queue.key]}
              active={queueFilter === queue.key}
              onClick={() => setQueueFilter(queue.key)}
            />
          ))}
        </section>

        <section className="overflow-hidden rounded-[16px] border border-[#EAECF0] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#EAECF0] px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[14px] font-semibold leading-5 text-[#98A2B3]">
                  Finance operations queue
                </p>
                <p className="mt-1 text-sm text-[#667085]">
                  Prioritizes failed payouts, review blockers, and
                  reconciliation work.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <label className="relative min-w-0 sm:w-[294px]">
                  <Search className="pointer-events-none absolute left-[14px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#101828]" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search finance records ..."
                    className="h-[42px] rounded-[10px] border-[#EAECF0] bg-[#FCFCFD] pl-[40px] text-[14px] text-[#667085] placeholder:text-[#98A2B3]"
                    aria-label="Search transactions"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD] px-4 text-sm font-semibold text-[#344054] transition hover:bg-white"
                  aria-label="Export transactions"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="inline-flex h-[42px] items-center justify-center rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD] px-4 text-sm font-semibold text-[#667085] transition hover:bg-white"
                  aria-label={
                    expanded
                      ? "Show fewer transactions per page"
                      : "Show more transactions per page"
                  }
                >
                  {expanded ? "See less" : "See all"}
                </button>
                <FilterButton
                  title="Filter transactions"
                  schema={transactionFiltersSchema}
                  defaults={transactionFilterDefaults}
                  trigger={({ onClick }) => (
                    <button
                      type="button"
                      onClick={onClick}
                      className="inline-flex h-[42px] w-[46px] shrink-0 items-center justify-center rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD] text-[#667085] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
                      aria-label="Filter transactions"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </button>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQueueFilter("all")}
                className={cn(
                  "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition",
                  queueFilter === "all"
                    ? "bg-[#071B58] text-white"
                    : "bg-[#F2F4F7] text-[#344054] hover:bg-[#EAECF0]",
                )}
              >
                All queues
              </button>
              {financeQueueDefinitions.map((queue) => (
                <button
                  key={queue.key}
                  type="button"
                  onClick={() => setQueueFilter(queue.key)}
                  className={cn(
                    "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition",
                    queueFilter === queue.key
                      ? "bg-[#071B58] text-white"
                      : "bg-[#F2F4F7] text-[#344054] hover:bg-[#EAECF0]",
                  )}
                >
                  {queue.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1260px]">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-[14px] font-semibold leading-5 text-[#667085]">
                  <th className="w-[150px] px-6 py-4">Trans ID</th>
                  <th className="w-[250px] px-6 py-4">Name</th>
                  <th className="w-[180px] px-6 py-4">Transaction Type</th>
                  <th className="w-[150px] px-6 py-4">Amount</th>
                  <th className="w-[160px] px-6 py-4">Queue</th>
                  <th className="w-[170px] px-6 py-4">Requested at</th>
                  <th className="w-[180px] px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {currentRows.length ? (
                  currentRows.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-t border-[#EAECF0] align-middle"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] leading-5 text-[#98A2B3]">
                        {transaction.transactionCode}
                      </td>
                      <td className="px-6 py-4">
                        <TransactionRowName
                          name={transaction.contractorName}
                          email={transaction.contractorEmail}
                        />
                      </td>
                      <td className="px-6 py-4 text-[14px] font-semibold leading-5 text-[#101828]">
                        {transaction.type}
                      </td>
                      <td className="px-6 py-4 text-[14px] leading-5 text-[#667085]">
                        {formatSignedCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex shrink-0 whitespace-nowrap rounded-full bg-[#F2F4F7] px-3 py-1 text-xs font-semibold text-[#344054]">
                          {financeQueueDefinitions.find(
                            (queue) =>
                              queue.key === getQueueForTransaction(transaction),
                          )?.label ?? "Completed"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] leading-5 text-[#98A2B3]">
                        {transaction.createdAtLabel}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex min-w-[170px] flex-wrap gap-2">
                          <span
                            className={cn(
                              "inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[14px] font-medium leading-5",
                              getStatusPillClassName(transaction.status),
                            )}
                          >
                            {formatFinanceStatus(transaction.status)}
                          </span>
                          <span
                            className={cn(
                              "inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                              getReadinessPillClassName(
                                transaction.payoutReadiness,
                              ),
                            )}
                          >
                            {transaction.payoutReadiness}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <FinanceActionMenu
                          transactionCode={transaction.transactionCode}
                          onViewDetails={() =>
                            handleViewDetails(transaction.id)
                          }
                          onOpenAction={(action) =>
                            handleViewDetails(transaction.id, action)
                          }
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm font-medium text-[#98A2B3]"
                    >
                      No transactions match the current search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {currentRows.length ? (
              currentRows.map((transaction) => (
                <article
                  key={transaction.id}
                  className="rounded-[14px] border border-[#EAECF0] bg-[#FCFCFD] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold leading-5 text-[#101828]">
                        {transaction.transactionCode}
                      </p>
                      <p className="mt-1 text-[13px] leading-5 text-[#98A2B3]">
                        {transaction.createdAtLabel}
                      </p>
                    </div>
                    <FinanceActionMenu
                      transactionCode={transaction.transactionCode}
                      onViewDetails={() => handleViewDetails(transaction.id)}
                      onOpenAction={(action) =>
                        handleViewDetails(transaction.id, action)
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <TransactionRowName
                      name={transaction.contractorName}
                      email={transaction.contractorEmail}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[12px] font-medium leading-4 text-[#98A2B3]">
                        Type
                      </p>
                      <p className="mt-1 text-[14px] font-semibold leading-5 text-[#101828]">
                        {transaction.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] font-medium leading-4 text-[#98A2B3]">
                        Amount
                      </p>
                      <p className="mt-1 text-[14px] leading-5 text-[#667085]">
                        {formatSignedCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[14px] font-medium leading-5",
                        getStatusPillClassName(transaction.status),
                      )}
                    >
                      {formatFinanceStatus(transaction.status)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                        getReadinessPillClassName(transaction.payoutReadiness),
                      )}
                    >
                      {transaction.payoutReadiness}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[14px] border border-dashed border-[#D0D5DD] px-4 py-10 text-center text-sm font-medium text-[#98A2B3]">
                No transactions match the current search.
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-[#EAECF0] px-4 py-4 sm:gap-3 sm:px-6">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#D0D5DD] text-[#667085] transition hover:bg-[#F8FAFC] disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-[14px] font-semibold leading-5",
                    currentPage === page
                      ? "border border-[#071B58] bg-white text-[#101828]"
                      : "text-[#98A2B3]",
                  )}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#D0D5DD] text-[#667085] transition hover:bg-[#F8FAFC] disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      <TransactionDetailsSidebar
        open={Boolean(selectedTransaction)}
        transaction={selectedTransaction}
        initialAction={sidebarAction}
        onConsumeInitialAction={() => setSidebarAction(null)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTransactionId(null);
            setSidebarAction(null);
          }
        }}
        onApplyAction={handleApplyAction}
      />
    </DashboardLayout>
  );
}
