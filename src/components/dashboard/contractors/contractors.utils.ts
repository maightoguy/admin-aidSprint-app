import type {
  ContractorAccountStatus,
  ContractorCurrentStatus,
  ContractorFilters,
  ContractorRecord,
} from "./contractors.types";

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

  return contractors.filter((contractor) => {
    if (filters.accountStatus !== "all" && contractor.accountStatus !== filters.accountStatus) {
      return false;
    }

    if (filters.currentStatus !== "all" && contractor.currentStatus !== filters.currentStatus) {
      return false;
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
