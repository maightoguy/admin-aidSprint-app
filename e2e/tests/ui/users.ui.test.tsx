import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Users from "../../../src/components/dashboard/users/users";
import { seedTestData } from "../../setup";

describe("Users UI (integration)", () => {
  beforeEach(async () => {
    await seedTestData();
  });

  it("renders users list and shows seeded user", async () => {
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>,
    );

    expect(await screen.findByText("All users")).toBeTruthy();
    const matches = await screen.findAllByText("Emery Torff");
    expect(matches.length).toBeGreaterThan(0);
  });
});
