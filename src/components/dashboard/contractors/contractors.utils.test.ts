import { describe, expect, it } from "vitest";
import { filterContractors } from "./contractors.utils";
import type { ContractorRecord } from "./contractors.types";

function createContractor(
  overrides: Partial<ContractorRecord> = {},
): ContractorRecord {
  return {
    id: "contractor-1",
    name: "Emery Torff",
    email: "emery@example.com",
    phone: "+234000000000",
    location: "Lagos",
    currentStatus: "Online",
    totalServicesProvided: 14,
    dateJoined: "Apr 12, 2023",
    accountStatus: "Active",
    lifecycleState: "Active",
    serviceCategory: "Plumbing",
    bio: "Experienced contractor",
    firstName: "Emery",
    lastName: "Torff",
    gender: "Male",
    servicesProvided: ["Plumbing"],
    locations: [
      {
        id: "location-1",
        primaryLine: "Lagos",
        secondaryLine: "Nigeria",
        isCurrent: true,
      },
    ],
    verificationState: "Verified",
    rating: 4.8,
    totalRatings: 42,
    acceptanceRate: 0.92,
    completionRate: 0.96,
    responseTimeLabel: "4 min avg",
    totalJobsOffered: 50,
    totalJobsAccepted: 46,
    totalJobsCompleted: 44,
    repeatedComplaints: 0,
    lastActiveLabel: "2 mins ago",
    serviceZoneLabel: "Lagos",
    riskLevel: "Low",
    riskFlags: ["Verified"],
    payoutStatus: "Ready",
    pendingPayoutAmount: "$0",
    ...overrides,
  };
}

describe("filterContractors", () => {
  it("applies query, status, specialty, and date filters together", () => {
    const contractors = [
      createContractor(),
      createContractor({
        id: "contractor-2",
        name: "Maren Dokidis",
        email: "maren@example.com",
        currentStatus: "Busy",
        serviceCategory: "Cleaning",
        dateJoined: "Jun 18, 2023",
      }),
      createContractor({
        id: "contractor-3",
        name: "Cooper Siphron",
        email: "cooper@example.com",
        accountStatus: "Deactivated",
        dateJoined: "Jul 22, 2023",
      }),
    ];

    const results = filterContractors(contractors, {
      query: "maren",
      currentStatus: "Busy",
      accountStatus: "all",
      specialty: "Cleaning",
      from: "2023-06-01",
      to: "2023-06-30",
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("contractor-2");
  });
});
