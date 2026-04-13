// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "./settings";

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

describe("SettingsPage", () => {
  it("switches between Integrations and Security tabs", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Services Intergration")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /security/i }));

    expect(screen.getByText("Security")).toBeTruthy();
    expect(screen.getByLabelText("Old password")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /integrations/i }));

    expect(screen.getByText("Services Intergration")).toBeTruthy();
  });

  it("filters integrations and toggles an item", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

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
});
