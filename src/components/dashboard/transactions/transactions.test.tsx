// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import TransactionsPage from "./transactions";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

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

beforeEach(() => {
  setViewport(1280, 900);
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("TransactionsPage", () => {
  it("filters the table to failed payouts from the queue controls", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Failed payouts" }));

    expect(screen.getAllByText("Failed payouts").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Failed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("#FIN-4101").length).toBeGreaterThan(0);
    expect(screen.queryByText("#FIN-4100")).toBeFalsy();
  });

  it("requires a reason when rejecting a payout from the sidebar", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getAllByRole("button", {
        name: /open actions for transaction/i,
      })[0],
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "View details" }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Transaction details",
    });

    await user.click(
      within(dialog).getByRole("button", {
        name: "Open finance actions",
      }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Reject payout" }),
    );

    expect(await screen.findByText("A reason is required.")).toBeTruthy();

    await user.type(
      screen.getByLabelText("Rejection reason"),
      "Bank transfer failed and contractor payout should not proceed.",
    );
    await user.click(screen.getByRole("button", { name: "Confirm rejection" }));

    expect(
      (await within(dialog).findAllByText("Failed")).length,
    ).toBeGreaterThan(0);
  });

  it("exports the current filtered view to csv and shows a success toast", async () => {
    const user = userEvent.setup();
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:finance-export");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Failed payouts" }));
    await user.click(
      screen.getByRole("button", { name: "Export transactions" }),
    );

    expect(createObjectURLSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURLSpy).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith(
      "Finance export completed.",
      expect.objectContaining({
        description: expect.stringContaining("records exported"),
      }),
    );
  });

  it("keeps the mobile drawer pattern for transaction details", async () => {
    const user = userEvent.setup();

    setViewport(375, 812);
    render(
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getAllByRole("button", {
        name: /open actions for transaction/i,
      })[0],
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "View details" }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Transaction details",
    });

    expect(dialog.className).toContain("bottom-0");
  });
});
