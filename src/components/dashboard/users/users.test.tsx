// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { UsersActionsMenu } from "./users-actions-menu";
import { userRecords } from "./users.data";
import { filterUsers, getStatusPillClasses } from "./users.utils";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

let container: HTMLDivElement | null = null;
let root: Root | null = null;

beforeAll(() => {
  // @ts-expect-error jsdom pointer event shim
  window.PointerEvent = window.PointerEvent ?? MouseEvent;
});

afterEach(async () => {
  if (root) {
    await act(async () => {
      root?.unmount();
    });
  }

  if (container) {
    container.remove();
  }

  container = null;
  root = null;
  document.body.innerHTML = "";
});

async function renderMenu() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  const onAction = vi.fn();

  await act(async () => {
    root?.render(
      <UsersActionsMenu user={userRecords[0]} onAction={onAction} />,
    );
  });

  const trigger = document.querySelector(
    'button[aria-label="Open user actions for Emery Torff"]',
  ) as HTMLButtonElement;

  await act(async () => {
    trigger.dispatchEvent(
      new window.PointerEvent("pointerdown", { bubbles: true }),
    );
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  return { onAction };
}

describe("users utils", () => {
  it("filters users by name, email, location, and status", () => {
    expect(filterUsers(userRecords, "Emery").map((user) => user.id)).toEqual([
      "emery-torff",
    ]);
    expect(filterUsers(userRecords, "email.com")).toHaveLength(userRecords.length);
    expect(filterUsers(userRecords, "Deactivated").map((user) => user.id)).toEqual([
      "maren-dokidis",
      "marcus-dias",
    ]);
    expect(filterUsers(userRecords, "113 Gashua")).toHaveLength(4);
  });

  it("returns the expected status classes", () => {
    expect(getStatusPillClasses("Active")).toContain("#22A75A");
    expect(getStatusPillClasses("Deactivated")).toContain("#EF4444");
  });
});

describe("UsersActionsMenu", () => {
  it("renders the menu items and calls the selected action", async () => {
    const { onAction } = await renderMenu();

    expect(document.body.textContent).toContain("View profile");
    expect(document.body.textContent).toContain("Activate account");
    expect(document.body.textContent).toContain("Deactivate account");

    const deactivateAccountItem = Array.from(
      document.querySelectorAll('[role="menuitem"]'),
    ).find((item) => item.textContent?.includes("Deactivate account"));

    expect(deactivateAccountItem).toBeTruthy();

    await act(async () => {
      deactivateAccountItem?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(onAction).toHaveBeenCalledWith("Deactivate account", userRecords[0]);
  });
});
