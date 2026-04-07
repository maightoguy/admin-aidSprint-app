import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreVertical,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { ContractorRecord } from "./contractors.types";
import { userDetailsRecords } from "../user-details/user-details.data";

type ContractorRequestHistoryTabProps = {
  contractor: ContractorRecord;
};

type ContractorRequestRow = {
  requestId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  service: string;
  location: string;
  date: string;
  status: string;
};

function formatMetricValue(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getRequestStatusClasses(status: string) {
  if (status === "Active") {
    return "bg-[#E9F9EF] text-[#16A34A]";
  }

  if (status === "Pending") {
    return "bg-[#FFF4DB] text-[#B7791F]";
  }

  return "bg-[#FEE4E2] text-[#F04438]";
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-[20px] border border-[#EAECF0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#98A2B3]">{title}</p>
          <p className="mt-5 text-[28px] font-bold tracking-[-0.03em] text-[#101828]">
            {value}
          </p>
          <p className="mt-3 text-sm font-medium text-[#16A34A]">
            + 2.3% vs Yesterday
          </p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#EAECF0] bg-white text-[#071B58]">
          <FileText className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

export function ContractorRequestHistoryTab({
  contractor,
}: ContractorRequestHistoryTabProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const linkedUserDetails = useMemo(
    () =>
      userDetailsRecords.find((record) => record.id === contractor.id) ?? null,
    [contractor.id],
  );

  const requestRows = useMemo<ContractorRequestRow[]>(() => {
    if (!linkedUserDetails) {
      return [];
    }

    return linkedUserDetails.requestHistory.map((request) => ({
      requestId: request.id,
      userId: linkedUserDetails.id,
      customerName: linkedUserDetails.name,
      customerEmail: linkedUserDetails.email,
      service: request.service,
      location: request.location,
      date: request.date,
      status: request.status,
    }));
  }, [linkedUserDetails]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return requestRows;
    }

    return requestRows.filter((row) =>
      [
        row.customerName,
        row.customerEmail,
        row.service,
        row.location,
        row.requestId,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [requestRows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const activeRequestCount = requestRows.filter(
    (row) => row.status === "Active" || row.status === "Pending",
  ).length;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleViewDetails = (row: ContractorRequestRow) => {
    navigate(
      `/users/${row.userId}?tab=request-history&requestId=${row.requestId}`,
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-2">
        <SummaryCard
          title="Total Service completed"
          value={formatMetricValue(contractor.totalServicesProvided)}
        />
        <SummaryCard
          title="Active Request"
          value={formatMetricValue(activeRequestCount)}
        />
      </div>

      <section className="rounded-[20px] border border-[#EAECF0] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#EAECF0] px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm font-semibold text-[#667085]">All requests</p>
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
              aria-label="Filter requests"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-sm font-semibold text-[#667085]">
                <th className="px-6 py-4">Name of users</th>
                <th className="px-6 py-4">Service requested</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Date and time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length ? (
                currentRows.map((row) => (
                  <tr
                    key={row.requestId}
                    className="border-t border-[#EAECF0] align-top"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] text-base font-semibold text-[#344054]">
                          {row.customerName[0]}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-[#101828]">
                            {row.customerName}
                          </p>
                          <p className="truncate text-sm text-[#98A2B3]">
                            {row.customerEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-base font-semibold text-[#101828]">
                      {row.service}
                    </td>
                    <td className="max-w-[240px] px-6 py-6 text-base text-[#667085]">
                      <span className="line-clamp-1">{row.location}</span>
                    </td>
                    <td className="px-6 py-6 text-base text-[#667085]">
                      {row.date}
                    </td>
                    <td className="px-6 py-6">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-base font-medium",
                          getRequestStatusClasses(row.status),
                        ].join(" ")}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#EAECF0] bg-white text-[#101828]"
                            aria-label={`Open request actions for ${row.requestId}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-[180px] rounded-[12px] border border-[#EAECF0] bg-white p-1 shadow-[0_12px_36px_rgba(15,23,42,0.12)]"
                        >
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(row)}
                            className="rounded-[10px] px-3 py-2.5 text-sm font-semibold text-[#344054]"
                          >
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm font-medium text-[#98A2B3]"
                  >
                    No requests match the current search.
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
    </div>
  );
}
