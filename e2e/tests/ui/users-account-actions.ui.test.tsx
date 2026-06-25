import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Users from "../../../src/components/dashboard/users/users";

describe("Users account actions (UI)", () => {
  it("can deactivate an active user via the actions menu", async () => {
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>,
    );

    const nameEls = await screen.findAllByText("Emery Torff");
    expect(nameEls.length).toBeGreaterThan(0);

    const nameEl = nameEls[0];
    const row = nameEl.closest("tr") ?? nameEl.closest("article") ?? nameEl.parentElement;
    const trigger = within(row as HTMLElement).getByLabelText(
      `Open user actions for ${nameEl.textContent}`,
    );
    await userEvent.click(trigger);

    const actionItem = await screen.findByText("Deactivate account");
    await userEvent.click(actionItem);

    // Find the row/card that contains this user's name and assert status changed
    const { getByText } = within(row as HTMLElement);
    expect(getByText("Deactivated")).toBeTruthy();
  });
});
