// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DisputesPage from "./disputes";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
});

describe("DisputesPage", () => {
  it("opens the dispute details sidebar from the row action menu", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DisputesPage />
      </MemoryRouter>,
    );

    const actionButtons = screen.getAllByLabelText(/actions for dispute/i);
    await user.click(actionButtons[0]);

    const viewDetailsItem = await screen.findByText(/view details/i);
    await user.click(viewDetailsItem);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeTruthy();

    expect(within(dialog).getByText("Dispute details")).toBeTruthy();
    expect(within(dialog).getByText(/#DSP-/i)).toBeTruthy();
  });

  it("requires a reason to reject a dispute and updates the status badge", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DisputesPage />
      </MemoryRouter>,
    );

    const actionButtons = screen.getAllByLabelText(/actions for dispute/i);
    await user.click(actionButtons[0]);

    const viewDetailsItem = await screen.findByText(/view details/i);
    await user.click(viewDetailsItem);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeTruthy();

    await user.click(
      within(dialog).getByRole("button", { name: /dispute actions/i }),
    );

    await user.click(await screen.findByText("Reject dispute"));

    expect(await screen.findByText("Reject dispute")).toBeTruthy();
    expect(screen.getByText("A reason is required.")).toBeTruthy();

    await user.type(
      screen.getByLabelText("Rejection reason"),
      "Insufficient evidence to support the claim.",
    );

    await user.click(screen.getByRole("button", { name: "Confirm rejection" }));

    expect(await within(dialog).findByText("Rejected")).toBeTruthy();
  });

  it("requires a reason to resolve a dispute and updates the status badge", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DisputesPage />
      </MemoryRouter>,
    );

    const actionButtons = screen.getAllByLabelText(/actions for dispute/i);
    await user.click(actionButtons[0]);

    const viewDetailsItem = await screen.findByText(/view details/i);
    await user.click(viewDetailsItem);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeTruthy();

    await user.click(
      within(dialog).getByRole("button", { name: /dispute actions/i }),
    );

    await user.click(await screen.findByText("Mark resolved"));

    expect(await screen.findByText("Resolve dispute")).toBeTruthy();
    expect(screen.getByText("A reason is required.")).toBeTruthy();

    await user.type(
      screen.getByLabelText("Resolution reason"),
      "Refund issued and contractor payout reversed after review.",
    );

    await user.click(
      screen.getByRole("button", { name: "Confirm resolution" }),
    );

    expect(await within(dialog).findByText("Resolved")).toBeTruthy();
  });
});
