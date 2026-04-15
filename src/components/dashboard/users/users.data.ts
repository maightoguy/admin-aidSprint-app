import summaryCardPattern from "@/assets/overview/summary-card-pattern.png";
import { TotalUsersIcon } from "@/ui/icons";
import type { UserRecord, UsersSummaryCard } from "./users.types";

export const usersSummaryPattern = summaryCardPattern;

export const usersSummaryCards: UsersSummaryCard[] = [
  {
    title: "Total users",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    Icon: TotalUsersIcon,
  },
  {
    title: "Active users",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    Icon: TotalUsersIcon,
  },
  {
    title: "Deactivated users",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    Icon: TotalUsersIcon,
  },
];

const userSeedRecords: UserRecord[] = [
  {
    id: "emery-torff",
    name: "Emery Torff",
    email: "thekdfisher@email.com",
    location: "163 Owode-Sango Road",
    totalServicesRequested: 0,
    dateJoined: "Apr 12, 2023",
    status: "Active",
    role: "Admin",
  },
  {
    id: "maren-dokidis",
    name: "Maren Dokidis",
    email: "thekdfisher@email.com",
    location: "34 Awgu-Mgbidi Road",
    totalServicesRequested: 100,
    dateJoined: "Apr 12, 2023",
    status: "Deactivated",
    role: "User",
  },
  {
    id: "cooper-siphron",
    name: "Cooper Siphron",
    email: "thekdfisher@email.com",
    location: "170 Ejigbo-Apomu Road",
    totalServicesRequested: 50,
    dateJoined: "Apr 12, 2023",
    status: "Active",
    role: "User",
  },
  {
    id: "marcus-dias",
    name: "Marcus Dias",
    email: "thekdfisher@email.com",
    location: "178 Omu-Aran Township",
    totalServicesRequested: 10,
    dateJoined: "Apr 12, 2023",
    status: "Deactivated",
    role: "User",
  },
  {
    id: "ahmad-stanton-1",
    name: "Ahmad Stanton",
    email: "thekdfisher@email.com",
    location: "113 Gashua-Bursari Road",
    totalServicesRequested: 5,
    dateJoined: "Apr 12, 2023",
    status: "Active",
    role: "User",
  },
  {
    id: "ahmad-stanton-2",
    name: "Ahmad Stanton",
    email: "thekdfisher@email.com",
    location: "113 Gashua-Bursari Road",
    totalServicesRequested: 2,
    dateJoined: "Apr 12, 2023",
    status: "Active",
    role: "User",
  },
  {
    id: "ahmad-stanton-3",
    name: "Ahmad Stanton",
    email: "thekdfisher@email.com",
    location: "113 Gashua-Bursari Road",
    totalServicesRequested: 1,
    dateJoined: "Apr 12, 2023",
    status: "Active",
    role: "User",
  },
  {
    id: "ahmad-stanton-4",
    name: "Ahmad Stanton",
    email: "thekdfisher@email.com",
    location: "113 Gashua-Bursari Road",
    totalServicesRequested: 30,
    dateJoined: "Apr 12, 2023",
    status: "Active",
    role: "Admin",
  },
];

function buildExpandedUserRecords(seed: UserRecord[]) {
  const start = new Date(2023, 3, 12);
  const expanded: UserRecord[] = [...seed];

  for (let index = 0; index < 24; index += 1) {
    const base = seed[index % seed.length];
    const date = new Date(start);
    date.setDate(start.getDate() + index * 9);
    const dateJoined = date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    expanded.push({
      ...base,
      id: `${base.id}-extra-${index + 1}`,
      email: `${base.id.replace(/-/g, ".")}.${index + 1}@email.com`,
      totalServicesRequested: base.totalServicesRequested + index * 2,
      dateJoined,
      status: index % 5 === 0 ? "Deactivated" : "Active",
      role: index % 7 === 0 ? "Admin" : "User",
    });
  }

  return expanded;
}

export const userRecords: UserRecord[] = buildExpandedUserRecords(userSeedRecords);
