import { userRecords } from "../users/users.data";
import type { UserDetailsRecord } from "./user-details.types";

const userDetailsMetadata: Record<
  string,
  Pick<
    UserDetailsRecord,
    "firstName" | "lastName" | "gender" | "locations" | "requestHistory"
  >
> = {
  "emery-torff": {
    firstName: "Emery",
    lastName: "Torff",
    gender: "Male",
    locations: [
      {
        id: "emery-torff-location-1",
        primaryLine: "163 Owode-Sango Road",
        secondaryLine: "Ogun, Nigeria",
        isCurrent: true,
      },
      {
        id: "emery-torff-location-2",
        primaryLine: "42 Raymond Avenue",
        secondaryLine: "Lagos, Nigeria",
      },
      {
        id: "emery-torff-location-3",
        primaryLine: "18 Admiralty Way",
        secondaryLine: "Lekki, Nigeria",
      },
    ],
    requestHistory: [
      {
        id: "emery-request-1",
        service: "Plumbing",
        location: "163 Owode-Sango Road",
        date: "Apr 12, 2023",
        status: "Active",
      },
      {
        id: "emery-request-2",
        service: "Cleaning",
        location: "34 Awgu-Mgbidi Road",
        date: "Apr 12, 2023",
        status: "Pending",
      },
      {
        id: "emery-request-3",
        service: "Baby sitting",
        location: "170 Ejigbo-Apomu Road",
        date: "Apr 12, 2023",
        status: "Active",
      },
      {
        id: "emery-request-4",
        service: "Electrician",
        location: "178 Omu-Aran Township",
        date: "Apr 12, 2023",
        status: "Past",
      },
      {
        id: "emery-request-5",
        service: "Plumbing",
        location: "113 Gashua-Bursari Road",
        date: "Apr 12, 2023",
        status: "Active",
      },
    ],
  },
  "maren-dokidis": {
    firstName: "Maren",
    lastName: "Dokidis",
    gender: "Female",
    locations: [
      {
        id: "maren-dokidis-location-1",
        primaryLine: "34 Awgu-Mgbidi Road",
        secondaryLine: "Enugu, Nigeria",
        isCurrent: true,
      },
      {
        id: "maren-dokidis-location-2",
        primaryLine: "17 Airport Road",
        secondaryLine: "Owerri, Nigeria",
      },
    ],
    requestHistory: [
      {
        id: "maren-request-1",
        service: "Cleaning",
        location: "34 Awgu-Mgbidi Road",
        date: "Apr 12, 2023",
        status: "Past",
      },
      {
        id: "maren-request-2",
        service: "Laundry",
        location: "17 Airport Road",
        date: "Jun 08, 2023",
        status: "Pending",
      },
    ],
  },
  "cooper-siphron": {
    firstName: "Cooper",
    lastName: "Siphron",
    gender: "Male",
    locations: [
      {
        id: "cooper-siphron-location-1",
        primaryLine: "170 Ejigbo-Apomu Road",
        secondaryLine: "Osun, Nigeria",
        isCurrent: true,
      },
      {
        id: "cooper-siphron-location-2",
        primaryLine: "26 Ring Road",
        secondaryLine: "Ibadan, Nigeria",
      },
    ],
    requestHistory: [
      {
        id: "cooper-request-1",
        service: "Baby sitting",
        location: "170 Ejigbo-Apomu Road",
        date: "Apr 12, 2023",
        status: "Active",
      },
    ],
  },
  "marcus-dias": {
    firstName: "Marcus",
    lastName: "Dias",
    gender: "Male",
    locations: [
      {
        id: "marcus-dias-location-1",
        primaryLine: "178 Omu-Aran Township",
        secondaryLine: "Kwara, Nigeria",
        isCurrent: true,
      },
      {
        id: "marcus-dias-location-2",
        primaryLine: "9 Allen Avenue",
        secondaryLine: "Ikeja, Nigeria",
      },
    ],
    requestHistory: [
      {
        id: "marcus-request-1",
        service: "Electrician",
        location: "178 Omu-Aran Township",
        date: "Apr 12, 2023",
        status: "Past",
      },
    ],
  },
};

function buildFallbackRecord(id: string, name: string, location: string) {
  const [firstName = name, ...rest] = name.split(" ");
  const lastName = rest.join(" ") || "User";

  return {
    firstName,
    lastName,
    gender: "Not specified",
    locations: [
      {
        id: `${id}-location-1`,
        primaryLine: location,
        secondaryLine: "Nigeria",
        isCurrent: true,
      },
    ],
    requestHistory: [
      {
        id: `${id}-request-1`,
        service: "General assistance",
        location,
        date: "Apr 12, 2023",
        status: "Pending" as const,
      },
    ],
  };
}

export const userDetailsRecords: UserDetailsRecord[] = userRecords.map((user) => {
  const metadata =
    userDetailsMetadata[user.id] ??
    buildFallbackRecord(user.id, user.name, user.location);

  return {
    ...user,
    ...metadata,
  };
});
