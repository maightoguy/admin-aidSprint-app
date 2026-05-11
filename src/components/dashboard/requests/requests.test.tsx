// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import RequestsPage from "./requests";
import { useRequestsStore } from "./requests.store";

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

afterEach(() => {
  setViewport(1440, 900);
  useRequestsStore.setState({
    selectedRequestId: null,
    isSidebarOpen: false,
    isMapOpen: false,
    requestStatusById: {},
    requestOpsById: {},
  });
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

  it("requires a reason to cancel a request from the details sidebar", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/requests"]}>
        <Routes>
          <Route path="/requests" element={<RequestsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      screen.getAllByRole("button", {
        name: /Open request actions for/i,
      })[0],
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "View request" }),
    );

    const details = await screen.findByRole("dialog", {
      name: "Request details",
    });
    await user.click(
      within(details).getByRole("button", { name: "Update request status" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: /cancel order/i }),
    );

    const cancelDialog = await screen.findByRole("dialog", {
      name: "Cancel request",
    });
    const confirm = within(cancelDialog).getByRole("button", {
      name: "Confirm cancellation",
    });
    expect(confirm.hasAttribute("disabled")).toBe(true);

    await user.type(
      within(cancelDialog).getByLabelText("Cancellation reason"),
      "Duplicate request.",
    );
    expect(confirm.hasAttribute("disabled")).toBe(false);
    await user.click(confirm);

    expect(
      await within(details).findByText("Cancellation reason"),
    ).toBeTruthy();
    expect(await within(details).findByText("Duplicate request.")).toBeTruthy();
  }, 10000);

  it("allows pausing and resuming monitoring from the live tracker overlay", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/requests"]}>
        <Routes>
          <Route path="/requests" element={<RequestsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      screen.getAllByRole("button", {
        name: /Open request actions for/i,
      })[0],
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "View request" }),
    );

    const details = await screen.findByRole("dialog", {
      name: "Request details",
    });
    await user.click(
      within(details).getByRole("button", { name: "Open live tracker" }),
    );

    const tracker = await screen.findByRole("dialog", { name: "Live tracker" });
    await user.click(
      within(tracker).getByRole("button", { name: "Pause monitoring" }),
    );
    expect(
      within(tracker).getByRole("button", { name: "Resume monitoring" }),
    ).toBeTruthy();
  }, 10000);
});
