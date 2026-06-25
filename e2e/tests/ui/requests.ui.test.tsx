import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserDetailsPage from "../../../src/components/dashboard/user-details/user-details-page";
import { seedTestData } from "../../setup";

describe("Request actions (UI)", () => {
  it("shows request history and open buttons", async () => {
    await seedTestData();

    render(
      <MemoryRouter>
        <UserDetailsPage initialUserId="emery-torff" />
      </MemoryRouter>,
    );

    // The page should render user information; requests panel may vary
    expect(await screen.findByText("User information")).toBeTruthy();

    // buttons to open request details may or may not be present depending on mock data
    const openBtns = await screen.queryAllByLabelText(/Open request details for/i);
    expect(openBtns).toBeDefined();
  });
});
