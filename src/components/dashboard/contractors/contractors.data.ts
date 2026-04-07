import summaryCardPattern from "@/assets/overview/summary-card-pattern.png";
import { TotalContractorsIcon } from "@/ui/icons";
import type { ContractorRecord } from "./contractors.types";

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
    serviceCategory: "Plumbing",
    bio: "Emergency plumbing specialist focused on rapid on-site diagnostics and urgent repairs.",
    gender: "Male",
    servicesProvided: ["Plumbing", "Electrician", "Carpentry"],
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
    serviceCategory: "Cleaning",
    bio: "Commercial and residential cleaning contractor with deep-cleaning and flood response experience.",
    gender: "Female",
    servicesProvided: ["Cleaning", "Laundry"],
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
    serviceCategory: "Baby sitting",
    bio: "Child-care provider available for urgent family support and verified overnight assignments.",
    gender: "Male",
    servicesProvided: ["Baby sitting", "Cleaning"],
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
    serviceCategory: "Electrician",
    bio: "Licensed electrician supporting diagnostics, rewiring, and same-day emergency callouts.",
    gender: "Male",
    servicesProvided: ["Electrician", "Carpentry"],
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
    serviceCategory: "Plumbing",
    bio: "Field plumber with experience in burst-pipe response and apartment maintenance requests.",
    gender: "Male",
    servicesProvided: ["Plumbing", "Cleaning"],
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
    serviceCategory: "Laundry",
    bio: "Laundry contractor handling express garment collection, folding, and same-day return requests.",
    gender: "Male",
    servicesProvided: ["Laundry", "Cleaning"],
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
    serviceCategory: "Carpentry",
    bio: "On-demand carpenter handling small repairs, custom shelving, and fixture adjustments.",
    gender: "Male",
    servicesProvided: ["Carpentry", "Electrician"],
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
    serviceCategory: "Cleaning",
    bio: "Multi-site cleaning contractor currently assigned to recurring commercial maintenance jobs.",
    gender: "Male",
    servicesProvided: ["Cleaning", "Laundry", "Plumbing"],
  },
];

export const contractorRecords: ContractorRecord[] =
  contractorRecordSeeds.map(enrichContractorRecord);
