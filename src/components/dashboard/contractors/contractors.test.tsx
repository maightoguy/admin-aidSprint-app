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
import ContractorsPage from "./contractors";

function renderContractors() {
  return render(
    <MemoryRouter initialEntries={["/contractors"]}>
      <Routes>
        <Route path="/contractors" element={<ContractorsPage />} />
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
  });

  it("opens the action menu and triggers edit modal from view profile", async () => {
    const user = userEvent.setup();
    renderContractors();

    await user.click(
      screen.getAllByRole("button", {
        name: /Open contractor actions for/i,
      })[0],
    );
    await user.click(screen.getByRole("menuitem", { name: "View profile" }));

    expect(await screen.findByText("Edit contractor")).toBeTruthy();
    expect(screen.getByLabelText("Full name")).toBeTruthy();
  });

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
  });
});
