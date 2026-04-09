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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import summaryCardPattern from "@/assets/overview/summary-card-pattern.png";
import {
  RevenueIcon,
  TotalRequestsIcon,
  TotalRevenueIcon,
} from "@/ui/icons";
import { toast } from "sonner";
import {
  getContractorTransactionRecords,
} from "./contractors.data";
import type {
  ContractorRecord,
  ContractorTransactionRecord,
  ContractorTransactionStatus,
} from "./contractors.types";

type ContractorTransactionHistoryTabProps = {
  contractor: ContractorRecord;
};

type TransactionSummaryCard = {
  title: string;
  value: string;
  highlighted?: boolean;
  Icon: typeof TotalRevenueIcon;
};

type TransactionStatusAction = "approve" | "reject";

function formatCurrency(amount: number) {
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

function formatStatus(status: ContractorTransactionStatus) {
  if (status === "Completed") {
    return "bg-[#E8F8EE] text-[#22C55E]";
  }

  if (status === "Pending") {
    return "bg-[#FEF3E8] text-[#F79009]";
  }

  return "bg-[#FEE4E2] text-[#F04438]";
}

function getNextTransactionStatus(action: TransactionStatusAction) {
  return action === "approve" ? "Completed" : "Failed";
}

function TransactionSummaryCard({
  card,
}: {
  card: TransactionSummaryCard;
}) {
  const Icon = card.Icon;

  return (
    <article
      className={[
        "relative overflow-hidden rounded-[16px] border p-5 shadow-sm",
        card.highlighted
          ? "border-[#07133A] bg-[linear-gradient(135deg,#020817_0%,#041B5C_100%)]"
          : "border-[#EAECF0] bg-[#FAFAFA]",
      ].join(" ")}
    >
      <img
        src={summaryCardPattern}
        alt=""
        aria-hidden="true"
        className={[
          "absolute -left-[26px] -top-[14px] hidden h-[156px] max-w-none rotate-180 opacity-80 lg:block",
          card.title === "Pending Transactions" ? "w-[428px]" : "w-[317px]",
        ].join(" ")}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p
            className={[
              "text-sm font-medium",
              card.highlighted ? "text-[#EEF3E6]" : "text-[#98A2B3]",
            ].join(" ")}
          >
            {card.title}
          </p>
          <p
            className={[
              "mt-5 text-[16px] font-bold tracking-[-0.03em] sm:text-[28px]",
              card.highlighted ? "text-white" : "text-[#101828]",
            ].join(" ")}
          >
            {card.value}
          </p>
          <p
            className={[
              "mt-3 text-sm font-medium",
              card.highlighted ? "text-[#B1B5C0]" : "text-[#16A34A]",
            ].join(" ")}
          >
            + 2.3% vs Yesterday
          </p>
        </div>
        <span
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-[8px] border",
            card.highlighted
              ? "border-[#36415C] bg-[#02091C]"
              : "border-[#EAECF0] bg-white",
          ].join(" ")}
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
          className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-[10px] border border-[#B1B5C0] bg-[#041133] px-4 py-[13px] text-sm font-medium text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/25"
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
        className="z-[90] w-[360px] max-w-[calc(100vw-48px)] rounded-[14px] border border-[#EAECF0] bg-white p-0 shadow-[0_24px_40px_rgba(15,23,42,0.14)]"
      >
        <DropdownMenuItem
          onClick={() => onSelectAction("approve")}
          className="rounded-none px-4 py-3 text-sm font-medium text-[#22C55E] focus:bg-[#F8FAFC] focus:text-[#16A34A]"
        >
          Approve Transaction
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#EAECF0]" />
        <DropdownMenuItem
          onClick={() => onSelectAction("reject")}
          className="rounded-none px-4 py-3 text-sm font-medium text-[#F04438] focus:bg-[#F8FAFC] focus:text-[#D92D20]"
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
  transaction: ContractorTransactionRecord | null;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (action: TransactionStatusAction) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inset-x-0 bottom-0 top-auto z-[60] grid h-[92dvh] max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-t-[28px] rounded-b-none border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] duration-300 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:inset-x-auto sm:left-auto sm:right-0 sm:top-0 sm:h-screen sm:max-h-screen sm:w-[363px] sm:rounded-none sm:rounded-l-[10px] sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right [&>button]:hidden">
        <DialogTitle className="sr-only">Transaction details</DialogTitle>
        <DialogDescription className="sr-only">
          Review transaction details and update the transaction status.
        </DialogDescription>
        <div className="flex h-full flex-col overflow-y-auto px-[14px] pb-[14px] pt-[18px]">
          {transaction ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[16px] font-bold text-black">
                  Transaction details
                </h2>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-black transition hover:bg-[#F5F5F5]"
                  aria-label="Close transaction details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 overflow-hidden rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD]">
                {[
                  ["Transaction ID", transaction.transactionCode],
                  ["Account number", transaction.accountNumber],
                  ["Account name", transaction.accountName],
                  ["Bank account", transaction.bankName],
                  ["Amount", formatCurrency(Math.abs(transaction.amount))],
                  ["Fee", formatCurrency(transaction.fee)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 border-b border-[#EAECF0] px-3 py-4 last:border-b-0"
                  >
                    <span className="text-sm text-[#98A2B3]">{label}</span>
                    <span className="text-sm font-semibold text-[#101828]">
                      {value}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 px-3 py-4">
                  <span className="text-sm text-[#98A2B3]">Status</span>
                  <span
                    className={[
                      "text-sm font-semibold",
                      transaction.status === "Completed"
                        ? "text-[#22C55E]"
                        : transaction.status === "Pending"
                          ? "text-[#F79009]"
                          : "text-[#F04438]",
                    ].join(" ")}
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
      </DialogContent>
    </Dialog>
  );
}

export function ContractorTransactionHistoryTab({
  contractor,
}: ContractorTransactionHistoryTabProps) {
  const [transactions, setTransactions] = useState<ContractorTransactionRecord[]>(
    () => getContractorTransactionRecords(contractor.id),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const pageSize = 5;

  useEffect(() => {
    setTransactions(getContractorTransactionRecords(contractor.id));
    setSearchQuery("");
    setCurrentPage(1);
    setSelectedTransactionId(null);
  }, [contractor.id]);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return transactions;
    }

    return transactions.filter((transaction) =>
      [
        transaction.transactionCode,
        transaction.type,
        transaction.accountName,
        transaction.bankName,
        transaction.dateTime,
        transaction.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery, transactions]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / pageSize),
  );

  const currentRows = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const selectedTransaction = useMemo(
    () =>
      transactions.find((transaction) => transaction.id === selectedTransactionId) ??
      null,
    [selectedTransactionId, transactions],
  );

  const pendingTransactionsCount = transactions.filter(
    (transaction) => transaction.status === "Pending",
  ).length;

  const summaryCards = useMemo(
    () => [
      {
        title: "Available balance",
        value: "$15,837",
        highlighted: true,
        Icon: TotalRevenueIcon,
      },
      {
        title: "Total Earnings",
        value: "$100,000",
        Icon: RevenueIcon as typeof TotalRevenueIcon,
      },
      {
        title: "Total Withdrawals",
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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
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
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <TransactionSummaryCard key={card.title} card={card} />
        ))}
      </div>

      <section className="rounded-[20px] border border-[#EAECF0] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#EAECF0] px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm font-semibold text-[#667085]">
            All Transactions
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
              <Input
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search..."
                className="h-11 w-full rounded-[14px] border-[#EAECF0] bg-[#FCFCFD] pl-11 sm:w-[208px]"
              />
            </label>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#EAECF0] bg-[#FCFCFD] text-[#667085]"
              aria-label="Filter transactions"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-sm font-semibold text-[#667085]">
                <th className="px-6 py-4">Trans ID</th>
                <th className="px-6 py-4">Transaction Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date and time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {currentRows.length ? (
                currentRows.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-t border-[#EAECF0] align-top"
                  >
                    <td className="px-6 py-6 text-base text-[#98A2B3]">
                      {transaction.transactionCode}
                    </td>
                    <td className="px-6 py-6 text-base font-semibold text-[#101828]">
                      {transaction.type}
                    </td>
                    <td className="px-6 py-6 text-base text-[#98A2B3]">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-6 text-base text-[#98A2B3]">
                      {transaction.dateTime}
                    </td>
                    <td className="px-6 py-6">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-base font-medium",
                          formatStatus(transaction.status),
                        ].join(" ")}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTransactionId(transaction.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#EAECF0] bg-white text-[#101828]"
                        aria-label={`Open transaction details for ${transaction.transactionCode}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm font-medium text-[#98A2B3]"
                  >
                    No transactions match the current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-[#EAECF0] px-6 py-4">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#D0D5DD] text-[#667085] disabled:opacity-50"
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
                className={[
                  "inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-sm font-semibold",
                  currentPage === page
                    ? "border border-[#071B58] bg-white text-[#101828]"
                    : "text-[#98A2B3]",
                ].join(" ")}
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#D0D5DD] text-[#667085] disabled:opacity-50"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

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
    </div>
  );
}
