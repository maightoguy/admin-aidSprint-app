import { useMemo, useState, type ChangeEvent } from "react";
import {
  Check,
  CheckCircle2,
  CircleAlert,
  Download,
  Eye,
  FileText,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useContractorKyc } from "./contractor-kyc-context";
import type {
  ContractorKycCategory,
  ContractorKycDocumentRecord,
  ContractorKycState,
  ContractorKycStatus,
  ContractorRecord,
} from "./contractors.types";

type CategoryDetails = {
  title: string;
  panelTitle: string;
  documentLabel: string;
  typeValue?: string;
  secondaryValueLabel?: string;
  secondaryValue?: string;
};

const categoryDetails: Record<ContractorKycCategory, CategoryDetails> = {
  id: {
    title: "ID verification",
    panelTitle: "ID verification",
    documentLabel: "Document",
    typeValue: "National Identification",
    secondaryValueLabel: "Company name",
  },
  police: {
    title: "Police check document",
    panelTitle: "Police check document",
    documentLabel: "Document",
  },
  serviceProvider: {
    title: "Service provider licences",
    panelTitle: "Service provider licence",
    documentLabel: "Document",
  },
};

function getCategorySnapshot(
  state: ContractorKycState,
  category: ContractorKycCategory,
) {
  if (category === "id") {
    return {
      doc: state.idDoc,
      status: state.idStatus,
      reason: state.idReason,
      reviewedAt: state.idReviewedAt,
      reviewedBy: state.idReviewedBy,
    };
  }

  if (category === "police") {
    return {
      doc: state.policeDoc,
      status: state.policeStatus,
      reason: state.policeReason,
      reviewedAt: state.policeReviewedAt,
      reviewedBy: state.policeReviewedBy,
    };
  }

  return {
    doc: state.serviceProviderDoc,
    status: state.serviceProviderStatus,
    reason: state.serviceProviderReason,
    reviewedAt: state.serviceProviderReviewedAt,
    reviewedBy: state.serviceProviderReviewedBy,
  };
}

function KycStatusIcon({
  status,
  hasDocument,
}: {
  status: ContractorKycStatus | null;
  hasDocument: boolean;
}) {
  if (!hasDocument) {
    return (
      <span
        role="img"
        aria-label="Document missing"
        className="inline-flex h-5 w-5 items-center justify-center text-[#F59E0B]"
      >
        <CircleAlert className="h-4 w-4" />
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span
        role="img"
        aria-label="Document rejected"
        className="inline-flex h-5 w-5 items-center justify-center text-[#F04438]"
      >
        <XCircle className="h-4 w-4" />
      </span>
    );
  }

  if (status === "accepted") {
    return (
      <span
        role="img"
        aria-label="Document accepted"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E] text-white"
      >
        <Check className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="Document pending review"
      className="inline-flex h-5 w-5 items-center justify-center text-[#22C55E]"
    >
      <CheckCircle2 className="h-4 w-4" />
    </span>
  );
}

function KycDocumentCard({
  document,
  onView,
  compact = false,
}: {
  document: ContractorKycDocumentRecord;
  onView: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3 rounded-[12px] border border-[#EAECF0] bg-white",
        compact ? "px-3 py-3" : "px-4 py-4",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F7ED] text-[#16A34A]">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#101828]">
            {document.fileName}
          </p>
          <p className="mt-1 text-xs text-[#98A2B3]">
            {document.fileSizeLabel} · {document.uploadedAtLabel}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onView}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white text-[#071B58] transition hover:bg-[#F8FAFC]"
        aria-label={`View ${document.fileName}`}
      >
        <Eye className="h-4 w-4" />
      </button>
    </div>
  );
}

function UploadButton({
  ariaLabel,
  disabled = false,
  onChange,
}: {
  ariaLabel: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="inline-flex flex-col items-start gap-2">
      {/* TODO: REMOVE THIS BUTTON BEFORE PRODUCTION - Testing-only upload functionality for KYC workflow validation. In production, administrators should have read-only access to view KYC documents submitted by users from the mobile app/web application and only be able to approve or reject those submissions, never upload documents on behalf of users. */}
      <label
        className={[
          "inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877]",
          disabled ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        <Upload className="h-4 w-4" />
        Upload
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          aria-label={ariaLabel}
          className="sr-only"
          disabled={disabled}
          onChange={onChange}
        />
      </label>
      <p className="text-xs italic text-[#C2410C]">
        (For testing purposes only)
      </p>
    </div>
  );
}

function PendingActions({
  onAccept,
  onReject,
}: {
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={onAccept}
        className="inline-flex items-center justify-center rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877]"
      >
        Accept
      </button>
      <button
        type="button"
        onClick={onReject}
        className="inline-flex items-center justify-center rounded-[10px] border border-[#F04438] bg-white px-4 py-3 text-sm font-semibold text-[#F04438] transition hover:bg-[#FEF3F2]"
      >
        Reject
      </button>
    </div>
  );
}

function AcceptedBadge({
  reviewedBy,
  reviewedAt,
}: {
  reviewedBy: string;
  reviewedAt: string;
}) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-semibold text-[#15803D]">
      Accepted · {reviewedBy} · {reviewedAt}
    </span>
  );
}

function RejectedBadge({ reviewedAt }: { reviewedAt: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#FEF3F2] px-3 py-1 text-xs font-semibold text-[#B42318]">
      Rejected · {reviewedAt}
    </span>
  );
}

function EmptyDocumentState({
  title,
  onUpload,
}: {
  title: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border border-dashed border-[#D0D5DD] bg-[#FCFCFD] px-4 py-5 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF7ED] text-[#F59E0B]">
              <CircleAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#101828]">{title}</p>
              <p className="mt-1 text-sm text-[#667085]">
                No document uploaded yet. Upload a PDF, JPG, or PNG file up to 5
                MB.
              </p>
            </div>
          </div>
          <UploadButton ariaLabel={`Upload ${title}`} onChange={onUpload} />
        </div>
      </div>
      <div className="rounded-[16px] border border-[#EAECF0] bg-white px-4 py-5 sm:px-5">
        <p className="text-sm font-medium text-[#98A2B3]">Document</p>
        <p className="mt-2 text-sm font-medium text-[#D0D5DD]">
          No available document yet!
        </p>
      </div>
    </div>
  );
}

function IdVerificationPanel({
  contractor,
  document,
  status,
  reason,
  reviewedAt,
  reviewedBy,
  onUpload,
  onView,
  onAccept,
  onReject,
  onReset,
}: {
  contractor: ContractorRecord;
  document: ContractorKycDocumentRecord | null;
  status: ContractorKycStatus | null;
  reason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onView: () => void;
  onAccept: () => void;
  onReject: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-[16px] border border-[#EAECF0] bg-white">
        <div className="grid gap-0 border-b border-[#EAECF0] md:grid-cols-2">
          <div className="px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
              Type
            </p>
            <p className="mt-2 text-sm font-semibold text-[#344054]">
              {document ? "National Identification" : "----"}
            </p>
          </div>
          <div className="border-t border-[#EAECF0] px-4 py-4 md:border-l md:border-t-0 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
              Company name
            </p>
            <p className="mt-2 text-sm font-semibold text-[#344054]">
              {document ? contractor.name : "----"}
            </p>
          </div>
        </div>
        <div className="px-4 py-5 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
            Document
          </p>
          <div className="mt-4">
            {!document ? (
              <EmptyDocumentState title="ID verification" onUpload={onUpload} />
            ) : (
              <div className="space-y-4">
                <KycDocumentCard document={document} onView={onView} />
                {status === "pending" ? (
                  <PendingActions onAccept={onAccept} onReject={onReject} />
                ) : null}
                {status === "accepted" && reviewedAt && reviewedBy ? (
                  <div className="space-y-3">
                    <AcceptedBadge
                      reviewedAt={reviewedAt}
                      reviewedBy={reviewedBy}
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <UploadButton
                        ariaLabel="Upload ID verification"
                        disabled
                        onChange={onUpload}
                      />
                      <a
                        href={document.objectUrl}
                        download={document.fileName}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#071B58] underline-offset-4 hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        Download document
                      </a>
                    </div>
                  </div>
                ) : null}
                {status === "rejected" ? (
                  <div className="space-y-3">
                    <RejectedBadge reviewedAt={reviewedAt ?? "Just now"} />
                    <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF3F2] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#B42318]">
                        Rejection reason
                      </p>
                      <p className="mt-2 text-sm text-[#912018]">{reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onReset}
                      className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
                    >
                      Re-upload
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function PoliceVerificationPanel({
  document,
  status,
  reason,
  reviewedAt,
  reviewedBy,
  onUpload,
  onView,
  onAccept,
  onReject,
  onReset,
}: {
  document: ContractorKycDocumentRecord | null;
  status: ContractorKycStatus | null;
  reason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onView: () => void;
  onAccept: () => void;
  onReject: () => void;
  onReset: () => void;
}) {
  return (
    <section className="space-y-4 rounded-[16px] border border-[#EAECF0] bg-white px-4 py-5 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#344054]">
            Police check document
          </p>
          <p className="mt-1 text-sm text-[#98A2B3]">
            Upload the latest police background check for review.
          </p>
        </div>
        {!document ? (
          <UploadButton
            ariaLabel="Upload Police check document"
            onChange={onUpload}
          />
        ) : null}
      </div>

      {!document ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[16px] border border-dashed border-[#D0D5DD] bg-[#FCFCFD] px-4 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF7ED] text-[#F59E0B]">
            <CircleAlert className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-[#344054]">
            No police check document uploaded
          </p>
          <p className="mt-2 max-w-[420px] text-sm text-[#667085]">
            Choose a supported file format and keep the upload under 5 MB.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-[#EAECF0] bg-[#FCFCFD] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex h-[110px] w-full items-center justify-center rounded-[14px] border border-dashed border-[#D0D5DD] bg-white lg:w-[180px]">
                <FileText
                  className="h-8 w-8 text-[#071B58]"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-4">
                <KycDocumentCard document={document} onView={onView} />
                {status === "pending" ? (
                  <PendingActions onAccept={onAccept} onReject={onReject} />
                ) : null}
                {status === "accepted" && reviewedAt && reviewedBy ? (
                  <div className="space-y-3">
                    <AcceptedBadge
                      reviewedAt={reviewedAt}
                      reviewedBy={reviewedBy}
                    />
                    <a
                      href={document.objectUrl}
                      download={document.fileName}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#071B58] underline-offset-4 hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      Download document
                    </a>
                  </div>
                ) : null}
                {status === "rejected" ? (
                  <div className="space-y-3">
                    <RejectedBadge reviewedAt={reviewedAt ?? "Just now"} />
                    <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF3F2] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#B42318]">
                        Rejection reason
                      </p>
                      <p className="mt-2 text-sm text-[#912018]">{reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onReset}
                      className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
                    >
                      Re-upload
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ServiceProviderPanel({
  document,
  status,
  reason,
  reviewedAt,
  reviewedBy,
  onUpload,
  onView,
  onAccept,
  onReject,
  onReset,
}: {
  document: ContractorKycDocumentRecord | null;
  status: ContractorKycStatus | null;
  reason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onView: () => void;
  onAccept: () => void;
  onReject: () => void;
  onReset: () => void;
}) {
  if (!document) {
    return (
      <section className="space-y-4 rounded-[16px] border border-[#EAECF0] bg-white px-4 py-5 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#344054]">
              Service provider licence
            </p>
            <p className="mt-1 text-sm text-[#98A2B3]">
              Upload the contractor’s licence or certification document.
            </p>
          </div>
          <UploadButton
            ariaLabel="Upload Service provider licence"
            onChange={onUpload}
          />
        </div>
        <div className="rounded-[16px] border border-dashed border-[#D0D5DD] bg-[#FCFCFD] px-4 py-6">
          <p className="text-sm text-[#667085]">
            No service provider licence has been uploaded yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="service-provider"
      className="rounded-[16px] border border-[#EAECF0] bg-white"
    >
      <AccordionItem value="service-provider" className="border-b-0">
        <AccordionTrigger className="px-4 py-4 text-left text-sm font-semibold text-[#344054] hover:no-underline sm:px-5">
          <div>
            <p>Service provider licence</p>
            <p className="mt-1 text-sm font-normal text-[#98A2B3]">
              Expand to review uploaded licence details.
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-5 sm:px-5">
          <div className="space-y-4">
            <KycDocumentCard document={document} onView={onView} compact />
            {status === "pending" ? (
              <PendingActions onAccept={onAccept} onReject={onReject} />
            ) : null}
            {status === "accepted" && reviewedAt && reviewedBy ? (
              <div className="space-y-3">
                <AcceptedBadge
                  reviewedAt={reviewedAt}
                  reviewedBy={reviewedBy}
                />
                <a
                  href={document.objectUrl}
                  download={document.fileName}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#071B58] underline-offset-4 hover:underline"
                >
                  <Download className="h-4 w-4" />
                  Download document
                </a>
              </div>
            ) : null}
            {status === "rejected" ? (
              <div className="space-y-3">
                <RejectedBadge reviewedAt={reviewedAt ?? "Just now"} />
                <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF3F2] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#B42318]">
                    Rejection reason
                  </p>
                  <p className="mt-2 text-sm text-[#912018]">{reason}</p>
                </div>
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
                >
                  Re-upload
                </button>
              </div>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function ContractorKycTab({
  contractor,
}: {
  contractor: ContractorRecord;
}) {
  const {
    state,
    setActiveCategory,
    uploadDocument,
    acceptDocument,
    rejectDocument,
    resetDocument,
    openDocument,
  } = useContractorKyc();
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const selectedCategory = state.activeCategory;
  const selectedSnapshot = useMemo(
    () => getCategorySnapshot(state, selectedCategory),
    [selectedCategory, state],
  );
  const selectedConfig = categoryDetails[selectedCategory];

  const handleUpload =
    (category: ContractorKycCategory) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const result = uploadDocument(category, file);
      if (result.ok === false) {
        toast.error("Unable to upload document", {
          description: result.error,
        });
      }

      event.target.value = "";
    };

  const handleAcceptConfirm = () => {
    acceptDocument(selectedCategory);
    setIsAcceptOpen(false);
  };

  const handleRejectConfirm = () => {
    const result = rejectDocument(selectedCategory, rejectReason);
    if (result.ok === false) {
      return;
    }

    setIsRejectOpen(false);
    setRejectReason("");
  };

  const renderPanel = () => {
    if (selectedCategory === "id") {
      return (
        <IdVerificationPanel
          contractor={contractor}
          document={selectedSnapshot.doc}
          status={selectedSnapshot.status}
          reason={selectedSnapshot.reason}
          reviewedAt={selectedSnapshot.reviewedAt}
          reviewedBy={selectedSnapshot.reviewedBy}
          onUpload={handleUpload("id")}
          onView={() => openDocument("id")}
          onAccept={() => setIsAcceptOpen(true)}
          onReject={() => setIsRejectOpen(true)}
          onReset={() => resetDocument("id")}
        />
      );
    }

    if (selectedCategory === "police") {
      return (
        <PoliceVerificationPanel
          document={selectedSnapshot.doc}
          status={selectedSnapshot.status}
          reason={selectedSnapshot.reason}
          reviewedAt={selectedSnapshot.reviewedAt}
          reviewedBy={selectedSnapshot.reviewedBy}
          onUpload={handleUpload("police")}
          onView={() => openDocument("police")}
          onAccept={() => setIsAcceptOpen(true)}
          onReject={() => setIsRejectOpen(true)}
          onReset={() => resetDocument("police")}
        />
      );
    }

    return (
      <ServiceProviderPanel
        document={selectedSnapshot.doc}
        status={selectedSnapshot.status}
        reason={selectedSnapshot.reason}
        reviewedAt={selectedSnapshot.reviewedAt}
        reviewedBy={selectedSnapshot.reviewedBy}
        onUpload={handleUpload("serviceProvider")}
        onView={() => openDocument("serviceProvider")}
        onAccept={() => setIsAcceptOpen(true)}
        onReject={() => setIsRejectOpen(true)}
        onReset={() => resetDocument("serviceProvider")}
      />
    );
  };

  return (
    <>
      <section className="rounded-[18px] border border-[#EAECF0] bg-white p-3 shadow-sm sm:p-4">
        <div className="grid gap-4 lg:grid-cols-[236px_minmax(0,1fr)]">
          <div className="space-y-3">
            {(["id", "police", "serviceProvider"] as const).map((category) => {
              const snapshot = getCategorySnapshot(state, category);
              const isSelected = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={[
                    "w-full rounded-[12px] border bg-[#FCFCFD] px-4 py-3 text-left transition",
                    isSelected
                      ? "border-[#101828] shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                      : "border-[#EAECF0] hover:border-[#D0D5DD]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#EAECF0] bg-white text-[#071B58]">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <KycStatusIcon
                      status={snapshot.status}
                      hasDocument={Boolean(snapshot.doc)}
                    />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#101828]">
                    {categoryDetails[category].title}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="min-w-0">
            <div className="mb-3">
              <p className="text-sm font-semibold text-[#98A2B3]">
                {selectedConfig.panelTitle}
              </p>
            </div>
            {renderPanel()}
          </div>
        </div>
      </section>

      <Dialog open={isAcceptOpen} onOpenChange={setIsAcceptOpen}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-[420px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
          <div className="px-6 py-6">
            <DialogTitle className="text-xl font-bold text-[#101828]">
              Accept Document
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-[#667085]">
              Confirm that {selectedConfig.title.toLowerCase()} has been
              reviewed and approved.
            </DialogDescription>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsAcceptOpen(false)}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptConfirm}
                className="inline-flex items-center justify-center rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877]"
              >
                Confirm
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRejectOpen}
        onOpenChange={(open) => {
          setIsRejectOpen(open);
          if (!open) {
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-32px)] max-w-[520px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
          <div className="px-6 py-6">
            <DialogTitle className="text-xl font-bold text-[#101828]">
              Reject Document
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-[#667085]">
              Provide a reason before rejecting this document.
            </DialogDescription>
            <div className="mt-5">
              <label className="block text-sm font-semibold text-[#344054]">
                Rejection reason
              </label>
              <Textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                aria-label="Rejection reason"
                className="mt-2 min-h-[132px]"
                placeholder="Enter the reason for rejection"
              />
              {!rejectReason.trim() ? (
                <p className="mt-2 text-xs font-medium text-[#B42318]">
                  A rejection reason is required.
                </p>
              ) : null}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsRejectOpen(false);
                  setRejectReason("");
                }}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                className="inline-flex items-center justify-center rounded-[10px] bg-[#F04438] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#D92D20] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirm rejection
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
