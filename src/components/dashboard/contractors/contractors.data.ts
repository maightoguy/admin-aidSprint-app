import summaryCardPattern from "@/assets/overview/summary-card-pattern.png";
import {
  type ContractorDocumentRow,
  type ContractorRow,
  type JobRow,
  type PaymentRow,
  type ProfileRow,
  type ReviewRow,
  type SupabaseResult,
  type WithdrawalRow,
  supabaseContractorBankAccounts,
  supabaseContractorDocuments,
  supabaseContractors,
  supabaseFinance,
  supabaseJobs,
  supabaseProfiles,
  supabaseReviews,
} from "@/lib/supabase/data";
import {
  deriveContractorRiskState,
  deriveContractorVerificationState,
  formatDateLabel,
  mapContractorDocumentsToKycInitialState,
  mapContractorRowToContractorRecord,
  mapJobRowToUserRequestHistoryItem,
  mapPaymentRowToContractorTransactionRecord,
  mapWithdrawalRowToContractorTransactionRecord,
  sumPendingWithdrawalAmount,
} from "@/lib/supabase/mappers";
import { TotalContractorsIcon } from "@/ui/icons";
import type {
  ContractorKycState,
  ContractorLocationHistoryItem,
  ContractorRecord,
  ContractorTransactionRecord,
} from "./contractors.types";

export const contractorsSummaryPattern = summaryCardPattern;
export const contractorsSummaryIcon = TotalContractorsIcon;

type ContractorRecordSeed = Omit<
  ContractorRecord,
  "firstName" | "lastName" | "gender" | "servicesProvided" | "locations"
> &
  Partial<
    Pick<
      ContractorRecord,
      "firstName" | "lastName" | "gender" | "servicesProvided" | "locations"
    >
  >;

function enrichContractorRecord(record: ContractorRecordSeed): ContractorRecord {
  const [firstName = "", lastName = ""] = record.name.split(" ");

  return {
    ...record,
    firstName: record.firstName ?? firstName,
    lastName: record.lastName ?? lastName,
    gender: record.gender ?? "Male",
    servicesProvided: record.servicesProvided ?? [record.serviceCategory],
    locations: record.locations ?? [
      {
        id: `${record.id}-location-1`,
        primaryLine: record.location,
        secondaryLine: "Nigeria",
        isCurrent: true,
      },
      {
        id: `${record.id}-location-2`,
        primaryLine: "Plot 42, Las Vegas, USA",
        secondaryLine: "LA, USA.",
      },
      {
        id: `${record.id}-location-3`,
        primaryLine: "12 Allen Avenue",
        secondaryLine: "Ikeja, Nigeria",
      },
    ],
  };
}

const contractorRecordSeeds: ContractorRecordSeed[] = [
  {
    id: "emery-torff",
    name: "Emery Torff",
    email: "emery.torff@email.com",
    phone: "+234 801 555 1401",
    location: "163 Owode-Sango Road",
    currentStatus: "Online",
    totalServicesProvided: 0,
    dateJoined: "Apr 12, 2023",
    accountStatus: "Active",
    lifecycleState: "Active",
    serviceCategory: "Plumbing",
    bio: "Emergency plumbing specialist focused on rapid on-site diagnostics and urgent repairs.",
    gender: "Male",
    servicesProvided: ["Plumbing", "Electrician", "Carpentry"],
    verificationState: "Verified",
    rating: 4.8,
    totalRatings: 164,
    acceptanceRate: 0.94,
    completionRate: 0.98,
    responseTimeLabel: "4 min avg",
    totalJobsOffered: 214,
    totalJobsAccepted: 201,
    totalJobsCompleted: 197,
    repeatedComplaints: 1,
    lastActiveLabel: "2 mins ago",
    serviceZoneLabel: "Sango, Ota, Abeokuta axis",
    riskLevel: "Low",
    riskFlags: ["Verified", "High completion"],
    payoutStatus: "Ready",
    pendingPayoutAmount: "$420",
  },
  {
    id: "maren-dokidis",
    name: "Maren Dokidis",
    email: "maren.dokidis@email.com",
    phone: "+234 802 555 3204",
    location: "34 Awgu-Mgbidi Road",
    currentStatus: "Offline",
    totalServicesProvided: 100,
    dateJoined: "Apr 12, 2023",
    accountStatus: "Deactivated",
    lifecycleState: "Suspended",
    serviceCategory: "Cleaning",
    bio: "Commercial and residential cleaning contractor with deep-cleaning and flood response experience.",
    gender: "Female",
    servicesProvided: ["Cleaning", "Laundry"],
    verificationState: "Pending review",
    rating: 3.6,
    totalRatings: 42,
    acceptanceRate: 0.71,
    completionRate: 0.82,
    responseTimeLabel: "22 min avg",
    totalJobsOffered: 120,
    totalJobsAccepted: 85,
    totalJobsCompleted: 70,
    repeatedComplaints: 4,
    lastActiveLabel: "3 days ago",
    serviceZoneLabel: "Mgbidi cluster",
    riskLevel: "High",
    riskFlags: ["Low rating", "Repeated complaints", "KYC pending"],
    watchlistReason: "Repeated service complaints and incomplete verification follow-up.",
    payoutStatus: "Blocked",
    pendingPayoutAmount: "$180",
    payoutsBlockedReason: "Awaiting police check approval.",
  },
  {
    id: "cooper-siphron",
    name: "Cooper Siphron",
    email: "cooper.siphron@email.com",
    phone: "+234 803 555 5510",
    location: "170 Ejigbo-Apomu Road",
    currentStatus: "Online",
    totalServicesProvided: 50,
    dateJoined: "Apr 12, 2023",
    accountStatus: "Active",
    lifecycleState: "Active",
    serviceCategory: "Baby sitting",
    bio: "Child-care provider available for urgent family support and verified overnight assignments.",
    gender: "Male",
    servicesProvided: ["Baby sitting", "Cleaning"],
    verificationState: "Verified",
    rating: 4.2,
    totalRatings: 88,
    acceptanceRate: 0.83,
    completionRate: 0.91,
    responseTimeLabel: "11 min avg",
    totalJobsOffered: 146,
    totalJobsAccepted: 121,
    totalJobsCompleted: 110,
    repeatedComplaints: 1,
    lastActiveLabel: "12 mins ago",
    serviceZoneLabel: "Ejigbo and adjoining estates",
    riskLevel: "Medium",
    riskFlags: ["Response risk"],
    watchlistReason: "Response time is trending slower during peak-hour requests.",
    payoutStatus: "Ready",
    pendingPayoutAmount: "$265",
  },
  {
    id: "marcus-dias",
    name: "Marcus Dias",
    email: "marcus.dias@email.com",
    phone: "+234 804 555 8890",
    location: "178 Omu-Aran Township",
    currentStatus: "Busy",
    totalServicesProvided: 10,
    dateJoined: "Apr 12, 2023",
    accountStatus: "Deactivated",
    lifecycleState: "Suspended",
    serviceCategory: "Electrician",
    bio: "Licensed electrician supporting diagnostics, rewiring, and same-day emergency callouts.",
    gender: "Male",
    servicesProvided: ["Electrician", "Carpentry"],
    verificationState: "Rejected",
    rating: 3.9,
    totalRatings: 21,
    acceptanceRate: 0.68,
    completionRate: 0.78,
    responseTimeLabel: "17 min avg",
    totalJobsOffered: 95,
    totalJobsAccepted: 65,
    totalJobsCompleted: 51,
    repeatedComplaints: 3,
    lastActiveLabel: "1 day ago",
    serviceZoneLabel: "Omu-Aran township",
    riskLevel: "High",
    riskFlags: ["Suspended", "Rejected KYC", "Payout blocked"],
    watchlistReason: "Manual suspension after verification rejection and repeated cancellations.",
    payoutStatus: "Blocked",
    pendingPayoutAmount: "$0",
    payoutsBlockedReason: "Account suspended pending risk review.",
  },
  {
    id: "ahmad-stanton-1",
    name: "Ahmad Stanton",
    email: "ahmad.stanton.one@email.com",
    phone: "+234 805 555 7821",
    location: "113 Gashua-Bursari Road",
    currentStatus: "Online",
    totalServicesProvided: 5,
    dateJoined: "Apr 12, 2023",
    accountStatus: "Active",
    lifecycleState: "Pending approval",
    serviceCategory: "Plumbing",
    bio: "Field plumber with experience in burst-pipe response and apartment maintenance requests.",
    gender: "Male",
    servicesProvided: ["Plumbing", "Cleaning"],
    verificationState: "Pending review",
    rating: 4.1,
    totalRatings: 12,
    acceptanceRate: 0.8,
    completionRate: 0.88,
    responseTimeLabel: "9 min avg",
    totalJobsOffered: 44,
    totalJobsAccepted: 35,
    totalJobsCompleted: 31,
    repeatedComplaints: 0,
    lastActiveLabel: "18 mins ago",
    serviceZoneLabel: "Gashua corridor",
    riskLevel: "Medium",
    riskFlags: ["Pending approval"],
    watchlistReason: "Awaiting final KYC confirmation before unrestricted dispatch.",
    payoutStatus: "Onboarding",
    pendingPayoutAmount: "$95",
  },
  {
    id: "ahmad-stanton-2",
    name: "Ahmad Stanton",
    email: "ahmad.stanton.two@email.com",
    phone: "+234 806 555 9012",
    location: "113 Gashua-Bursari Road",
    currentStatus: "Offline",
    totalServicesProvided: 2,
    dateJoined: "Apr 12, 2023",
    accountStatus: "Active",
    lifecycleState: "Active",
    serviceCategory: "Laundry",
    bio: "Laundry contractor handling express garment collection, folding, and same-day return requests.",
    gender: "Male",
    servicesProvided: ["Laundry", "Cleaning"],
    verificationState: "Verified",
    rating: 4.6,
    totalRatings: 9,
    acceptanceRate: 0.89,
    completionRate: 0.93,
    responseTimeLabel: "7 min avg",
    totalJobsOffered: 28,
    totalJobsAccepted: 25,
    totalJobsCompleted: 23,
    repeatedComplaints: 0,
    lastActiveLabel: "25 mins ago",
    serviceZoneLabel: "Gashua estates",
    riskLevel: "Low",
    riskFlags: ["New contractor"],
    payoutStatus: "Ready",
    pendingPayoutAmount: "$60",
  },
  {
    id: "ahmad-stanton-3",
    name: "Ahmad Stanton",
    email: "ahmad.stanton.three@email.com",
    phone: "+234 807 555 3441",
    location: "113 Gashua-Bursari Road",
    currentStatus: "Online",
    totalServicesProvided: 1,
    dateJoined: "Apr 12, 2023",
    accountStatus: "Active",
    lifecycleState: "Active",
    serviceCategory: "Carpentry",
    bio: "On-demand carpenter handling small repairs, custom shelving, and fixture adjustments.",
    gender: "Male",
    servicesProvided: ["Carpentry", "Electrician"],
    verificationState: "Verified",
    rating: 4.9,
    totalRatings: 31,
    acceptanceRate: 0.96,
    completionRate: 0.97,
    responseTimeLabel: "5 min avg",
    totalJobsOffered: 67,
    totalJobsAccepted: 64,
    totalJobsCompleted: 62,
    repeatedComplaints: 0,
    lastActiveLabel: "5 mins ago",
    serviceZoneLabel: "Gashua-Bursari route",
    riskLevel: "Low",
    riskFlags: ["Top rated"],
    payoutStatus: "Ready",
    pendingPayoutAmount: "$310",
  },
  {
    id: "ahmad-stanton-4",
    name: "Ahmad Stanton",
    email: "ahmad.stanton.four@email.com",
    phone: "+234 808 555 6602",
    location: "113 Gashua-Bursari Road",
    currentStatus: "Busy",
    totalServicesProvided: 30,
    dateJoined: "Apr 12, 2023",
    accountStatus: "Active",
    lifecycleState: "Active",
    serviceCategory: "Cleaning",
    bio: "Multi-site cleaning contractor currently assigned to recurring commercial maintenance jobs.",
    gender: "Male",
    servicesProvided: ["Cleaning", "Laundry", "Plumbing"],
    verificationState: "Verified",
    rating: 3.8,
    totalRatings: 57,
    acceptanceRate: 0.76,
    completionRate: 0.84,
    responseTimeLabel: "14 min avg",
    totalJobsOffered: 142,
    totalJobsAccepted: 108,
    totalJobsCompleted: 91,
    repeatedComplaints: 2,
    lastActiveLabel: "Just now",
    serviceZoneLabel: "Commercial district west",
    riskLevel: "Medium",
    riskFlags: ["Low rating watchlist", "High volume"],
    watchlistReason: "Rating dipped below target after recent high-volume assignments.",
    payoutStatus: "Ready",
    pendingPayoutAmount: "$510",
  },
];

export const contractorRecords: ContractorRecord[] =
  contractorRecordSeeds.map(enrichContractorRecord);

export type ContractorRequestHistoryRow = {
  requestId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  service: string;
  location: string;
  date: string;
  status: string;
};

export type LiveContractorDetails = {
  contractor: ContractorRecord;
  kycState: Partial<ContractorKycState>;
  requestRows: ContractorRequestHistoryRow[];
  transactions: ContractorTransactionRecord[];
};

const fallbackContractorTransactions: ContractorTransactionRecord[] = [
  {
    id: "transaction-1",
    transactionCode: "#1234567",
    type: "Withdrawal",
    amount: -500,
    dateTime: "Apr 12, 2023",
    status: "Completed",
    accountNumber: "001234567890",
    accountName: "John Doe",
    bankName: "United Bank for Africa",
    fee: 4.99,
  },
  {
    id: "transaction-2",
    transactionCode: "#1234568",
    type: "Service payment",
    amount: 500,
    dateTime: "Apr 12, 2023",
    status: "Pending",
    accountNumber: "001234567890",
    accountName: "John Doe",
    bankName: "United Bank for Africa",
    fee: 4.99,
  },
  {
    id: "transaction-3",
    transactionCode: "#1234569",
    type: "Withdrawal",
    amount: -500,
    dateTime: "Apr 12, 2023",
    status: "Failed",
    accountNumber: "001234567890",
    accountName: "John Doe",
    bankName: "United Bank for Africa",
    fee: 4.99,
  },
  {
    id: "transaction-4",
    transactionCode: "#1234570",
    type: "Service payment",
    amount: 500,
    dateTime: "Apr 12, 2023",
    status: "Completed",
    accountNumber: "001234567890",
    accountName: "John Doe",
    bankName: "United Bank for Africa",
    fee: 4.99,
  },
  {
    id: "transaction-5",
    transactionCode: "#1234571",
    type: "Withdrawal",
    amount: -500,
    dateTime: "Apr 12, 2023",
    status: "Completed",
    accountNumber: "001234567890",
    accountName: "John Doe",
    bankName: "United Bank for Africa",
    fee: 4.99,
  },
];

const contractorTransactionRecordsById: Record<
  string,
  ContractorTransactionRecord[]
> = {
  "emery-torff": fallbackContractorTransactions,
  "maren-dokidis": [
    {
      id: "transaction-6",
      transactionCode: "#2234567",
      type: "Service payment",
      amount: 1250,
      dateTime: "May 03, 2023",
      status: "Completed",
      accountNumber: "002345678901",
      accountName: "Maren Dokidis",
      bankName: "Access Bank",
      fee: 6.25,
    },
    {
      id: "transaction-7",
      transactionCode: "#2234568",
      type: "Withdrawal",
      amount: -800,
      dateTime: "May 06, 2023",
      status: "Pending",
      accountNumber: "002345678901",
      accountName: "Maren Dokidis",
      bankName: "Access Bank",
      fee: 5.1,
    },
    {
      id: "transaction-8",
      transactionCode: "#2234569",
      type: "Service payment",
      amount: 900,
      dateTime: "May 08, 2023",
      status: "Completed",
      accountNumber: "002345678901",
      accountName: "Maren Dokidis",
      bankName: "Access Bank",
      fee: 4.5,
    },
  ],
};

export function getContractorTransactionRecords(contractorId: string) {
  const transactions =
    contractorTransactionRecordsById[contractorId] ??
    fallbackContractorTransactions;

  return transactions.map((transaction) => ({ ...transaction }));
}

function buildLocationHistory(
  addresses: string[],
): ContractorLocationHistoryItem[] {
  return Array.from(new Set(addresses.filter(Boolean))).slice(0, 3).map((address, index) => ({
    id: `location-${index + 1}-${address}`,
    primaryLine: address,
    secondaryLine: "Service location",
    isCurrent: index === 0,
  }));
}

function buildResponseSpeedLabel(totalCompletedJobs: number) {
  if (totalCompletedJobs >= 20) return "Fast response";
  if (totalCompletedJobs >= 5) return "Stable response";
  return "New activity";
}

function unwrapResult<T>(result: SupabaseResult<T>): T {
  if (result.ok === false) {
    throw new Error(result.message);
  }

  return result.data;
}

function buildRequestRows(params: {
  contractorId: string;
  jobs: JobRow[];
  profilesById: Map<string, ProfileRow>;
}) {
  const { contractorId, jobs, profilesById } = params;
  return jobs
    .filter((job) => job.contractor_id === contractorId)
    .map((job) => {
      const customer = profilesById.get(job.user_id);
      const request = mapJobRowToUserRequestHistoryItem({
        job,
        userProfile: customer ?? null,
      });

      return {
        requestId: job.id,
        userId: job.user_id,
        customerName:
          customer?.full_name?.trim() ||
          `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim() ||
          "Customer",
        customerEmail: customer?.email ?? "—",
        service: request.service,
        location: request.location,
        date: request.date,
        status: request.status,
      };
    });
}

export async function loadLiveContractorRecords() {
  const contractorsResult = await supabaseContractors.listLatest({ limit: 200 });
  if (contractorsResult.ok === false) {
    throw new Error(contractorsResult.message);
  }

  const contractors = contractorsResult.data;
  const contractorIds = contractors.map((contractor) => contractor.id);

  const [profilesResult, jobsResult, reviewsResult, withdrawalsResult, docsResult] =
    await Promise.all([
      supabaseProfiles.listByIds(contractorIds),
      supabaseJobs.listByContractorIds(contractorIds, { limit: 500 }),
      supabaseReviews.listByRevieweeIds(contractorIds),
      supabaseFinance.listWithdrawalsByContractorIds(contractorIds, { limit: 500 }),
      supabaseContractorDocuments.listByContractorIds(contractorIds),
    ]);

  const profiles = unwrapResult(profilesResult);
  const jobs = unwrapResult(jobsResult);
  const reviews = unwrapResult(reviewsResult);
  const withdrawals = unwrapResult(withdrawalsResult);
  const docs = unwrapResult(docsResult);

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const jobsByContractorId = new Map<string, JobRow[]>();
  for (const job of jobs) {
    const items = jobsByContractorId.get(job.contractor_id ?? "");
    if (items) items.push(job);
    else if (job.contractor_id) jobsByContractorId.set(job.contractor_id, [job]);
  }

  const reviewsByContractorId = new Map<string, ReviewRow[]>();
  for (const review of reviews) {
    const items = reviewsByContractorId.get(review.reviewee_id);
    if (items) items.push(review);
    else reviewsByContractorId.set(review.reviewee_id, [review]);
  }

  const withdrawalsByContractorId = new Map<string, WithdrawalRow[]>();
  for (const withdrawal of withdrawals) {
    const items = withdrawalsByContractorId.get(withdrawal.contractor_id);
    if (items) items.push(withdrawal);
    else withdrawalsByContractorId.set(withdrawal.contractor_id, [withdrawal]);
  }

  const docsByContractorId = new Map<string, ContractorDocumentRow[]>();
  for (const document of docs) {
    const items = docsByContractorId.get(document.contractor_id);
    if (items) items.push(document);
    else docsByContractorId.set(document.contractor_id, [document]);
  }

  return contractors
    .map((contractor) => {
      const profile = profilesById.get(contractor.id);
      if (!profile) return null;

      const contractorJobs = jobsByContractorId.get(contractor.id) ?? [];
      const contractorReviews = reviewsByContractorId.get(contractor.id) ?? [];
      const contractorWithdrawals = withdrawalsByContractorId.get(contractor.id) ?? [];
      const contractorDocs = docsByContractorId.get(contractor.id) ?? [];
      const totalCompletedJobs = contractorJobs.filter((job) => job.status === "completed").length;
      const completionRate =
        contractor.total_jobs_accepted > 0
          ? totalCompletedJobs / contractor.total_jobs_accepted
          : 0;
      const repeatedComplaints = contractorReviews.filter(
        (review) => Number(review.rating) <= 3,
      ).length;
      const verificationState = deriveContractorVerificationState({
        contractor,
        documents: contractorDocs,
      });
      const riskState = deriveContractorRiskState({
        contractor,
        reviews: contractorReviews,
        documents: contractorDocs,
        completionRate,
      });

      const latestAddress =
        contractorJobs.find((job) => job.address.trim())?.address || "—";
      const locations = buildLocationHistory(
        contractorJobs.map((job) => job.address),
      );

      const record = mapContractorRowToContractorRecord({
        contractor,
        profile,
        locationLabel: latestAddress,
        completionRate,
        responseTimeLabel: buildResponseSpeedLabel(totalCompletedJobs),
        repeatedComplaints,
        lastActiveLabel: formatDateLabel(
          contractor.location_updated_at || contractor.updated_at,
        ),
        serviceZoneLabel: latestAddress,
        pendingPayoutAmount: sumPendingWithdrawalAmount(contractorWithdrawals),
        riskFlags: riskState.riskFlags,
        riskLevel: riskState.riskLevel,
        verificationState,
        totalJobsCompleted: totalCompletedJobs,
        watchlistReason: riskState.watchlistReason,
      });

      return {
        ...record,
        locations: locations.length ? locations : record.locations,
      };
    })
    .filter(Boolean) as ContractorRecord[];
}

export async function loadLiveContractorDetails(
  contractorId: string,
): Promise<LiveContractorDetails | null> {
  const contractorResult = await supabaseContractors.getById(contractorId);
  if (contractorResult.ok === false) {
    throw new Error(contractorResult.message);
  }

  const contractor = contractorResult.data;
  const [
    profilesResult,
    jobsResult,
    reviewsResult,
    paymentsResult,
    withdrawalsResult,
    bankAccountsResult,
    docsResult,
  ] = await Promise.all([
    supabaseProfiles.listByIds([contractorId]),
    supabaseJobs.listByContractorIds([contractorId], { limit: 500 }),
    supabaseReviews.listByRevieweeIds([contractorId]),
    supabaseFinance.listPaymentsByPayeeIds([contractorId], { limit: 500 }),
    supabaseFinance.listWithdrawalsByContractorIds([contractorId], { limit: 500 }),
    supabaseContractorBankAccounts.listByContractorIds([contractorId]),
    supabaseContractorDocuments.listByContractorIds([contractorId]),
  ]);

  const profiles = unwrapResult(profilesResult);
  const jobs = unwrapResult(jobsResult);
  const reviews = unwrapResult(reviewsResult);
  const payments = unwrapResult(paymentsResult);
  const withdrawals = unwrapResult(withdrawalsResult);
  const bankAccounts = unwrapResult(bankAccountsResult);
  const docs = unwrapResult(docsResult);

  const profile = profiles[0];
  if (!profile) {
    return null;
  }

  const reviewerIds = Array.from(
    new Set(
      docs
        .map((document) => document.reviewed_by)
        .filter(Boolean) as string[],
    ),
  );
  const relatedUserIds = Array.from(
    new Set(jobs.map((job) => job.user_id)),
  );
  const relatedProfilesResult = await supabaseProfiles.listByIds([
    ...reviewerIds,
    ...relatedUserIds,
  ]);
  const relatedProfiles = unwrapResult(relatedProfilesResult);

  const relatedProfilesById = new Map(
    relatedProfiles.map((item) => [item.id, item]),
  );
  const totalCompletedJobs = jobs.filter(
    (job) => job.status === "completed",
  ).length;
  const completionRate =
    contractor.total_jobs_accepted > 0
      ? totalCompletedJobs / contractor.total_jobs_accepted
      : 0;
  const repeatedComplaints = reviews.filter(
    (review) => Number(review.rating) <= 3,
  ).length;
  const verificationState = deriveContractorVerificationState({
    contractor,
    documents: docs,
  });
  const riskState = deriveContractorRiskState({
    contractor,
    reviews,
    documents: docs,
    completionRate,
  });
  const latestAddress =
    jobs.find((job) => job.address.trim())?.address || "—";
  const locations = buildLocationHistory(jobs.map((job) => job.address));
  const defaultBankAccount =
    bankAccounts.find((account) => account.is_default) ??
    bankAccounts[0] ??
    null;

  const record = mapContractorRowToContractorRecord({
    contractor,
    profile,
    locationLabel: latestAddress,
    completionRate,
    responseTimeLabel: buildResponseSpeedLabel(totalCompletedJobs),
    repeatedComplaints,
    lastActiveLabel: formatDateLabel(
      contractor.location_updated_at || contractor.updated_at,
    ),
    serviceZoneLabel: latestAddress,
    pendingPayoutAmount: sumPendingWithdrawalAmount(withdrawals),
    riskFlags: riskState.riskFlags,
    riskLevel: riskState.riskLevel,
    verificationState,
    totalJobsCompleted: totalCompletedJobs,
    watchlistReason: riskState.watchlistReason,
  });

  const requestRows = buildRequestRows({
    contractorId,
    jobs,
    profilesById: relatedProfilesById,
  });

  const transactions = [
    ...payments.map((payment) =>
      mapPaymentRowToContractorTransactionRecord({
        payment,
        bankAccount: defaultBankAccount,
      }),
    ),
    ...withdrawals.map((withdrawal) =>
      mapWithdrawalRowToContractorTransactionRecord({
        withdrawal,
        bankAccount:
          bankAccounts.find(
            (account) => account.id === withdrawal.bank_account_id,
          ) ?? defaultBankAccount,
      }),
    ),
  ].sort((left, right) => right.dateTime.localeCompare(left.dateTime));

  return {
    contractor: {
      ...record,
      locations: locations.length ? locations : record.locations,
    },
    kycState: mapContractorDocumentsToKycInitialState({
      documents: docs,
      reviewerProfiles: relatedProfilesById,
    }),
    requestRows,
    transactions,
  };
}
