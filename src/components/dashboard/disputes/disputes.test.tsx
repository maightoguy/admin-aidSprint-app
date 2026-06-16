// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mockIsSupabaseFeatureEnabled = vi.fn(() => false);
const mockListLatest = vi.fn();
const mockListEvidenceByDisputeIds = vi.fn();
const mockListEventsByDisputeIds = vi.fn();
const mockApplyAction = vi.fn();
const mockListJobsByIds = vi.fn();
const mockListPaymentsByIds = vi.fn();
const mockListWithdrawalsByIds = vi.fn();
const mockListProfilesByIds = vi.fn();

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
  useAuthStore: (selector: (state: { session: { userId: string } }) => unknown) =>
    selector({ session: { userId: "admin-1" } }),
}));

vi.mock("@/lib/supabase/data", () => ({
  supabaseDisputes: {
    listLatest: (...args: unknown[]) => mockListLatest(...args),
    listEvidenceByDisputeIds: (...args: unknown[]) =>
      mockListEvidenceByDisputeIds(...args),
    listEventsByDisputeIds: (...args: unknown[]) =>
      mockListEventsByDisputeIds(...args),
    applyAction: (...args: unknown[]) => mockApplyAction(...args),
  },
  supabaseJobs: {
    listByIds: (...args: unknown[]) => mockListJobsByIds(...args),
  },
  supabaseFinance: {
    listPaymentsByIds: (...args: unknown[]) => mockListPaymentsByIds(...args),
    listWithdrawalsByIds: (...args: unknown[]) =>
      mockListWithdrawalsByIds(...args),
  },
  supabaseProfiles: {
    listByIds: (...args: unknown[]) => mockListProfilesByIds(...args),
  },
}));

import DisputesPage from "./disputes";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockIsSupabaseFeatureEnabled.mockReturnValue(false);
  mockListLatest.mockReset();
  mockListEvidenceByDisputeIds.mockReset();
  mockListEventsByDisputeIds.mockReset();
  mockApplyAction.mockReset();
  mockListJobsByIds.mockReset();
  mockListPaymentsByIds.mockReset();
  mockListWithdrawalsByIds.mockReset();
  mockListProfilesByIds.mockReset();
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

  it("shows an explicit access failure instead of leaving seeded disputes in place", async () => {
    mockIsSupabaseFeatureEnabled.mockReturnValue(true);
    mockListLatest.mockResolvedValue({
      ok: false,
      message: "Your account is not authorized to access the admin portal.",
    });

    render(
      <MemoryRouter>
        <DisputesPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        "Your account is not authorized to access the admin portal.",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText("Customer reports overcharge after completion"),
    ).toBeNull();
  });

  it("persists supported live dispute actions through Supabase", async () => {
    const user = userEvent.setup();
    mockIsSupabaseFeatureEnabled.mockReturnValue(true);

    const openDisputeRow = {
      id: "dispute-live-1",
      job_id: "job-live-1",
      opened_by_id: "customer-1",
      opened_by_role: "customer",
      dispute_type: "payment",
      status: "open",
      priority: "high",
      reason: "Customer reported an overcharge on the final invoice.",
      requested_resolution: "Refund requested",
      assigned_admin_id: "admin-1",
      related_payment_id: "payment-1",
      related_withdrawal_id: null,
      resolution_type: null,
      resolution_amount: null,
      created_at: "2026-06-16T08:00:00.000Z",
      updated_at: "2026-06-16T08:00:00.000Z",
      resolved_at: null,
      rejected_at: null,
    };

    const resolvedDisputeRow = {
      ...openDisputeRow,
      status: "resolved",
      resolution_type: "refund",
      updated_at: "2026-06-16T10:15:00.000Z",
      resolved_at: "2026-06-16T10:15:00.000Z",
    };

    mockListLatest
      .mockResolvedValueOnce({ ok: true, data: [openDisputeRow] })
      .mockResolvedValueOnce({ ok: true, data: [resolvedDisputeRow] });
    mockListEvidenceByDisputeIds.mockResolvedValue({ ok: true, data: [] });
    mockListEventsByDisputeIds.mockResolvedValue({ ok: true, data: [] });
    mockListJobsByIds.mockResolvedValue({
      ok: true,
      data: [
        {
          id: "job-live-1",
          user_id: "customer-1",
          contractor_id: "contractor-1",
          service_type: "Deep Cleaning",
          address: "15 Admiralty Way",
          final_price: 200,
        },
      ],
    });
    mockListPaymentsByIds.mockResolvedValue({
      ok: true,
      data: [
        {
          id: "payment-1",
          amount: 200,
          contractor_payout: 150,
          status: "paid",
        },
      ],
    });
    mockListWithdrawalsByIds.mockResolvedValue({ ok: true, data: [] });
    mockListProfilesByIds.mockResolvedValue({
      ok: true,
      data: [
        {
          id: "customer-1",
          full_name: "Live Customer",
          email: "customer@example.com",
        },
        {
          id: "contractor-1",
          full_name: "Live Contractor",
          email: "contractor@example.com",
        },
        {
          id: "admin-1",
          full_name: "Ops Admin",
          email: "admin@example.com",
        },
      ],
    });
    mockApplyAction.mockResolvedValue({
      ok: true,
      data: resolvedDisputeRow,
    });

    render(
      <MemoryRouter>
        <DisputesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Live dispute reads/i)).toBeTruthy();
    expect(await screen.findByText("Live Customer")).toBeTruthy();

    await user.click(screen.getAllByLabelText(/actions for dispute/i)[0]);
    await user.click(await screen.findByText(/view details/i));

    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /dispute actions/i }),
    );
    await user.click(await screen.findByText("Mark resolved"));
    await user.type(
      screen.getByLabelText("Resolution reason"),
      "Refund approved after reviewing the payment evidence.",
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm resolution" }),
    );

    expect(mockApplyAction).toHaveBeenCalledWith({
      disputeId: "dispute-live-1",
      actorUserId: "admin-1",
      action: "resolve",
      reason: "Refund approved after reviewing the payment evidence.",
      message: undefined,
      resolutionType: "refund",
    });
    expect(await within(dialog).findByText("Resolved")).toBeTruthy();
  });
});
