// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  RequestDetailsCore,
  RequestDetailsSidebar,
} from "./request-details-sidebar";
import { userDetailsRecords } from "../user-details/user-details.data";

const storyUser = userDetailsRecords[0];
const request = storyUser.requestHistory[0];

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

describe("RequestDetailsSidebar", () => {
  it("renders the adaptive request details panel for mobile, tablet, and desktop widths", () => {
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 768, height: 1024 },
      { width: 1280, height: 900 },
    ]) {
      setViewport(viewport.width, viewport.height);

      const view = render(
        <RequestDetailsSidebar
          open
          request={request}
          customerName={storyUser.name}
          onOpenChange={() => undefined}
          onOpenLiveTracker={() => undefined}
          onUpdateStatus={() => undefined}
        />,
      );

      const dialog = screen.getByRole("dialog", { name: "Request details" });
      expect(dialog.className).toContain("bottom-0");
      expect(screen.getByText(request.requestCode)).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "Open live tracker" }),
      ).toBeTruthy();

      view.unmount();
    }
  });

  it("opens the status popup upward when space below is limited", async () => {
    const user = userEvent.setup();

    setViewport(375, 640);
    render(
      <RequestDetailsCore
        request={request}
        customerName={storyUser.name}
        onClose={() => undefined}
        onOpenLiveTracker={() => undefined}
        onUpdateStatus={() => undefined}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Update request status",
    });
    Object.defineProperty(trigger, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        x: 0,
        y: 560,
        top: 560,
        bottom: 608,
        left: 120,
        right: 320,
        width: 200,
        height: 48,
        toJSON: () => ({}),
      }),
    });

    await user.click(trigger);

    const menu = await screen.findByRole("menu");
    expect(menu.getAttribute("data-side")).toBe("top");
  });

  it("keeps the status popup upward even when enough space is available", async () => {
    const user = userEvent.setup();

    setViewport(1280, 900);
    render(
      <RequestDetailsCore
        request={request}
        customerName={storyUser.name}
        onClose={() => undefined}
        onOpenLiveTracker={() => undefined}
        onUpdateStatus={() => undefined}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Update request status",
    });
    Object.defineProperty(trigger, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        x: 0,
        y: 300,
        top: 300,
        bottom: 348,
        left: 120,
        right: 320,
        width: 200,
        height: 48,
        toJSON: () => ({}),
      }),
    });

    await user.click(trigger);

    const menu = await screen.findByRole("menu");
    expect(menu.getAttribute("data-side")).toBe("top");
  });
});
