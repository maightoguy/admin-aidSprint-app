// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mockIsSupabaseFeatureEnabled = vi.fn(() => false);
const mockListLatest = vi.fn();
const mockListEventsByTicketIds = vi.fn();
const mockListProfilesByIds = vi.fn();
const mockListJobsByIds = vi.fn();
const mockUpdateStatus = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseFeatureEnabled: () => mockIsSupabaseFeatureEnabled(),
}));

vi.mock("@/auth/auth.store", () => ({
  useAuthStore: (
    selector: (state: { session: { userId: string } }) => unknown,
  ) => selector({ session: { userId: "admin-1" } }),
}));

vi.mock("@/lib/supabase/data", () => ({
  supabaseSupport: {
    listLatest: (...args: unknown[]) => mockListLatest(...args),
    listEventsByTicketIds: (...args: unknown[]) =>
      mockListEventsByTicketIds(...args),
    updateStatus: (...args: unknown[]) => mockUpdateStatus(...args),
  },
  supabaseProfiles: {
    listByIds: (...args: unknown[]) => mockListProfilesByIds(...args),
  },
  supabaseJobs: {
    listByIds: (...args: unknown[]) => mockListJobsByIds(...args),
  },
}));

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

beforeEach(() => {
  mockIsSupabaseFeatureEnabled.mockReturnValue(false);
  mockListLatest.mockReset();
  mockListEventsByTicketIds.mockReset();
  mockListProfilesByIds.mockReset();
  mockListJobsByIds.mockReset();
  mockUpdateStatus.mockReset();
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

  it("shows an explicit access failure instead of leaving seeded support rows in place", async () => {
    mockIsSupabaseFeatureEnabled.mockReturnValue(true);
    mockListLatest.mockResolvedValue({
      ok: false,
      message: "Your account is not authorized to access the admin portal.",
    });

    render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        "Your account is not authorized to access the admin portal.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Emery Torff")).toBeNull();
  });

  it("persists live support status updates through Supabase when live reads are enabled", async () => {
    const user = userEvent.setup();
    mockIsSupabaseFeatureEnabled.mockReturnValue(true);
    const openTicketRow = {
      id: "ticket-live-1",
      requester_id: "user-live-1",
      requester_role: "user",
      job_id: null,
      subject: "Login help",
      description: "The requester cannot access the portal.",
      status: "open",
      priority: "high",
      assigned_admin_id: null,
      created_at: "2026-06-16T08:00:00.000Z",
      updated_at: "2026-06-16T08:00:00.000Z",
      resolved_at: null,
      closed_at: null,
    };
    const resolvedTicketRow = {
      ...openTicketRow,
      status: "resolved",
      updated_at: "2026-06-16T09:30:00.000Z",
      resolved_at: "2026-06-16T09:30:00.000Z",
    };

    mockListLatest
      .mockResolvedValueOnce({
        ok: true,
        data: [openTicketRow],
      })
      .mockResolvedValueOnce({
        ok: true,
        data: [resolvedTicketRow],
      });
    mockListEventsByTicketIds.mockResolvedValue({ ok: true, data: [] });
    mockListProfilesByIds.mockResolvedValue({
      ok: true,
      data: [
        {
          id: "user-live-1",
          email: "live.user@example.com",
          full_name: "Live User",
        },
      ],
    });
    mockListJobsByIds.mockResolvedValue({ ok: true, data: [] });
    mockUpdateStatus.mockResolvedValue({
      ok: true,
      data: resolvedTicketRow,
    });

    render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Live support reads/i)).toBeTruthy();
    expect((await screen.findAllByText("Live User")).length).toBeGreaterThan(0);

    await user.click(screen.getAllByLabelText(/actions for ticket/i)[0]);
    await user.click(await screen.findByText(/view details/i));

    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /update ticket/i }),
    );
    await user.click(await screen.findByText(/set as resolved/i));

    expect(mockUpdateStatus).toHaveBeenCalledWith({
      ticketId: "ticket-live-1",
      status: "resolved",
      actorUserId: "admin-1",
      message: "Support ticket marked as resolved.",
    });
    expect(
      await within(dialog).findByText(
        (_, element) => element?.textContent === "• Resolved",
      ),
    ).toBeTruthy();
  });
});
