// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContractorDetailsPage from "./contractor-details-page";
import {
  ContractorKycProvider,
  useContractorKyc,
} from "./contractor-kyc-context";
import { ContractorKycTab } from "./contractor-kyc-tab";
import type { ContractorKycState } from "./contractors.types";
import { contractorRecords } from "./contractors.data";

const contractor = contractorRecords[0];

function renderKycTab(initialState?: Partial<ContractorKycState>) {
  return render(
    <ContractorKycProvider initialState={initialState}>
      <ContractorKycTab contractor={contractor} />
    </ContractorKycProvider>,
  );
}

function ContextHarness() {
  const { openDocument, rejectDocument, uploadDocument } = useContractorKyc();
  const [result, setResult] = useState("");

  return (
    <div>
      <button type="button" onClick={() => openDocument("police")}>
        Open without document
      </button>
      <button
        type="button"
        onClick={() => {
          const response = rejectDocument("id", "");
          if (response.ok === false) {
            setResult(response.error);
            return;
          }

          setResult("ok");
        }}
      >
        Reject without reason
      </button>
      <button
        type="button"
        onClick={() => {
          const response = uploadDocument(
            "id",
            createFile("reupload.pdf", "application/pdf"),
          );
          if (response.ok === false) {
            setResult(response.error);
            return;
          }

          setResult("ok");
        }}
      >
        Upload replacement
      </button>
      <span>{result}</span>
    </div>
  );
}

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

describe("ContractorKycTab", () => {
  it("renders the no-document state by default", () => {
    renderKycTab();

    expect(screen.getAllByText("ID verification").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Police check document").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText("Service provider licences").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("No available document yet!")).toBeTruthy();
    expect(screen.getByLabelText("Upload ID verification")).toBeTruthy();
  });

  it("uploads and accepts an ID document", async () => {
    const user = userEvent.setup();
    renderKycTab();

    await user.upload(
      screen.getByLabelText("Upload ID verification"),
      createFile("id-document.pdf"),
    );

    expect(await screen.findByText("id-document.pdf")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: /View id-document.pdf/i }),
    );
    expect(window.open).toHaveBeenCalledWith(
      "blob:mock-document",
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
  }, 10000);

  it("rejects a police document and resets for re-upload", async () => {
    const user = userEvent.setup();
    renderKycTab();

    await user.click(
      screen.getByRole("button", {
        name: "Document missing Police check document",
      }),
    );
    await user.upload(
      screen.getByLabelText("Upload Police check document"),
      createFile("police-check.pdf"),
    );

    expect(await screen.findByText("police-check.pdf")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Reject" }));

    const rejectDialog = await screen.findByRole("dialog", {
      name: "Reject Document",
    });
    expect(rejectDialog).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Confirm rejection" }),
    ).toHaveProperty("disabled", true);

    await user.type(
      screen.getByLabelText("Rejection reason"),
      "Document is expired.",
    );
    await user.click(screen.getByRole("button", { name: "Confirm rejection" }));

    expect(await screen.findByText(/Rejected ·/i)).toBeTruthy();
    expect(screen.getByText("Document is expired.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Re-upload" }));
    expect(
      await screen.findByText("No police check document uploaded"),
    ).toBeTruthy();
  }, 10000);

  it("renders service provider as an accordion when a document exists", async () => {
    const user = userEvent.setup();
    renderKycTab({
      activeCategory: "serviceProvider",
      serviceProviderDocs: [
        {
          file: createFile("service-licence.pdf"),
          fileName: "service-licence.pdf",
          fileSize: 1024 * 1024,
          fileSizeLabel: "1.0 MB",
          mimeType: "application/pdf",
          uploadedAtIso: new Date().toISOString(),
          uploadedAtLabel: "Apr 10, 2026, 9:20 AM",
          objectUrl: "blob:service-licence",
        },
      ],
      serviceProviderStatus: "pending",
    });

    const accordionTrigger = screen.getAllByRole("button", {
      name: /Service provider licence/i,
    })[1];
    expect(accordionTrigger).toBeTruthy();
    expect(screen.getByText("service-licence.pdf")).toBeTruthy();

    await user.click(accordionTrigger);
    await waitFor(() => {
      expect(screen.queryByText("service-licence.pdf")).toBeNull();
    });
  });

  it("updates the kyc tab count on the contractor details page", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/contractors/emery-torff"]}>
        <Routes>
          <Route
            path="/contractors/:contractorId"
            element={<ContractorDetailsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("tab", { name: "KYC verification(0/3)" }),
    );
    await user.upload(
      screen.getByLabelText("Upload ID verification"),
      createFile("count-test.pdf"),
    );

    expect(
      await screen.findByRole("tab", { name: "KYC verification(1/3)" }),
    ).toBeTruthy();
  });

  it("accepts a pending police document and views it", async () => {
    const user = userEvent.setup();

    renderKycTab({
      activeCategory: "police",
      policeDoc: {
        file: createFile("pending-police.pdf"),
        fileName: "pending-police.pdf",
        fileSize: 1024 * 1024,
        fileSizeLabel: "1.0 MB",
        mimeType: "application/pdf",
        uploadedAtIso: new Date().toISOString(),
        uploadedAtLabel: "Apr 11, 2026, 10:20 AM",
        objectUrl: "blob:pending-police",
      },
      policeStatus: "pending",
    });

    await user.click(
      screen.getByRole("button", { name: /View pending-police.pdf/i }),
    );
    expect(window.open).toHaveBeenCalledWith(
      "blob:pending-police",
      "_blank",
      "noopener,noreferrer",
    );

    await user.click(screen.getByRole("button", { name: "Accept" }));
    await user.click(await screen.findByRole("button", { name: "Confirm" }));

    expect(await screen.findByText(/Accepted · Alison Eyo/i)).toBeTruthy();
  });

  it("renders accepted police and service provider documents with downloads", async () => {
    const user = userEvent.setup();

    renderKycTab({
      activeCategory: "police",
      policeDoc: {
        file: createFile("police-approved.pdf"),
        fileName: "police-approved.pdf",
        fileSize: 1024 * 1024,
        fileSizeLabel: "1.0 MB",
        mimeType: "application/pdf",
        uploadedAtIso: new Date().toISOString(),
        uploadedAtLabel: "Apr 11, 2026, 10:20 AM",
        objectUrl: "blob:police-approved",
      },
      policeStatus: "accepted",
      policeReviewedAt: "Apr 11, 2026, 11:00 AM",
      policeReviewedBy: "Alison Eyo",
      serviceProviderDocs: [
        {
          file: createFile("service-approved.pdf"),
          fileName: "service-approved.pdf",
          fileSize: 1024 * 1024,
          fileSizeLabel: "1.0 MB",
          mimeType: "application/pdf",
          uploadedAtIso: new Date().toISOString(),
          uploadedAtLabel: "Apr 11, 2026, 10:40 AM",
          objectUrl: "blob:service-approved",
        },
      ],
      serviceProviderStatus: "accepted",
      serviceProviderReviewedAt: "Apr 11, 2026, 11:10 AM",
      serviceProviderReviewedBy: "Alison Eyo",
    });

    expect(await screen.findByText("police-approved.pdf")).toBeTruthy();
    expect(screen.getByText(/Accepted · Alison Eyo/i)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Download document/i }),
    ).toBeTruthy();

    await user.click(
      screen.getByRole("button", {
        name: "Document accepted Service provider licences",
      }),
    );

    expect(await screen.findByText("service-approved.pdf")).toBeTruthy();
    expect(
      screen.getAllByText(/Accepted · Alison Eyo/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /service-approved.pdf/i }).length,
    ).toBeGreaterThan(0);
  });

  it("renders empty police and service provider layouts", async () => {
    const user = userEvent.setup();
    renderKycTab();

    await user.click(
      screen.getByRole("button", {
        name: "Document missing Police check document",
      }),
    );
    expect(
      await screen.findByText("No police check document uploaded"),
    ).toBeTruthy();

    await user.click(
      screen.getByRole("button", {
        name: "Document missing Service provider licences",
      }),
    );
    expect(
      await screen.findByText(
        "No service provider licence has been uploaded yet.",
      ),
    ).toBeTruthy();
  });

  it("renders the rejected id state and resets it for re-upload", async () => {
    const user = userEvent.setup();

    renderKycTab({
      activeCategory: "id",
      idDoc: {
        file: createFile("rejected-id.pdf"),
        fileName: "rejected-id.pdf",
        fileSize: 1024 * 1024,
        fileSizeLabel: "1.0 MB",
        mimeType: "application/pdf",
        uploadedAtIso: new Date().toISOString(),
        uploadedAtLabel: "Apr 11, 2026, 9:15 AM",
        objectUrl: "blob:rejected-id",
      },
      idStatus: "rejected",
      idReason: "Document has expired.",
      idReviewedAt: "Apr 11, 2026, 9:20 AM",
      idReviewedBy: "Alison Eyo",
    });

    expect(await screen.findByText("Document has expired.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Re-upload" }));
    expect(await screen.findByText("No available document yet!")).toBeTruthy();
  });

  it("rejects and resets a service provider document", async () => {
    const user = userEvent.setup();

    renderKycTab({
      activeCategory: "serviceProvider",
      serviceProviderDocs: [
        {
          file: createFile("service-pending.pdf"),
          fileName: "service-pending.pdf",
          fileSize: 1024 * 1024,
          fileSizeLabel: "1.0 MB",
          mimeType: "application/pdf",
          uploadedAtIso: new Date().toISOString(),
          uploadedAtLabel: "Apr 11, 2026, 10:40 AM",
          objectUrl: "blob:service-pending",
        },
      ],
      serviceProviderStatus: "pending",
    });

    expect(
      screen.getByRole("link", { name: /service-pending.pdf 1.0 MB/i }),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.type(screen.getByLabelText("Rejection reason"), "Needs update");
    await user.click(screen.getByRole("button", { name: "Confirm rejection" }));

    expect(await screen.findByText("Needs update")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Re-upload" }));
    expect(
      await screen.findByText(
        "No service provider licence has been uploaded yet.",
      ),
    ).toBeTruthy();
  }, 10000);

  it("supports up to four service provider licences in a two-by-two grid", async () => {
    const user = userEvent.setup();
    renderKycTab();

    await user.click(
      screen.getByRole("button", {
        name: "Document missing Service provider licences",
      }),
    );

    await user.upload(
      screen.getByLabelText("Upload Service provider licence"),
      [
        createFile("service-1.pdf"),
        createFile("service-2.pdf"),
        createFile("service-3.pdf"),
        createFile("service-4.pdf"),
      ],
    );

    expect(await screen.findByText("service-1.pdf")).toBeTruthy();
    expect(screen.getByText("service-2.pdf")).toBeTruthy();
    expect(screen.getByText("service-3.pdf")).toBeTruthy();
    expect(screen.getByText("service-4.pdf")).toBeTruthy();
    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(4);
    expect(
      screen.queryByLabelText("Upload Service provider licence"),
    ).toBeNull();
    expect(screen.queryByText("service-5.pdf")).toBeNull();
  }, 10000);

  it("closes review dialogs without changing document state", async () => {
    const user = userEvent.setup();
    renderKycTab();

    await user.upload(
      screen.getByLabelText("Upload ID verification"),
      createFile("cancel-flow.pdf"),
    );

    await user.click(screen.getByRole("button", { name: "Accept" }));
    expect(
      await screen.findByRole("dialog", { name: "Accept Document" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Accept Document" }),
      ).toBeNull();
    });

    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(
      await screen.findByRole("dialog", { name: "Reject Document" }),
    ).toBeTruthy();
    await user.type(
      screen.getByLabelText("Rejection reason"),
      "Temporary note",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(
      await screen.findByRole("dialog", { name: "Reject Document" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Rejection reason")).toHaveProperty(
      "value",
      "",
    );
  }, 10000);

  it("clears reject modal state when closed with escape and ignores invalid uploads", async () => {
    const user = userEvent.setup();
    renderKycTab();

    await user.click(
      screen.getByRole("button", {
        name: "Document missing Service provider licences",
      }),
    );
    await user.upload(
      screen.getByLabelText("Upload Service provider licence"),
      createFile("bad-file.txt", "text/plain"),
    );
    expect(screen.queryByText("bad-file.txt")).toBeNull();

    await user.click(
      screen.getByRole("button", {
        name: "Document missing ID verification",
      }),
    );
    await user.upload(
      screen.getByLabelText("Upload ID verification"),
      createFile("escape-flow.pdf"),
    );
    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.type(screen.getByLabelText("Rejection reason"), "Needs reset");
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Reject Document" }),
      ).toBeNull();
    });

    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(
      await screen.findByRole("dialog", { name: "Reject Document" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Rejection reason")).toHaveProperty(
      "value",
      "",
    );
  }, 10000);

  it("handles context edge cases", async () => {
    const user = userEvent.setup();

    render(
      <ContractorKycProvider
        initialState={{
          idDoc: {
            file: createFile("existing.pdf"),
            fileName: "existing.pdf",
            fileSize: 1024 * 1024,
            fileSizeLabel: "1.0 MB",
            mimeType: "application/pdf",
            uploadedAtIso: new Date().toISOString(),
            uploadedAtLabel: "Apr 11, 2026, 9:00 AM",
            objectUrl: "blob:existing",
          },
          idStatus: "pending",
        }}
      >
        <ContextHarness />
      </ContractorKycProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Open without document" }),
    );
    expect(window.open).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Reject without reason" }),
    );
    expect(screen.getByText("Rejection reason is required.")).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: "Upload replacement" }),
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:existing");
  });
});
