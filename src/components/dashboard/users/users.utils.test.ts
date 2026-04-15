import { describe, expect, it } from "vitest";
import { filterUsers } from "./users.utils";
import type { UserRecord } from "./users.types";

function createUser(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: "user-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    location: "Lagos",
    totalServicesRequested: 6,
    dateJoined: "Apr 12, 2023",
    status: "Active",
    role: "Admin",
    ...overrides,
  };
}

describe("filterUsers", () => {
  it("filters by query, role, status, and date range", () => {
    const users = [
      createUser(),
      createUser({
        id: "user-2",
        name: "Grace Hopper",
        email: "grace@example.com",
        role: "User",
        status: "Deactivated",
        dateJoined: "Jun 08, 2023",
      }),
      createUser({
        id: "user-3",
        name: "Alan Turing",
        email: "alan@example.com",
        role: "User",
        status: "Active",
        dateJoined: "Jul 18, 2023",
      }),
    ];

    const results = filterUsers(users, {
      query: "grace",
      role: "User",
      status: "Deactivated",
      from: "2023-06-01",
      to: "2023-06-30",
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("user-2");
  });
});
