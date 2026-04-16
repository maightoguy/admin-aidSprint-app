// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useState } from "react";
import type { FilterField, FiltersState } from "./filter-schema";
import { FilterModal } from "./filter-modal";

const defaultSchema: FilterField[] = [
  {
    type: "dateRange",
    key: "dateRange",
    label: "Date range",
    fromKey: "from",
    toKey: "to",
  },
  {
    type: "select",
    key: "status",
    label: "Status",
    options: [
      { label: "Pending", value: "Pending" },
      { label: "Approved", value: "Approved" },
    ],
  },
  {
    type: "multiSelect",
    key: "channel",
    label: "Channels",
    options: [
      { label: "Email", value: "Email" },
      { label: "SMS", value: "SMS" },
    ],
  },
  {
    type: "numberRange",
    key: "amountRange",
    label: "Amount range",
    minKey: "minAmount",
    maxKey: "maxAmount",
    minLabel: "Min amount",
    maxLabel: "Max amount",
  },
];

function setViewport(width: number, height = 900) {
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

function ModalHarness({
  initialValue = {},
  schema = defaultSchema,
}: {
  initialValue?: FiltersState;
  schema?: FilterField[];
}) {
  const [open, setOpen] = useState(true);
  const [applied, setApplied] = useState<FiltersState | null>(null);
  const [resetCount, setResetCount] = useState(0);

  return (
    <>
      <FilterModal
        open={open}
        onOpenChange={setOpen}
        title="Calendar filters"
        schema={schema}
        value={initialValue}
        onApply={(nextValue) => setApplied(nextValue)}
        onReset={() => setResetCount((count) => count + 1)}
      />
      <output data-testid="modal-open">{String(open)}</output>
      <output data-testid="reset-count">{String(resetCount)}</output>
      <output data-testid="applied-filters">
        {applied ? JSON.stringify(applied) : ""}
      </output>
    </>
  );
}

async function chooseStatus(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
) {
  await user.click(screen.getByRole("combobox", { name: /select status/i }));
  await user.click(await screen.findByRole("option", { name: label }));
}

beforeEach(() => {
  setViewport(1440, 900);
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = () => undefined;
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = () => undefined;
  }
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => undefined;
  }
});

afterEach(() => {
  cleanup();
});

describe("FilterModal", () => {
  it("renders the inline desktop calendar within the 60vw dialog shell", () => {
    render(<ModalHarness />);

    const dialog = screen.getByTestId("filter-modal");

    expect(dialog.getAttribute("data-layout")).toBe("desktop");
    expect(dialog.className).toContain("lg:max-w-[60vw]");
    expect(screen.getByRole("grid")).toBeTruthy();
    expect(screen.getByLabelText("Date range start date")).toBeTruthy();
  });

  it("switches to the compact tablet layout without the inline calendar", () => {
    setViewport(768, 1024);
    render(<ModalHarness />);

    const dialog = screen.getByTestId("filter-modal");

    expect(dialog.getAttribute("data-layout")).toBe("tablet");
    expect(dialog.className).toContain("md:max-w-[40vw]");
    expect(screen.queryByRole("grid")).toBeNull();
    expect(screen.getByLabelText("Date range end date")).toBeTruthy();
  });

  it("uses an accordion on mobile and allows keyboard access to hidden filters", async () => {
    const user = userEvent.setup();
    setViewport(320, 700);

    render(<ModalHarness />);

    const dialog = screen.getByTestId("filter-modal");
    expect(dialog.getAttribute("data-layout")).toBe("mobile");
    expect(
      screen.queryByRole("combobox", { name: /select status/i }),
    ).toBeNull();

    const statusTrigger = screen.getByRole("button", { name: /status/i });
    statusTrigger.focus();
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("combobox", { name: /select status/i }),
    ).toBeTruthy();
  });

  it("preserves draft state while resizing and applies the selected filters", async () => {
    const user = userEvent.setup();
    setViewport(1024, 900);

    render(<ModalHarness />);

    await user.type(
      screen.getByLabelText("Date range start date"),
      "2026-04-01",
    );
    await user.type(screen.getByLabelText("Date range end date"), "2026-04-14");
    await chooseStatus(user, "Approved");
    await user.click(screen.getByLabelText("Channels Email"));
    await user.type(screen.getByLabelText("Amount range Min amount"), "100");
    await user.type(screen.getByLabelText("Amount range Max amount"), "500");

    setViewport(320, 700);

    await waitFor(() => {
      expect(
        screen.getByTestId("filter-modal").getAttribute("data-layout"),
      ).toBe("mobile");
    });
    expect(
      screen.getByLabelText("Date range start date").getAttribute("value"),
    ).toBe("2026-04-01");
    expect(screen.getByText("Status: Approved")).toBeTruthy();

    const amountTrigger = screen.getByRole("button", { name: /amount range/i });
    await user.click(amountTrigger);

    expect(
      screen.getByLabelText("Amount range Min amount").getAttribute("value"),
    ).toBe("100");
    expect(
      screen.getByLabelText("Amount range Max amount").getAttribute("value"),
    ).toBe("500");

    await user.click(screen.getByRole("button", { name: "Apply" }));

    const applied = JSON.parse(
      screen.getByTestId("applied-filters").textContent ?? "{}",
    );
    expect(applied).toEqual({
      from: "2026-04-01",
      to: "2026-04-14",
      status: "Approved",
      channel: ["Email"],
      minAmount: 100,
      maxAmount: 500,
    });
    expect(screen.getByTestId("modal-open").textContent).toBe("false");
  });

  it("resets filters through the footer action and closes the dialog", async () => {
    const user = userEvent.setup();
    render(
      <ModalHarness
        initialValue={{
          from: "2026-03-01",
          to: "2026-03-31",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByTestId("reset-count").textContent).toBe("1");
    expect(screen.getByTestId("modal-open").textContent).toBe("false");
  });

  it("closes from keyboard escape and from the cancel action", async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);

    await user.keyboard("{Escape}");
    expect(screen.getByTestId("modal-open").textContent).toBe("false");

    cleanup();
    render(<ModalHarness />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByTestId("modal-open").textContent).toBe("false");
  });

  it("gracefully skips unsupported runtime field definitions", () => {
    render(
      <ModalHarness
        schema={[
          {
            type: "unsupported",
            key: "legacyField",
            label: "Legacy field",
          } as unknown as FilterField,
        ]}
      />,
    );

    expect(screen.getByTestId("filter-modal")).toBeTruthy();
    expect(screen.queryByText("Legacy field")).toBeNull();
    expect(screen.getByRole("button", { name: "Apply" })).toBeTruthy();
  });
});
