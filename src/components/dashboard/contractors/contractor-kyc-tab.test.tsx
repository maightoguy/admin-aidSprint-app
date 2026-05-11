// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContractorKycProvider } from "./contractor-kyc-context";
import { ContractorKycTab } from "./contractor-kyc-tab";
import type {
  ContractorKycState,
  ContractorKycDocumentRecord,
} from "./contractors.types";
import { contractorRecords } from "./contractors.data";

const contractor = contractorRecords[0];

function createFile(
  name: string,
  type = "application/pdf",
  size = 1024 * 1024,
) {
  const file = new File(["mock document"], name, { type });
  Object.defineProperty(file, "size", {
    value: size,
    configurable: true,
  });
  return file;
}

function createDocument(
  fileName: string,
  objectUrl: string,
): ContractorKycDocumentRecord {
  return {
    file: createFile(fileName),
    fileName,
    fileSize: 1024 * 1024,
    fileSizeLabel: "1.0 MB",
    mimeType: "application/pdf",
    uploadedAtIso: new Date().toISOString(),
    uploadedAtLabel: "Apr 11, 2026, 9:00 AM",
    objectUrl,
  };
}

function renderKycTab(initialState?: Partial<ContractorKycState>) {
  return render(
    <ContractorKycProvider initialState={initialState}>
      <ContractorKycTab contractor={contractor} />
    </ContractorKycProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("open", vi.fn());
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:mock-document"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ContractorKycTab (read-only review)", () => {
  it("renders the read-only empty state by default", () => {
    renderKycTab();

    expect(screen.getAllByText("ID verification").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Police check document").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText("Service provider licences").length,
    ).toBeGreaterThan(0);

    expect(screen.getByText(/Awaiting contractor submission/i)).toBeTruthy();
    expect(
      screen.getByText(/No submitted document available yet/i),
    ).toBeTruthy();

    expect(screen.queryByLabelText(/upload/i)).toBeNull();
  });

  it("views and accepts a pending ID document", async () => {
    const user = userEvent.setup();
    const fileName = "id-document.pdf";
    renderKycTab({
      activeCategory: "id",
      idDoc: createDocument(fileName, "blob:id-document"),
      idStatus: "pending",
    });

    expect(await screen.findByText(fileName)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: `View ${fileName}` }));
    expect(window.open).toHaveBeenCalledWith(
      "blob:id-document",
      "_blank",
      "noopener,noreferrer",
    );

    await user.click(screen.getByRole("button", { name: "Accept" }));
    expect(
      await screen.findByRole("dialog", { name: "Accept Document" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByText(/Accepted · Alison Eyo/i)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Download document/i }),
    ).toBeTruthy();
  });

  it("rejects a pending police document with reason capture", async () => {
    const user = userEvent.setup();
    const fileName = "police-check.pdf";
    renderKycTab({
      activeCategory: "police",
      policeDoc: createDocument(fileName, "blob:police-check"),
      policeStatus: "pending",
    });

    expect(await screen.findByText(fileName)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Reject" }));

    const rejectDialog = await screen.findByRole("dialog", {
      name: "Reject Document",
    });
    expect(rejectDialog).toBeTruthy();

    const confirmButton = screen.getByRole("button", {
      name: "Confirm rejection",
    });
    expect(confirmButton).toHaveProperty("disabled", true);

    await user.type(
      screen.getByLabelText("Rejection reason"),
      "Document is expired.",
    );
    await user.click(confirmButton);

    expect(await screen.findByText(/Rejected ·/i)).toBeTruthy();
    expect(screen.getByText("Document is expired.")).toBeTruthy();
    expect(screen.getByText(/Awaiting a corrected resubmission/i)).toBeTruthy();
  });

  it("renders accepted police documents with download affordance", async () => {
    renderKycTab({
      activeCategory: "police",
      policeDoc: createDocument("police-approved.pdf", "blob:police-approved"),
      policeStatus: "accepted",
      policeReviewedAt: "Apr 11, 2026, 11:00 AM",
      policeReviewedBy: "Alison Eyo",
    });

    expect(await screen.findByText("police-approved.pdf")).toBeTruthy();
    expect(screen.getByText(/Accepted · Alison Eyo/i)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Download document/i }),
    ).toBeTruthy();
  });

  it("renders service provider licences and supports accept flow", async () => {
    const user = userEvent.setup();
    renderKycTab({
      activeCategory: "serviceProvider",
      serviceProviderDocs: [
        createDocument("service-1.pdf", "blob:service-1"),
        createDocument("service-2.pdf", "blob:service-2"),
      ],
      serviceProviderStatus: "pending",
    });

    expect(await screen.findByText("service-1.pdf")).toBeTruthy();
    expect(screen.getByText("service-2.pdf")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Accept" }));
    expect(
      await screen.findByRole("dialog", { name: "Accept Document" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(screen.getByText(/Accepted · Alison Eyo/i)).toBeTruthy();
    });
  });

  it("renders rejected ID state with reason", async () => {
    renderKycTab({
      activeCategory: "id",
      idDoc: createDocument("rejected-id.pdf", "blob:rejected-id"),
      idStatus: "rejected",
      idReason: "Document has expired.",
      idReviewedAt: "Apr 11, 2026, 9:20 AM",
      idReviewedBy: "Alison Eyo",
    });

    expect(await screen.findByText("Document has expired.")).toBeTruthy();
    expect(screen.getByText(/Awaiting a corrected resubmission/i)).toBeTruthy();
  });
});
