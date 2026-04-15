import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { cn } from "@/lib/utils";
import {
  Dialog,
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
import type {
  ContractorRecord,
  ContractorTransactionStatus,
  ContractorTransactionType,
} from "../contractors/contractors.types";
import { toast } from "sonner";
import { filterTransactions } from "./transactions.utils";

type TransactionStatusAction = "approve" | "reject";

type TransactionSummaryCard = {
  title: string;
  value: string;
  highlighted?: boolean;
  Icon: typeof TotalRevenueIcon;
};

type TransactionRecord = {
  id: string;
  transactionCode: string;
  contractorId: string;
  contractorName: string;
  contractorEmail: string;
  type: ContractorTransactionType;
  amount: number;
  dateJoined: string;
  status: ContractorTransactionStatus;
  accountNumber: string;
  accountName: string;
  bankName: string;
  fee: number;
};

const transactionBlueprints: Array<{
  contractorId: string;
  type: ContractorTransactionType;
  amount: number;
  status: ContractorTransactionStatus;
}> = [
  {
    contractorId: "emery-torff",
    type: "Withdrawal",
    amount: -500,
    status: "Completed",
  },
  {
    contractorId: "maren-dokidis",
    type: "Service payment",
    amount: 500,
    status: "Pending",
  },
  {
    contractorId: "cooper-siphron",
    type: "Withdrawal",
    amount: -500,
    status: "Failed",
  },
  {
    contractorId: "marcus-dias",
    type: "Service payment",
    amount: 500,
    status: "Completed",
  },
  {
    contractorId: "ahmad-stanton-1",
    type: "Service payment",
    amount: 500,
    status: "Completed",
  },
  {
    contractorId: "ahmad-stanton-2",
    type: "Service payment",
    amount: -500,
    status: "Pending",
  },
  {
    contractorId: "ahmad-stanton-3",
    type: "Service payment",
    amount: -500,
    status: "Completed",
  },
  {
    contractorId: "ahmad-stanton-4",
    type: "Withdrawal",
    amount: -500,
    status: "Completed",
  },
];

const transactionTypes: ContractorTransactionType[] = [
  "Withdrawal",
  "Service payment",
];
const transactionStatuses: ContractorTransactionStatus[] = [
  "Completed",
  "Pending",
  "Failed",
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
    options: transactionTypes.map((type) => ({
      label: type,
      value: type,
    })),
  },
  {
    type: "select",
    key: "status",
    label: "Status",
    options: transactionStatuses.map((status) => ({
      label: status,
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

function formatSignedCurrency(amount: number) {
  const absoluteAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: absoluteAmount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: absoluteAmount % 1 === 0 ? 0 : 2,
  }).format(absoluteAmount);

  if (amount > 0) {
    return `+${formatted}`;
  }

  if (amount < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

function formatAbsoluteCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

function getStatusPillClassName(status: ContractorTransactionStatus) {
  if (status === "Completed") {
    return "bg-[#E8F8EE] text-[#22C55E]";
  }

  if (status === "Pending") {
    return "bg-[#FEF3E8] text-[#F79009]";
  }

  return "bg-[#FEE4E2] text-[#F04438]";
}

function getStatusTextClassName(status: ContractorTransactionStatus) {
  if (status === "Completed") {
    return "text-[#22C55E]";
  }

  if (status === "Pending") {
    return "text-[#F79009]";
  }

  return "text-[#F04438]";
}

function getNextTransactionStatus(action: TransactionStatusAction) {
  return action === "approve" ? "Completed" : "Failed";
}

function getTransactionInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 1);
}

function buildTransactions(
  contractors: ContractorRecord[],
): TransactionRecord[] {
  const contractorById = new Map(
    contractors.map((contractor) => [contractor.id, contractor]),
  );

  return Array.from({ length: 6 }, (_, pageIndex) =>
    transactionBlueprints.map((blueprint, rowIndex) => {
      const contractor =
        contractorById.get(blueprint.contractorId) ?? contractors[0];
      const sequence = pageIndex * transactionBlueprints.length + rowIndex;

      return {
        id: `transaction-${sequence + 1}`,
        transactionCode: `#${12345 + sequence}`,
        contractorId: contractor.id,
        contractorName: contractor.name,
        contractorEmail: contractor.email,
        type: blueprint.type,
        amount: blueprint.amount,
        dateJoined: "Apr 12, 2023",
        status: blueprint.status,
        accountNumber: `00${1234567890 + sequence}`,
        accountName: contractor.name,
        bankName:
          pageIndex % 2 === 0 ? "United Bank for Africa" : "Access Bank",
        fee: 4.99,
      };
    }),
  ).flat();
}

function TransactionSummaryCard({ card }: { card: TransactionSummaryCard }) {
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
          card.title === "Pending Transactions" ? "w-[428px]" : "w-[318px]",
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
            + 2.3% vs Yesterday
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

function TransactionStatusMenu({
  onSelectAction,
}: {
  onSelectAction: (action: TransactionStatusAction) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-[10px] border border-[#B1B5C0] bg-[#041133] px-4 py-[13px] text-[14px] font-medium text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/25"
          aria-label="Update transaction status"
        >
          Update Status
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
          onClick={() => onSelectAction("approve")}
          className="rounded-none px-4 py-3 text-[14px] font-medium text-[#22C55E] focus:bg-[#F8FAFC] focus:text-[#16A34A]"
        >
          Approve Transaction
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#EAECF0]" />
        <DropdownMenuItem
          onClick={() => onSelectAction("reject")}
          className="rounded-none px-4 py-3 text-[14px] font-medium text-[#F04438] focus:bg-[#F8FAFC] focus:text-[#D92D20]"
        >
          Reject Transaction
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TransactionDetailsSidebar({
  open,
  transaction,
  onOpenChange,
  onUpdateStatus,
}: {
  open: boolean;
  transaction: TransactionRecord | null;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (action: TransactionStatusAction) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[60] bg-[rgba(15,23,42,0.16)] backdrop-blur-[4px] data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 top-auto z-[70] grid h-[92dvh] max-h-[92dvh] w-full translate-y-0 gap-0 rounded-t-[28px] border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] outline-none duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom sm:inset-x-auto sm:right-0 sm:top-0 sm:h-screen sm:max-h-screen sm:w-[363px] sm:rounded-none sm:rounded-l-[10px] sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right">
          <DialogTitle className="sr-only">Transaction details</DialogTitle>
          <DialogDescription className="sr-only">
            Review transaction details and update the selected transaction
            status.
          </DialogDescription>
          <div className="flex h-full flex-col overflow-y-auto px-[12px] pb-[12px] pt-[14px] sm:px-[12px] sm:pb-[12px] sm:pt-[14px]">
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

                <div className="mt-[14px]">
                  <p className="text-[12px] font-semibold leading-4 text-[#101828]">
                    User
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
                  {[
                    ["Transaction ID", transaction.transactionCode],
                    ["Transaction Type", transaction.type],
                    ["Account number", transaction.accountNumber],
                    ["Account name", transaction.accountName],
                    ["Bank account", transaction.bankName],
                    ["Amount", formatAbsoluteCurrency(transaction.amount)],
                    ["Fee", formatAbsoluteCurrency(transaction.fee)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 border-b border-[#EAECF0] px-[10px] py-[11px] last:border-b-0"
                    >
                      <span className="text-[14px] font-normal leading-5 text-[#98A2B3]">
                        {label}
                      </span>
                      <span className="text-right text-[14px] font-semibold leading-5 text-[#2D2D2D]">
                        {value}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4 px-[10px] py-[11px]">
                    <span className="text-[14px] font-normal leading-5 text-[#98A2B3]">
                      Status
                    </span>
                    <span
                      className={cn(
                        "text-right text-[14px] font-semibold leading-5",
                        getStatusTextClassName(transaction.status),
                      )}
                    >
                      • {transaction.status}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <TransactionStatusMenu onSelectAction={onUpdateStatus} />
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
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

function TransactionActionMenu({
  transactionCode,
  onViewDetails,
}: {
  transactionCode: string;
  onViewDetails: () => void;
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
        className="w-[190px] rounded-[10px] border border-[#EAECF0] bg-white p-0 shadow-[0_18px_38px_rgba(15,23,42,0.12)]"
      >
        <DropdownMenuItem
          onClick={onViewDetails}
          className="h-[36px] rounded-[10px] px-[10px] py-[10px] text-[12px] font-semibold leading-4 text-[#2D3036] focus:bg-[#F8FAFC] focus:text-[#2D3036]"
        >
          View details
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() =>
    buildTransactions(contractorRecords),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const pageSize = expanded ? 10 : 5;
  const { filters: urlFilters } = useUrlFilters({
    schema: transactionFiltersSchema,
    defaults: transactionFilterDefaults,
  });

  const typeFilter =
    urlFilters.type &&
    transactionTypes.includes(urlFilters.type as ContractorTransactionType)
      ? String(urlFilters.type)
      : null;
  const statusFilter =
    urlFilters.status &&
    transactionStatuses.includes(
      urlFilters.status as ContractorTransactionStatus,
    )
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
    setCurrentPage(1);
  }, [
    searchQuery,
    expanded,
    typeFilter,
    statusFilter,
    minAmountFilter,
    maxAmountFilter,
    fromFilter,
    toFilter,
  ]);

  const filteredTransactions = useMemo(
    () =>
      filterTransactions(transactions, {
        query: searchQuery,
        type: typeFilter,
        status: statusFilter,
        minAmount: minAmountFilter,
        maxAmount: maxAmountFilter,
        from: fromFilter,
        to: toFilter,
      }),
    [
      transactions,
      searchQuery,
      typeFilter,
      statusFilter,
      minAmountFilter,
      maxAmountFilter,
      fromFilter,
      toFilter,
    ],
  );

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
  const pendingTransactionsCount = transactions.filter(
    (transaction) => transaction.status === "Pending",
  ).length;

  const summaryCards = useMemo<TransactionSummaryCard[]>(
    () => [
      {
        title: "Available balance",
        value: "$15,837",
        highlighted: true,
        Icon: TotalRevenueIcon,
      },
      {
        title: "Total Inflow",
        value: "$100,000",
        Icon: RevenueIcon as typeof TotalRevenueIcon,
      },
      {
        title: "Total Payouts",
        value: "-$100,000",
        Icon: RevenueIcon as typeof TotalRevenueIcon,
      },
      {
        title: "Pending Transactions",
        value: String(pendingTransactionsCount),
        Icon: TotalRequestsIcon as typeof TotalRevenueIcon,
      },
    ],
    [pendingTransactionsCount],
  );

  const handleViewDetails = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
  };

  const handleUpdateStatus = (action: TransactionStatusAction) => {
    if (!selectedTransactionId) {
      return;
    }

    const nextStatus = getNextTransactionStatus(action);

    setTransactions((currentTransactions) =>
      currentTransactions.map((transaction) =>
        transaction.id === selectedTransactionId
          ? { ...transaction, status: nextStatus }
          : transaction,
      ),
    );

    toast.success(
      action === "approve"
        ? "Transaction approved successfully."
        : "Transaction rejected successfully.",
    );
  };

  return (
    <DashboardLayout title="Transactions">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <TransactionSummaryCard key={card.title} card={card} />
          ))}
        </div>

        <section className="overflow-hidden rounded-[16px] border border-[#EAECF0] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#EAECF0] px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[14px] font-semibold leading-5 text-[#98A2B3]">
              All Requests
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <label className="relative min-w-0 sm:w-[294px]">
                <Search className="pointer-events-none absolute left-[14px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#101828]" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search Contractors ..."
                  className="h-[42px] rounded-[10px] border-[#EAECF0] bg-[#FCFCFD] pl-[40px] text-[14px] text-[#667085] placeholder:text-[#98A2B3]"
                  aria-label="Search transactions"
                />
              </label>
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

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-[14px] font-semibold leading-5 text-[#667085]">
                  <th className="px-6 py-4">Trans ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Transaction Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date Joined</th>
                  <th className="px-6 py-4">Status</th>
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
                      <td className="px-6 py-4 text-[14px] leading-5 text-[#98A2B3]">
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
                      <td className="px-6 py-4 text-[14px] leading-5 text-[#98A2B3]">
                        {formatSignedCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 text-[14px] leading-5 text-[#98A2B3]">
                        {transaction.dateJoined}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-[14px] font-medium leading-5",
                            getStatusPillClassName(transaction.status),
                          )}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <TransactionActionMenu
                          transactionCode={transaction.transactionCode}
                          onViewDetails={() =>
                            handleViewDetails(transaction.id)
                          }
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
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
                        {transaction.dateJoined}
                      </p>
                    </div>
                    <TransactionActionMenu
                      transactionCode={transaction.transactionCode}
                      onViewDetails={() => handleViewDetails(transaction.id)}
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
                  <div className="mt-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-[14px] font-medium leading-5",
                        getStatusPillClassName(transaction.status),
                      )}
                    >
                      {transaction.status}
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
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTransactionId(null);
          }
        }}
        onUpdateStatus={handleUpdateStatus}
      />
    </DashboardLayout>
  );
}
