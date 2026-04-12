// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SupportPage from "./support";

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });

  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height,
  });

  window.dispatchEvent(new Event("resize"));
}

afterEach(() => {
  cleanup();
});

describe("SupportPage", () => {
  it("opens the ticket details sidebar from the row action menu", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>,
    );

    // Find the first action menu button and click it
    const actionButtons = screen.getAllByLabelText(/actions for ticket/i);
    await user.click(actionButtons[0]);

    // Click "View details" in the dropdown
    const viewDetailsItem = await screen.findByText(/view details/i);
    await user.click(viewDetailsItem);

    // Check if the sidebar (dialog) is opened with the correct title
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeTruthy();

    // Verify some data in the sidebar
    expect(within(dialog).getByText("Emery Torff")).toBeTruthy();
    expect(within(dialog).getByText("#12345")).toBeTruthy();
    expect(within(dialog).getByText("Withdrawal delay")).toBeTruthy();
  });

  it("opens the status menu upward and updates the ticket status from the sidebar", async () => {
    const user = userEvent.setup();
    setViewport(375, 640);

    render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>,
    );

    // Open sidebar for the first ticket
    const actionButtons = screen.getAllByLabelText(/actions for ticket/i);
    await user.click(actionButtons[0]);
    const viewDetailsItem = await screen.findByText(/view details/i);
    await user.click(viewDetailsItem);

    const dialog = await screen.findByRole("dialog");

    // Find and click "Update Ticket" button
    const updateButton = within(dialog).getByRole("button", {
      name: /update ticket/i,
    });
    await user.click(updateButton);

    const menu = await screen.findByRole("menu");
    expect(menu.getAttribute("data-side")).toBe("top");

    // Select "Set as Resolved"
    const resolvedOption = await screen.findByText(/set as resolved/i);
    await user.click(resolvedOption);

    expect(await screen.findByText("Updating...")).toBeTruthy();
    expect(
      await within(dialog).findByText(
        (_, element) => element?.textContent === "• Resolved",
      ),
    ).toBeTruthy();
  });
});
