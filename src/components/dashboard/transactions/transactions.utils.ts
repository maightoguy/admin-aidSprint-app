import {
  isWithinInclusiveRange,
  parseDateForFilter,
} from "../shared/filters/filter-schema";

export type TransactionFilterableRecord = {
  id: string;
  transactionCode: string;
  contractorName: string;
  contractorEmail: string;
  type: string;
  amount: number;
  dateJoined: string;
  status: string;
  accountName: string;
  bankName: string;
};

export type TransactionTableFilters = {
  query: string;
  type: string | null;
  status: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  from: string | null;
  to: string | null;
};

export function filterTransactions<T extends TransactionFilterableRecord>(
  transactions: T[],
  filters: TransactionTableFilters,
) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const fromDate = filters.from ? parseDateForFilter(filters.from) : null;
  const toDate = filters.to ? parseDateForFilter(filters.to) : null;

  return transactions.filter((transaction) => {
    if (filters.type && transaction.type !== filters.type) {
      return false;
    }

    if (filters.status && transaction.status !== filters.status) {
      return false;
    }

    const absoluteAmount = Math.abs(transaction.amount);
    if (
      typeof filters.minAmount === "number" &&
      absoluteAmount < filters.minAmount
    ) {
      return false;
    }

    if (
      typeof filters.maxAmount === "number" &&
      absoluteAmount > filters.maxAmount
    ) {
      return false;
    }

    if (fromDate || toDate) {
      const transactionDate = parseDateForFilter(transaction.dateJoined);
      if (!transactionDate) {
        return false;
      }

      if (!isWithinInclusiveRange(transactionDate, fromDate, toDate)) {
        return false;
      }
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      transaction.transactionCode,
      transaction.contractorName,
      transaction.contractorEmail,
      transaction.type,
      transaction.status,
      transaction.accountName,
      transaction.bankName,
      transaction.dateJoined,
      String(absoluteAmount),
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
}
