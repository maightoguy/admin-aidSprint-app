// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import RequestsPage from "./requests";
import { useRequestsStore } from "./requests.store";

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
  useRequestsStore.getState().closeAll();
  cleanup();
});

describe("RequestsPage", () => {
  it("renders the requests table and opens request details from the row action menu", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/requests"]}>
        <Routes>
          <Route path="/requests" element={<RequestsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("All Requests")).toBeTruthy();
    expect(screen.getByText("Total Requests")).toBeTruthy();

    await user.click(
      screen.getAllByRole("button", {
        name: /Open request actions for/i,
      })[0],
    );

    const menu = await screen.findByRole("menu");
    await user.click(
      within(menu).getByRole("menuitem", { name: "View request" }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Request details",
    });
    expect(within(dialog).getByText(/Request ID:/i)).toBeTruthy();
  }, 10000);

  it("renders the adaptive request cards on mobile and still opens request details", async () => {
    const user = userEvent.setup();
    setViewport(375, 812);

    render(
      <MemoryRouter initialEntries={["/requests"]}>
        <Routes>
          <Route path="/requests" element={<RequestsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("All Requests")).toBeTruthy();
    expect(screen.queryByText(/Request ID:/i)).toBeFalsy();

    await user.click(
      screen.getAllByRole("button", {
        name: /Open request actions for/i,
      })[0],
    );

    const menu = await screen.findByRole("menu");
    await user.click(
      within(menu).getByRole("menuitem", { name: "View request" }),
    );

    expect(
      await screen.findByRole("dialog", { name: "Request details" }),
    ).toBeTruthy();
  });
});
