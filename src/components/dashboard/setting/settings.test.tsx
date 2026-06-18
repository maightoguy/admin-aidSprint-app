// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mockIsSupabaseFeatureEnabled = vi.fn(() => false);
const mockIsSupabaseConfigured = vi.fn(() => false);
const mockSupabaseSignInWithPassword = vi.fn();
const mockSupabaseUpdateUser = vi.fn();
const mockMfaGetAal = vi.fn();
const mockMfaListFactors = vi.fn();
const mockSupabaseSettingsGet = vi.fn();
const mockSupabaseSettingsUpdate = vi.fn();
const mockSupabaseSettingsInsertEvent = vi.fn();
const mockSupabaseSettingsListEvents = vi.fn();
const mockListPlatformConfig = vi.fn();
const mockListServiceCategories = vi.fn();
const mockListServiceTypes = vi.fn();
const mockListUrgencyTiers = vi.fn();
const mockListPromoCodes = vi.fn();
const mockCreatePromoCode = vi.fn();
const mockUpdatePromoCode = vi.fn();
const mockDeletePromoCode = vi.fn();
const mockListNotificationTemplates = vi.fn();
const mockCreateNotificationTemplate = vi.fn();
const mockUpdateNotificationTemplate = vi.fn();
const mockListNotificationCampaigns = vi.fn();
const mockCreateNotificationCampaign = vi.fn();
const mockUpdateNotificationCampaign = vi.fn();
const mockSyncSessionFromSupabase = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseFeatureEnabled: () => mockIsSupabaseFeatureEnabled(),
  isSupabaseConfigured: () => mockIsSupabaseConfigured(),
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) =>
        mockSupabaseSignInWithPassword(...args),
      updateUser: (...args: unknown[]) => mockSupabaseUpdateUser(...args),
      mfa: {
        getAuthenticatorAssuranceLevel: (...args: unknown[]) =>
          mockMfaGetAal(...args),
        listFactors: (...args: unknown[]) => mockMfaListFactors(...args),
        enroll: vi.fn(),
        challenge: vi.fn(),
        verify: vi.fn(),
        unenroll: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/supabase/data", () => ({
  supabaseSettings: {
    getOrCreateAdminSecuritySettings: (...args: unknown[]) =>
      mockSupabaseSettingsGet(...args),
    updateAdminSecuritySettings: (...args: unknown[]) =>
      mockSupabaseSettingsUpdate(...args),
    insertAdminSecurityEvent: (...args: unknown[]) =>
      mockSupabaseSettingsInsertEvent(...args),
    listAdminSecurityEvents: (...args: unknown[]) =>
      mockSupabaseSettingsListEvents(...args),
    listPlatformConfig: (...args: unknown[]) => mockListPlatformConfig(...args),
    listServiceCategories: (...args: unknown[]) =>
      mockListServiceCategories(...args),
    listServiceTypes: (...args: unknown[]) => mockListServiceTypes(...args),
    listUrgencyTiers: (...args: unknown[]) => mockListUrgencyTiers(...args),
    listPromoCodes: (...args: unknown[]) => mockListPromoCodes(...args),
    createPromoCode: (...args: unknown[]) => mockCreatePromoCode(...args),
    updatePromoCode: (...args: unknown[]) => mockUpdatePromoCode(...args),
    deletePromoCode: (...args: unknown[]) => mockDeletePromoCode(...args),
    listNotificationTemplates: (...args: unknown[]) =>
      mockListNotificationTemplates(...args),
    createNotificationTemplate: (...args: unknown[]) =>
      mockCreateNotificationTemplate(...args),
    updateNotificationTemplate: (...args: unknown[]) =>
      mockUpdateNotificationTemplate(...args),
    listNotificationCampaigns: (...args: unknown[]) =>
      mockListNotificationCampaigns(...args),
    createNotificationCampaign: (...args: unknown[]) =>
      mockCreateNotificationCampaign(...args),
    updateNotificationCampaign: (...args: unknown[]) =>
      mockUpdateNotificationCampaign(...args),
  },
}));

vi.mock("@/auth/auth.store", () => ({
  useAuthStore: () => ({
    session: {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      userEmail: "admin@example.com",
      userId: "admin-1",
      expiresAtMs: Date.now() + 60_000,
    },
    syncSessionFromSupabase: (...args: unknown[]) =>
      mockSyncSessionFromSupabase(...args),
  }),
}));

import SettingsPage from "./settings";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  mockIsSupabaseFeatureEnabled.mockReturnValue(false);
  mockIsSupabaseConfigured.mockReturnValue(false);
});

describe("SettingsPage", () => {
  it("switches between Marketplace, Integrations and Security tabs", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Service categories")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /integrations/i }));

    expect(screen.getByText("Services Intergration")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /security/i }));

    expect(screen.getByText("Security")).toBeTruthy();
    expect(screen.getByLabelText("Old password")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /marketplace/i }));

    expect(screen.getByText("Service categories")).toBeTruthy();
  });

  it("filters integrations and toggles an item", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /integrations/i }));

    const search = screen.getByLabelText("Search integrations");
    await user.type(search, "plumb");

    expect(screen.getByText("Plumbing")).toBeTruthy();
    expect(screen.queryByText("Cleaning")).toBeNull();

    const plumbingSwitch = screen.getByRole("switch", { name: "Plumbing" });
    expect(plumbingSwitch.getAttribute("aria-checked")).toBe("true");
    await user.click(plumbingSwitch);
    expect(plumbingSwitch.getAttribute("aria-checked")).toBe("false");
  });

  it("validates password confirmation and enables submit on match", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /security/i }));

    const submit = screen.getByRole("button", { name: "Update password" });
    expect(submit.hasAttribute("disabled")).toBe(true);

    await user.type(screen.getByLabelText("Old password"), "old-password");
    await user.type(screen.getByLabelText("New password"), "new-password");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "not-matching",
    );

    expect(screen.getByText("Passwords do not match.")).toBeTruthy();
    expect(submit.hasAttribute("disabled")).toBe(true);

    await user.clear(screen.getByLabelText("Confirm new password"));
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "new-password",
    );

    expect(screen.queryByText("Passwords do not match.")).toBeNull();
    expect(submit.hasAttribute("disabled")).toBe(false);

    await user.click(submit);
  });

  it("submits a live password update when Supabase is enabled", async () => {
    mockIsSupabaseFeatureEnabled.mockReturnValue(true);
    mockSupabaseSettingsGet.mockResolvedValue({
      ok: true,
      data: {
        admin_user_id: "admin-1",
        mfa_policy: "optional",
        recovery_codes_generated_at: null,
        last_reauth_at: null,
        last_mfa_reset_requested_at: null,
        last_mfa_reset_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
    mockSupabaseSettingsListEvents.mockResolvedValue({ ok: true, data: [] });
    mockMfaGetAal.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
      error: null,
    });
    mockMfaListFactors.mockResolvedValue({ data: { all: [] }, error: null });
    mockSupabaseSettingsUpdate.mockResolvedValue({
      ok: true,
      data: {
        admin_user_id: "admin-1",
        mfa_policy: "optional",
        recovery_codes_generated_at: null,
        last_reauth_at: new Date().toISOString(),
        last_mfa_reset_requested_at: null,
        last_mfa_reset_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });

    mockSupabaseSignInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: "new-access",
          refresh_token: "new-refresh",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: { id: "admin-1", email: "admin@example.com" },
        },
      },
      error: null,
    });
    mockSupabaseUpdateUser.mockResolvedValue({
      data: { user: {} },
      error: null,
    });
    mockSupabaseSettingsInsertEvent.mockResolvedValue({
      ok: true,
      data: {
        id: "event-1",
        admin_user_id: "admin-1",
        actor_id: "admin-1",
        action: "password_changed",
        reason: "",
        metadata: {},
        created_at: new Date().toISOString(),
      },
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /security/i }));

    await user.type(screen.getByLabelText("Old password"), "old-password");
    await user.type(screen.getByLabelText("New password"), "new-password");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "new-password",
    );

    await user.click(screen.getByRole("button", { name: "Update password" }));

    const { toast } = await import("sonner");

    await waitFor(() => {
      expect(mockSupabaseSignInWithPassword).toHaveBeenCalled();
      expect(mockSupabaseUpdateUser).toHaveBeenCalledWith({
        password: "new-password",
      });
      expect(mockSupabaseSettingsInsertEvent).toHaveBeenCalledWith({
        action: "password_changed",
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("requires a reason to disable a marketplace category", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Service categories")).toBeTruthy();

    const actionButtons = screen.getAllByLabelText(/category actions for/i);
    await user.click(actionButtons[0]);

    await user.click(await screen.findByText("Disable category"));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("A reason is required.")).toBeTruthy();

    await user.type(
      screen.getByLabelText("Disable reason"),
      "Temporarily paused while we review compliance issues.",
    );

    await user.click(screen.getByRole("button", { name: "Confirm disable" }));
  });

  it("creates a promo through the live marketplace integration", async () => {
    mockIsSupabaseConfigured.mockReturnValue(true);
    mockListPlatformConfig.mockResolvedValue({ ok: true, data: [] });
    mockListServiceCategories.mockResolvedValue({ ok: true, data: [] });
    mockListServiceTypes.mockResolvedValue({ ok: true, data: [] });
    mockListUrgencyTiers.mockResolvedValue({ ok: true, data: [] });
    mockListNotificationTemplates.mockResolvedValue({ ok: true, data: [] });
    mockListNotificationCampaigns.mockResolvedValue({ ok: true, data: [] });
    mockListPromoCodes
      .mockResolvedValueOnce({ ok: true, data: [] })
      .mockResolvedValue({
        ok: true,
        data: [
          {
            id: "promo-1",
            code: "WELCOME15",
            description: "Welcome discount",
            discount_type: "percent",
            discount_value: 15,
            discount_currency: null,
            starts_on: "2026-06-01",
            ends_on: "2026-06-30",
            is_active: true,
            created_at: "2026-06-01T10:00:00.000Z",
            updated_at: "2026-06-02T10:00:00.000Z",
          },
        ],
      });
    mockCreatePromoCode.mockResolvedValue({
      ok: true,
      data: {
        id: "promo-1",
        code: "WELCOME15",
        description: "Welcome discount",
        discount_type: "percent",
        discount_value: 15,
        discount_currency: null,
        starts_on: "2026-06-01",
        ends_on: "2026-06-30",
        is_active: true,
        created_at: "2026-06-01T10:00:00.000Z",
        updated_at: "2026-06-02T10:00:00.000Z",
      },
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Live read source loaded from Supabase/i),
      ).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: /create promo/i }));
    await user.type(screen.getByLabelText("Promo code"), "WELCOME15");
    await user.type(
      screen.getByLabelText("Promo description"),
      "Welcome discount",
    );
    await user.clear(screen.getByLabelText("Discount value"));
    await user.type(screen.getByLabelText("Discount value"), "15");
    await user.clear(screen.getByLabelText("Promo start date"));
    await user.type(screen.getByLabelText("Promo start date"), "2026-06-01");
    await user.clear(screen.getByLabelText("Promo end date"));
    await user.type(screen.getByLabelText("Promo end date"), "2026-06-30");

    await user.click(screen.getByRole("button", { name: "Create promo" }));

    await waitFor(() => {
      expect(mockCreatePromoCode).toHaveBeenCalledWith({
        code: "WELCOME15",
        description: "Welcome discount",
        discountType: "percent",
        discountValue: 15,
        startsOn: "2026-06-01",
        endsOn: "2026-06-30",
        isActive: true,
      });
    });
  });

  it("enables a notification campaign through the live marketplace integration", async () => {
    mockIsSupabaseConfigured.mockReturnValue(true);
    mockListPlatformConfig.mockResolvedValue({ ok: true, data: [] });
    mockListServiceCategories.mockResolvedValue({ ok: true, data: [] });
    mockListServiceTypes.mockResolvedValue({ ok: true, data: [] });
    mockListUrgencyTiers.mockResolvedValue({ ok: true, data: [] });
    mockListPromoCodes.mockResolvedValue({ ok: true, data: [] });
    mockListNotificationTemplates.mockResolvedValue({
      ok: true,
      data: [
        {
          id: "template-1",
          name: "Dispatch alert",
          channel: "push",
          title_template: "Dispatch alert",
          body_template: "A request needs review.",
          payload_template: {},
          is_active: true,
          created_at: "2026-06-01T10:00:00.000Z",
          updated_at: "2026-06-02T10:00:00.000Z",
        },
      ],
    });
    mockListNotificationCampaigns.mockResolvedValue({
      ok: true,
      data: [
        {
          id: "campaign-1",
          name: "Dispatch campaign",
          description: "Notify dispatchers about new jobs.",
          channel: "push",
          template_id: "template-1",
          status: "disabled",
          created_at: "2026-06-01T10:00:00.000Z",
          updated_at: "2026-06-02T10:00:00.000Z",
        },
      ],
    });
    mockUpdateNotificationCampaign.mockResolvedValue({
      ok: true,
      data: {
        id: "campaign-1",
        name: "Dispatch campaign",
        description: "Notify dispatchers about new jobs.",
        channel: "push",
        template_id: "template-1",
        status: "enabled",
        created_at: "2026-06-01T10:00:00.000Z",
        updated_at: "2026-06-03T10:00:00.000Z",
      },
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Dispatch campaign")).toBeTruthy();
    });

    await user.click(
      screen.getByLabelText("Notification actions for Dispatch campaign"),
    );
    await user.click(await screen.findByText("Enable campaign"));
    await user.type(
      screen.getByLabelText("Reason"),
      "Re-enabled after the template review completed.",
    );
    await user.click(screen.getByRole("button", { name: "Confirm enable" }));

    await waitFor(() => {
      expect(mockUpdateNotificationCampaign).toHaveBeenCalledWith({
        id: "campaign-1",
        status: "enabled",
      });
    });
  });
});
