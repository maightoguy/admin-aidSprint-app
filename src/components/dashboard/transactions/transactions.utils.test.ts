import { describe, expect, it } from "vitest";
import {
  filterTransactions,
  type TransactionFilterableRecord,
} from "./transactions.utils";

function createTransaction(
  overrides: Partial<TransactionFilterableRecord> = {},
): TransactionFilterableRecord {
  return {
    id: "transaction-1",
    transactionCode: "#12345",
    contractorName: "Emery Torff",
    contractorEmail: "emery@example.com",
    type: "Withdrawal",
    amount: -500,
    dateJoined: "Apr 12, 2023",
    status: "Pending",
    accountName: "Emery Torff",
    bankName: "Access Bank",
    ...overrides,
  };
}

describe("filterTransactions", () => {
  it("filters by type, status, absolute amount, date, and query", () => {
    const transactions = [
      createTransaction(),
      createTransaction({
        id: "transaction-2",
        transactionCode: "#12346",
        contractorName: "Maren Dokidis",
        contractorEmail: "maren@example.com",
        type: "Service payment",
        amount: 850,
        dateJoined: "Jun 10, 2023",
        status: "Completed",
      }),
      createTransaction({
        id: "transaction-3",
        transactionCode: "#12347",
        contractorName: "Cooper Siphron",
        contractorEmail: "cooper@example.com",
        amount: -1200,
        dateJoined: "Jul 18, 2023",
        status: "Failed",
      }),
    ];

    const results = filterTransactions(transactions, {
      query: "maren",
      type: "Service payment",
      status: "Completed",
      minAmount: 800,
      maxAmount: 900,
      from: "2023-06-01",
      to: "2023-06-30",
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("transaction-2");
  });
});
