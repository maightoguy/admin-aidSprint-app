import mockUserDetailsMetadata from "./user-details.mock.json";
import { userRecords } from "../users/users.data";
import type { UserDetailsRecord } from "./user-details.types";

type UserDetailsMetadata = Pick<
  UserDetailsRecord,
  "firstName" | "lastName" | "gender" | "locations" | "requestHistory"
>;

const userDetailsMetadata = mockUserDetailsMetadata as Record<
  string,
  UserDetailsMetadata
>;

function buildFallbackRecord(
  id: string,
  name: string,
  location: string,
): Pick<
  UserDetailsRecord,
  "firstName" | "lastName" | "gender" | "locations" | "requestHistory"
> {
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
        requestCode: "KJH 000000",
        service: "General assistance",
        location,
        date: "Apr 12, 2023",
        status: "Pending" as const,
        completedRequests: "0 requests completed",
        rating: "0.0",
        urgencyLabel: "Emergency",
        totalPayment: "$0.00",
        baseFee: "$0/hr",
        totalHours: "0hrs($0)",
        description: "Request details are not available yet.",
        platformFee: "$0.00",
        lifecycleStatus: "Assigned" as const,
        contractorLocation: location,
        userLocation: location,
        etaLabel: "Awaiting assignment",
        uploadedImages: [
          { id: `${id}-request-image-1`, label: "Pending", tone: "light" },
          { id: `${id}-request-image-2`, label: "Pending", tone: "dark" },
        ],
      },
    ],
  };
}

export function getMockUserDetailsRecords(): UserDetailsRecord[] {
  // TODO: Replace this mock loader with GET /api/users/:userId/details once the backend contract is available.
  return userRecords.map((user) => {
    const metadata =
      userDetailsMetadata[user.id] ??
      buildFallbackRecord(user.id, user.name, user.location);

    return {
      ...user,
      ...metadata,
    };
  });
}

export const userDetailsRecords: UserDetailsRecord[] = getMockUserDetailsRecords();
