// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import TransactionsPage from "./transactions";

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

describe("TransactionsPage", () => {
  it("opens the transaction details sidebar from the row action menu", async () => {
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
    await user.click(await screen.findByRole("menuitem", { name: "View details" }));

    const dialog = await screen.findByRole("dialog", {
      name: "Transaction details",
    });

    expect(within(dialog).getByText("View profile")).toBeTruthy();
    expect(within(dialog).getByText("#12345")).toBeTruthy();
    expect(within(dialog).getAllByText("Emery Torff").length).toBeGreaterThan(0);
  });

  it("renders the mobile sidebar pattern and updates the selected transaction status", async () => {
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
    await user.click(await screen.findByRole("menuitem", { name: "View details" }));

    const dialog = await screen.findByRole("dialog", {
      name: "Transaction details",
    });

    expect(dialog.className).toContain("bottom-0");

    await user.click(
      within(dialog).getByRole("button", {
        name: "Update transaction status",
      }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Reject Transaction" }),
    );

    expect(within(dialog).getByText("• Failed")).toBeTruthy();
  });
});
