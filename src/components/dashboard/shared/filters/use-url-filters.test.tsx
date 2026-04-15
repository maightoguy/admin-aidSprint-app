// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { FilterField } from "./filter-schema";
import { useUrlFilters } from "./use-url-filters";

const schema: FilterField[] = [
  {
    type: "dateRange",
    key: "dateRange",
    label: "Date range",
    fromKey: "from",
    toKey: "to",
  },
  {
    type: "select",
    key: "status",
    label: "Status",
    options: [{ label: "Active", value: "Active" }],
  },
  {
    type: "multiSelect",
    key: "role",
    label: "Role",
    options: [
      { label: "Admin", value: "Admin" },
      { label: "User", value: "User" },
    ],
  },
  {
    type: "numberRange",
    key: "amountRange",
    label: "Amount range",
    minKey: "minAmount",
    maxKey: "maxAmount",
  },
];

function TestHarness() {
  const { filters, setMany, reset } = useUrlFilters({ schema });
  const location = useLocation();

  return (
    <div>
      <output data-testid="status">{String(filters.status ?? "")}</output>
      <output data-testid="from">{String(filters.from ?? "")}</output>
      <output data-testid="role">
        {Array.isArray(filters.role) ? filters.role.join(",") : ""}
      </output>
      <output data-testid="minAmount">{String(filters.minAmount ?? "")}</output>
      <output data-testid="search">{location.search}</output>
      <button
        type="button"
        onClick={() =>
          setMany({
            status: "Active",
            from: "2023-06-01",
            to: "2023-06-30",
            role: ["Admin", "User"],
            minAmount: 100,
            maxAmount: 500,
          })
        }
      >
        Apply filters
      </button>
      <button type="button" onClick={() => reset()}>
        Reset filters
      </button>
    </div>
  );
}

describe("useUrlFilters", () => {
  it("hydrates from and persists back to the query string", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/?status=Active&from=2023-04-01&role=Admin"]}>
        <TestHarness />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("status").textContent).toBe("Active");
    expect(screen.getByTestId("from").textContent).toBe("2023-04-01");
    expect(screen.getByTestId("role").textContent).toBe("Admin");

    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(screen.getByTestId("search").textContent).toContain("status=Active");
    expect(screen.getByTestId("search").textContent).toContain("from=2023-06-01");
    expect(screen.getByTestId("search").textContent).toContain("to=2023-06-30");
    expect(screen.getByTestId("search").textContent).toContain("role=Admin");
    expect(screen.getByTestId("search").textContent).toContain("role=User");
    expect(screen.getByTestId("minAmount").textContent).toBe("100");

    await user.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(screen.getByTestId("search").textContent).toBe("");
  });
});
