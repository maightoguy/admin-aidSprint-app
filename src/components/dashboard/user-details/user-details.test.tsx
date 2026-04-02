// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRequestDetailsStore } from "../request-details/request-details.store";
import Users from "../users/users";
import UserDetailsPage from "./user-details-page";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  useRequestDetailsStore.setState({
    selectedRequestId: null,
    isSidebarOpen: false,
    isMapOpen: false,
    requestStatusById: {},
  });
});

function renderUserDetails(options?: {
  route?: string;
  onStatusChange?: Parameters<typeof UserDetailsPage>[0]["onStatusChange"];
  isLoading?: boolean;
  errorMessage?: string | null;
}) {
  const {
    route = "/users/emery-torff",
    onStatusChange,
    isLoading = false,
    errorMessage = null,
  } = options ?? {};

  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/users/:userId"
          element={
            <UserDetailsPage
              onStatusChange={onStatusChange}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("UserDetailsPage", () => {
  it("renders the personal details tab by default", () => {
    renderUserDetails();

    expect(screen.getByText("Emery Torff")).toBeTruthy();
    expect(screen.getByText("User information")).toBeTruthy();
    expect(screen.getByText("First name")).toBeTruthy();
    expect(screen.getByText("Emery")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Personal details" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Live tracker" })).toBeNull();
  });

  it("switches between Personal details and Request history tabs", async () => {
    const user = userEvent.setup();

    renderUserDetails();

    await user.click(screen.getByRole("tab", { name: "Request history" }));

    expect(screen.getByText("All requests")).toBeTruthy();
    expect(screen.getAllByText("Plumbing").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cleaning").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Baby sitting").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Electrician").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("tab", { name: "Personal details" }));

    expect(screen.getByText("Locations")).toBeTruthy();
  });

  it("renders request history search, statuses, and pagination controls", async () => {
    const user = userEvent.setup();

    renderUserDetails();

    await user.click(screen.getByRole("tab", { name: "Request history" }));

    expect(
      screen.getByRole("textbox", { name: "Search request history" }),
    ).toBeTruthy();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Previous request history page" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Next request history page" }),
    ).toBeTruthy();
  });

  it("opens the request details sidebar from a request row", async () => {
    const user = userEvent.setup();

    renderUserDetails();

    await user.click(screen.getByRole("tab", { name: "Request history" }));
    await user.click(
      screen.getAllByRole("button", {
        name: "Open request details for Plumbing",
      })[0],
    );

    expect(screen.getAllByText("Request details").length).toBeGreaterThan(0);
    expect(screen.getByText("KJH 123456")).toBeTruthy();
    expect(screen.getByText("Uploaded images")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Open live tracker" }),
    ).toBeTruthy();
  });

  it("updates the request status without a reload", async () => {
    const user = userEvent.setup();

    renderUserDetails();

    await user.click(screen.getByRole("tab", { name: "Request history" }));
    await user.click(
      screen.getAllByRole("button", {
        name: "Open request details for Plumbing",
      })[0],
    );

    await user.click(
      screen.getByRole("button", { name: "Update request status" }),
    );
    await user.click(
      screen.getByRole("menuitem", {
        name: /Complete order/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getAllByText("Completed order").length).toBeGreaterThan(0);
    });
  }, 10000);

  it("opens and closes the update account modal", async () => {
    const user = userEvent.setup();

    renderUserDetails();

    await user.click(screen.getByRole("button", { name: /update account/i }));

    expect(screen.getByText("Activate Account")).toBeTruthy();
    expect(screen.getByText("Deactivate Account")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByText("Activate Account")).toBeNull();
    });
  });

  it("updates account status through the modal actions", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();

    renderUserDetails({ onStatusChange });

    await user.click(screen.getByRole("button", { name: /update account/i }));
    await user.click(
      screen.getByRole("button", { name: "Deactivate Account" }),
    );

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalled();
      expect(screen.getAllByText("Deactivated").length).toBeGreaterThan(0);
    });

    await user.click(screen.getByRole("button", { name: /update account/i }));
    await user.click(screen.getByRole("button", { name: "Activate Account" }));

    await waitFor(() => {
      expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    });
  });

  it("renders loading and missing-user states", () => {
    const loadingView = render(
      <MemoryRouter initialEntries={["/users/emery-torff"]}>
        <Routes>
          <Route
            path="/users/:userId"
            element={<UserDetailsPage isLoading />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Back to users")[0]).toBeTruthy();

    loadingView.unmount();

    render(
      <MemoryRouter initialEntries={["/users/unknown-user"]}>
        <Routes>
          <Route path="/users/:userId" element={<UserDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("User profile not found")).toBeTruthy();
  });

  it("navigates from the users action menu to the details page", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/users"]}>
        <Routes>
          <Route path="/users" element={<Users />} />
          <Route path="/users/:userId" element={<UserDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      screen.getAllByRole("button", {
        name: "Open user actions for Emery Torff",
      })[0],
    );
    await user.click(screen.getByRole("menuitem", { name: "View profile" }));

    expect(await screen.findByText("User information")).toBeTruthy();
    expect(screen.getByText("Emery Torff")).toBeTruthy();
  });

  it("navigates from request details to the live tracker route", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/users/emery-torff"]}>
        <Routes>
          <Route path="/users/:userId" element={<UserDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("tab", { name: "Request history" }));
    await user.click(
      screen.getAllByRole("button", {
        name: "Open request details for Plumbing",
      })[0],
    );
    await user.click(screen.getByRole("button", { name: "Open live tracker" }));

    expect(
      screen.getByRole("button", { name: "Close live tracker" }),
    ).toBeTruthy();
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Close live tracker" }),
      ).toBeNull();
    });
  });
});
