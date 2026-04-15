import type {
  ContractorAccountStatus,
  ContractorCurrentStatus,
  ContractorDetailsTabValue,
  ContractorFilters,
  ContractorRecord,
} from "./contractors.types";
import {
  isWithinInclusiveRange,
  parseDateForFilter,
} from "@/components/dashboard/shared/filters/filter-schema";

export function getContractorDetailsById(
  contractors: ContractorRecord[],
  contractorId: string | undefined,
) {
  if (!contractorId) {
    return null;
  }

  return contractors.find((contractor) => contractor.id === contractorId) ?? null;
}

export function getContractorAccountStatusClasses(
  status: ContractorAccountStatus,
) {
  if (status === "Active") {
    return "bg-[#DCFCE7] text-[#22A75A]";
  }

  return "bg-[#FEE4E2] text-[#F04438]";
}

export function getContractorCurrentStatusClasses(
  status: ContractorCurrentStatus,
) {
  if (status === "Online") {
    return "text-[#16A34A]";
  }

  if (status === "Busy") {
    return "text-[#F59E0B]";
  }

  return "text-[#EF4444]";
}

export function filterContractors(
  contractors: ContractorRecord[],
  filters: ContractorFilters,
) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const fromDate = filters.from ? parseDateForFilter(filters.from) : null;
  const toDate = filters.to ? parseDateForFilter(filters.to) : null;

  return contractors.filter((contractor) => {
    if (filters.accountStatus !== "all" && contractor.accountStatus !== filters.accountStatus) {
      return false;
    }

    if (filters.currentStatus !== "all" && contractor.currentStatus !== filters.currentStatus) {
      return false;
    }

    if (filters.specialty !== "all" && contractor.serviceCategory !== filters.specialty) {
      return false;
    }

    if (fromDate || toDate) {
      const joined = parseDateForFilter(contractor.dateJoined);
      if (!joined) {
        return false;
      }
      if (!isWithinInclusiveRange(joined, fromDate, toDate)) {
        return false;
      }
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchable = [
      contractor.name,
      contractor.email,
      contractor.location,
      contractor.currentStatus,
      contractor.accountStatus,
      contractor.serviceCategory,
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalizedQuery);
  });
}

export function getContractorInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getContractorDetailsTabLabel(value: ContractorDetailsTabValue) {
  if (value === "personal-details") {
    return "Personal details";
  }

  if (value === "kyc-verification") {
    return "KYC verification(0/3)";
  }

  if (value === "request-history") {
    return "Request history";
  }

  return "Transaction history";
}
