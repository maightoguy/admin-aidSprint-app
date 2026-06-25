import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserDetailsPage from "../../../src/components/dashboard/user-details/user-details-page";
import { seedTestData } from "../../setup";

describe("User Details UI (integration)", () => {
  it("renders personal details for a seeded user", async () => {
    await seedTestData();

    render(
      <MemoryRouter>
        <UserDetailsPage initialUserId="emery-torff" />
      </MemoryRouter>,
    );

    expect(await screen.findByText("User information")).toBeTruthy();
    expect(await screen.findByText("Emery")).toBeTruthy();
  });
});
