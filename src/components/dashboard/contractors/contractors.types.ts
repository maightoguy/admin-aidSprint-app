export type ContractorAccountStatus = "Active" | "Deactivated";

export type ContractorCurrentStatus = "Online" | "Offline" | "Busy";

export type ContractorServiceCategory =
  | "Plumbing"
  | "Cleaning"
  | "Baby sitting"
  | "Electrician"
  | "Laundry"
  | "Carpentry";

export type ContractorsSummaryCard = {
  title: string;
  value: string;
  trend: string;
  iconSvg: string;
};

export type ContractorRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  currentStatus: ContractorCurrentStatus;
  totalServicesProvided: number;
  dateJoined: string;
  accountStatus: ContractorAccountStatus;
  serviceCategory: ContractorServiceCategory;
  bio: string;
};

export type ContractorMenuAction =
  | "View profile"
  | "Activate account"
  | "Deactivate account";

export type ContractorFilters = {
  query: string;
  currentStatus: ContractorCurrentStatus | "all";
  accountStatus: ContractorAccountStatus | "all";
};

export type ContractorFormValues = {
  name: string;
  email: string;
  phone: string;
  location: string;
  currentStatus: ContractorCurrentStatus;
  totalServicesProvided: number;
  dateJoined: string;
  accountStatus: ContractorAccountStatus;
  serviceCategory: ContractorServiceCategory;
  bio: string;
};
