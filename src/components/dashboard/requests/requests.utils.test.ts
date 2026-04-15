import { describe, expect, it } from "vitest";
import { filterRequestRows, type RequestFilterableRow } from "./requests.utils";

function createRequestRow(
  overrides: Partial<RequestFilterableRow> = {},
): RequestFilterableRow {
  return {
    id: "request-1",
    userName: "Emery Torff",
    userEmail: "emery@example.com",
    request: {
      location: "Lagos",
      service: "Plumbing",
      date: "Apr 12, 2023",
      status: "Active",
      requestCode: "REQ-001",
      urgencyLabel: "Emergency",
    },
    ...overrides,
  };
}

describe("filterRequestRows", () => {
  it("applies status, priority, date, and search filters", () => {
    const rows = [
      createRequestRow(),
      createRequestRow({
        id: "request-2",
        userName: "Maren Dokidis",
        userEmail: "maren@example.com",
        request: {
          location: "Abuja",
          service: "Cleaning",
          date: "Jun 15, 2023",
          status: "Pending",
          requestCode: "REQ-002",
          urgencyLabel: "Standard",
        },
      }),
      createRequestRow({
        id: "request-3",
        userName: "Cooper Siphron",
        userEmail: "cooper@example.com",
        request: {
          location: "Ibadan",
          service: "Electrical",
          date: "Jul 22, 2023",
          status: "Completed",
          requestCode: "REQ-003",
          urgencyLabel: "Emergency",
        },
      }),
    ];

    const results = filterRequestRows(rows, {
      query: "maren",
      status: "Pending",
      priority: "Standard",
      from: "2023-06-01",
      to: "2023-06-30",
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("request-2");
  });
});
