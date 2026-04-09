// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import ContractorDetailsPage from "./contractor-details-page";
import ContractorsPage from "./contractors";
import UserDetailsPage from "../user-details/user-details-page";

function renderContractors() {
  return render(
    <MemoryRouter initialEntries={["/contractors"]}>
      <Routes>
        <Route path="/contractors" element={<ContractorsPage />} />
        <Route
          path="/contractors/:contractorId"
          element={<ContractorDetailsPage />}
        />
        <Route path="/users/:userId" element={<UserDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe("ContractorsPage", () => {
  it("renders the contractors list and filters via search", async () => {
    const user = userEvent.setup();
    renderContractors();

    expect(screen.getByText("All Contractors")).toBeTruthy();
    const search = screen.getByPlaceholderText("Search Contractors ...");
    await user.type(search, "Maren");

    expect(screen.getAllByText("Maren Dokidis").length).toBeGreaterThan(0);
    expect(screen.queryByText("Cooper Siphron")).toBeNull();
  }, 10000);

  it("navigates to contractor details from view profile", async () => {
    const user = userEvent.setup();
    renderContractors();

    await user.click(
      screen.getAllByRole("button", {
        name: /Open contractor actions for/i,
      })[0],
    );
    await user.click(screen.getByRole("menuitem", { name: "View profile" }));

    expect(
      await screen.findByRole("tab", { name: "Personal details" }),
    ).toBeTruthy();
    expect(screen.getByText("Contractor’s information")).toBeTruthy();
    expect(screen.getByText("Service Provided")).toBeTruthy();
  }, 10000);

  it("opens the contractor update account modal from the details page", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/contractors/emery-torff"]}>
        <Routes>
          <Route path="/contractors" element={<ContractorsPage />} />
          <Route
            path="/contractors/:contractorId"
            element={<ContractorDetailsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Update account/i }));
    expect(
      await screen.findByRole("dialog", { name: "Update account" }),
    ).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: "Deactivate Account" }),
    );

    await waitFor(() => {
      expect(screen.getAllByText("Deactivated").length).toBeGreaterThan(0);
    });
  }, 10000);

  it("navigates from contractor request history to the existing request details view", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/contractors/emery-torff"]}>
        <Routes>
          <Route path="/contractors" element={<ContractorsPage />} />
          <Route
            path="/contractors/:contractorId"
            element={<ContractorDetailsPage />}
          />
          <Route path="/users/:userId" element={<UserDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("tab", { name: "Request history" }));
    expect(await screen.findByText("All requests")).toBeTruthy();

    await user.click(
      screen.getByRole("button", {
        name: "Open request actions for emery-request-1",
      }),
    );
    await user.click(screen.getByRole("menuitem", { name: "View Details" }));

    expect(
      await screen.findByRole("dialog", { name: "Request details" }),
    ).toBeTruthy();
    expect(screen.getAllByText("Emery Torff").length).toBeGreaterThan(0);
    expect(screen.getByText("KJH 123456")).toBeTruthy();
  }, 10000);

  it("opens contractor transaction details and updates the selected transaction status", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/contractors/emery-torff"]}>
        <Routes>
          <Route path="/contractors" element={<ContractorsPage />} />
          <Route
            path="/contractors/:contractorId"
            element={<ContractorDetailsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("tab", { name: "Transaction history" }));
    expect(await screen.findByText("All Transactions")).toBeTruthy();

    await user.click(
      screen.getByRole("button", {
        name: "Open transaction details for #1234568",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Transaction details",
    });
    const dialogScope = within(dialog);

    expect(dialogScope.getByText("001234567890")).toBeTruthy();
    expect(dialogScope.getByText("• Pending")).toBeTruthy();

    await user.click(
      dialogScope.getByRole("button", { name: /Update Status/i }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Approve Transaction" }),
    );

    await waitFor(() => {
      expect(dialogScope.getByText("• Completed")).toBeTruthy();
    });

    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
  }, 10000);

  it("adds a contractor with validation", async () => {
    const user = userEvent.setup();
    renderContractors();

    await user.click(screen.getByRole("button", { name: /Add contractor/i }));
    const dialog = await screen.findByRole("dialog", {
      name: "Add contractor",
    });
    const dialogScope = within(dialog);

    await user.click(
      dialogScope.getByRole("button", { name: "Add contractor" }),
    );
    expect(await screen.findByText("Enter a name.")).toBeTruthy();

    await user.type(dialogScope.getByLabelText("Full name"), "Ada Lovelace");
    await user.type(
      dialogScope.getByLabelText("Email address"),
      "ada@example.com",
    );
    await user.type(
      dialogScope.getByLabelText("Phone number"),
      "+234 809 555 1212",
    );
    await user.type(dialogScope.getByLabelText("Location"), "12 Allen Avenue");
    await user.type(dialogScope.getByLabelText("Date joined"), "2024-04-01");
    await user.type(
      dialogScope.getByLabelText("Contractor bio"),
      "Experienced contractor available for verified requests.",
    );

    await user.click(
      dialogScope.getByRole("button", { name: "Add contractor" }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Add contractor" }),
      ).toBeNull();
    });
  }, 15000);
});
