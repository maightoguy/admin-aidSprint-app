import { useMemo, useState, type ChangeEvent } from "react";
import {
  Check,
  CheckCircle2,
  CircleAlert,
  Eye,
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
import { TotalRequestsIcon } from "@/ui/icons";

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
      docs: state.idDoc ? [state.idDoc] : [],
      status: state.idStatus,
      reason: state.idReason,
      reviewedAt: state.idReviewedAt,
      reviewedBy: state.idReviewedBy,
    };
  }

  if (category === "police") {
    return {
      doc: state.policeDoc,
      docs: state.policeDoc ? [state.policeDoc] : [],
      status: state.policeStatus,
      reason: state.policeReason,
      reviewedAt: state.policeReviewedAt,
      reviewedBy: state.policeReviewedBy,
    };
  }

  return {
    doc: state.serviceProviderDocs[0] ?? null,
    docs: state.serviceProviderDocs,
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
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M6.26713 2.00195C7.03713 0.66862 8.96246 0.66862 9.73179 2.00195L14.6351 10.5006C15.4045 11.834 14.4418 13.5006 12.9025 13.5006H3.09646C1.55713 13.5006 0.595127 11.834 1.36446 10.5006L6.26646 2.00195H6.26713ZM7.99979 5.49995C8.1324 5.49995 8.25958 5.55263 8.35335 5.6464C8.44711 5.74017 8.49979 5.86734 8.49979 5.99995V8.49995C8.49979 8.63256 8.44711 8.75974 8.35335 8.85351C8.25958 8.94727 8.1324 8.99995 7.99979 8.99995C7.86719 8.99995 7.74001 8.94727 7.64624 8.85351C7.55247 8.75974 7.49979 8.63256 7.49979 8.49995V5.99995C7.49979 5.86734 7.55247 5.74017 7.64624 5.6464C7.74001 5.55263 7.86719 5.49995 7.99979 5.49995ZM7.99979 11C8.1324 11 8.25958 10.9473 8.35335 10.8535C8.44711 10.7597 8.49979 10.6326 8.49979 10.5C8.49979 10.3673 8.44711 10.2402 8.35335 10.1464C8.25958 10.0526 8.1324 9.99995 7.99979 9.99995C7.86719 9.99995 7.74001 10.0526 7.64624 10.1464C7.55247 10.2402 7.49979 10.3673 7.49979 10.5C7.49979 10.6326 7.55247 10.7597 7.64624 10.8535C7.74001 10.9473 7.86719 11 7.99979 11Z"
            fill="#DD900D"
          />
        </svg>
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
  multiple = false,
  onChange,
}: {
  ariaLabel: string;
  disabled?: boolean;
  multiple?: boolean;
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
          multiple={multiple}
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
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10.0001 9.1665C10.2211 9.1665 10.4331 9.2543 10.5894 9.41058C10.7457 9.56686 10.8335 9.77882 10.8335 9.99984V15.4865L11.911 14.4098C12.0674 14.2536 12.2796 14.1659 12.5007 14.166C12.7219 14.1662 12.9339 14.2542 13.0901 14.4107C13.2464 14.5671 13.3341 14.7793 13.3339 15.0004C13.3338 15.2216 13.2458 15.4336 13.0893 15.5898L10.736 17.939C10.5251 18.149 10.3193 18.3332 10.0001 18.3332C9.72013 18.3332 9.52846 18.1923 9.34346 18.0165L6.91096 15.5898C6.75449 15.4336 6.66649 15.2216 6.66633 15.0004C6.66618 14.7793 6.75387 14.5671 6.91013 14.4107C7.06639 14.2542 7.2784 14.1662 7.49954 14.166C7.72068 14.1659 7.93282 14.2536 8.0893 14.4098L9.1668 15.4865V9.99984C9.1668 9.77882 9.25459 9.56686 9.41087 9.41058C9.56715 9.2543 9.77911 9.1665 10.0001 9.1665ZM9.58346 1.6665C11.9035 1.6665 13.8835 3.12484 14.6551 5.1765C15.6831 5.45915 16.5939 6.06283 17.2547 6.8995C17.9155 7.73617 18.2917 8.76207 18.3284 9.82758C18.3652 10.8931 18.0606 11.9425 17.459 12.8227C16.8574 13.7029 15.9904 14.3679 14.9843 14.7207C14.9212 14.1582 14.6691 13.6338 14.2693 13.2332C13.8429 12.8061 13.2763 12.5477 12.6743 12.5057L12.5001 12.4998V9.99984C12.5008 9.34908 12.2476 8.72373 11.7945 8.25666C11.3414 7.78958 10.724 7.5176 10.0735 7.4985C9.42302 7.47941 8.79073 7.7147 8.31099 8.15439C7.83124 8.59408 7.54185 9.2035 7.5043 9.85317L7.50013 9.99984V12.4998C7.17151 12.4998 6.84611 12.5645 6.54254 12.6904C6.23897 12.8162 5.96319 13.0007 5.73096 13.2332C5.28338 13.6816 5.02276 14.2833 5.0018 14.9165C4.13423 14.7392 3.34567 14.2903 2.7504 13.6347C2.15512 12.9792 1.78408 12.1511 1.69104 11.2705C1.59801 10.3899 1.78782 9.50259 2.23296 8.73712C2.67809 7.97165 3.35543 7.36783 4.1668 7.01317C4.18521 5.58875 4.76401 4.22891 5.77784 3.22818C6.79167 2.22745 8.15892 1.66638 9.58346 1.6665Z"
                            fill="#041133"
                          />
                        </svg>
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
                <TotalRequestsIcon />
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
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.0001 9.1665C10.2211 9.1665 10.4331 9.2543 10.5894 9.41058C10.7457 9.56686 10.8335 9.77882 10.8335 9.99984V15.4865L11.911 14.4098C12.0674 14.2536 12.2796 14.1659 12.5007 14.166C12.7219 14.1662 12.9339 14.2542 13.0901 14.4107C13.2464 14.5671 13.3341 14.7793 13.3339 15.0004C13.3338 15.2216 13.2458 15.4336 13.0893 15.5898L10.736 17.939C10.5251 18.149 10.3193 18.3332 10.0001 18.3332C9.72013 18.3332 9.52846 18.1923 9.34346 18.0165L6.91096 15.5898C6.75449 15.4336 6.66649 15.2216 6.66633 15.0004C6.66618 14.7793 6.75387 14.5671 6.91013 14.4107C7.06639 14.2542 7.2784 14.1662 7.49954 14.166C7.72068 14.1659 7.93282 14.2536 8.0893 14.4098L9.1668 15.4865V9.99984C9.1668 9.77882 9.25459 9.56686 9.41087 9.41058C9.56715 9.2543 9.77911 9.1665 10.0001 9.1665ZM9.58346 1.6665C11.9035 1.6665 13.8835 3.12484 14.6551 5.1765C15.6831 5.45915 16.5939 6.06283 17.2547 6.8995C17.9155 7.73617 18.2917 8.76207 18.3284 9.82758C18.3652 10.8931 18.0606 11.9425 17.459 12.8227C16.8574 13.7029 15.9904 14.3679 14.9843 14.7207C14.9212 14.1582 14.6691 13.6338 14.2693 13.2332C13.8429 12.8061 13.2763 12.5477 12.6743 12.5057L12.5001 12.4998V9.99984C12.5008 9.34908 12.2476 8.72373 11.7945 8.25666C11.3414 7.78958 10.724 7.5176 10.0735 7.4985C9.42302 7.47941 8.79073 7.7147 8.31099 8.15439C7.83124 8.59408 7.54185 9.2035 7.5043 9.85317L7.50013 9.99984V12.4998C7.17151 12.4998 6.84611 12.5645 6.54254 12.6904C6.23897 12.8162 5.96319 13.0007 5.73096 13.2332C5.28338 13.6816 5.02276 14.2833 5.0018 14.9165C4.13423 14.7392 3.34567 14.2903 2.7504 13.6347C2.15512 12.9792 1.78408 12.1511 1.69104 11.2705C1.59801 10.3899 1.78782 9.50259 2.23296 8.73712C2.67809 7.97165 3.35543 7.36783 4.1668 7.01317C4.18521 5.58875 4.76401 4.22891 5.77784 3.22818C6.79167 2.22745 8.15892 1.66638 9.58346 1.6665Z"
                          fill="#041133"
                        />
                      </svg>
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
  documents,
  status,
  reason,
  reviewedAt,
  reviewedBy,
  onUpload,
  onAccept,
  onReject,
  onReset,
}: {
  documents: ContractorKycDocumentRecord[];
  status: ContractorKycStatus | null;
  reason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onAccept: () => void;
  onReject: () => void;
  onReset: () => void;
}) {
  if (!documents.length) {
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
            multiple
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
              Review up to four uploaded service provider licences.
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-5 sm:px-5">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                Document
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {documents.map((document) => (
                  <a
                    key={document.objectUrl}
                    href={document.objectUrl}
                    download={document.fileName}
                    className="flex items-center justify-between gap-3 rounded-[12px] border border-[#EAECF0] bg-white px-4 py-4"
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
                          {document.fileSizeLabel}
                        </p>
                      </div>
                    </div>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.0001 9.1665C10.2211 9.1665 10.4331 9.2543 10.5894 9.41058C10.7457 9.56686 10.8335 9.77882 10.8335 9.99984V15.4865L11.911 14.4098C12.0674 14.2536 12.2796 14.1659 12.5007 14.166C12.7219 14.1662 12.9339 14.2542 13.0901 14.4107C13.2464 14.5671 13.3341 14.7793 13.3339 15.0004C13.3338 15.2216 13.2458 15.4336 13.0893 15.5898L10.736 17.939C10.5251 18.149 10.3193 18.3332 10.0001 18.3332C9.72013 18.3332 9.52846 18.1923 9.34346 18.0165L6.91096 15.5898C6.75449 15.4336 6.66649 15.2216 6.66633 15.0004C6.66618 14.7793 6.75387 14.5671 6.91013 14.4107C7.06639 14.2542 7.2784 14.1662 7.49954 14.166C7.72068 14.1659 7.93282 14.2536 8.0893 14.4098L9.1668 15.4865V9.99984C9.1668 9.77882 9.25459 9.56686 9.41087 9.41058C9.56715 9.2543 9.77911 9.1665 10.0001 9.1665ZM9.58346 1.6665C11.9035 1.6665 13.8835 3.12484 14.6551 5.1765C15.6831 5.45915 16.5939 6.06283 17.2547 6.8995C17.9155 7.73617 18.2917 8.76207 18.3284 9.82758C18.3652 10.8931 18.0606 11.9425 17.459 12.8227C16.8574 13.7029 15.9904 14.3679 14.9843 14.7207C14.9212 14.1582 14.6691 13.6338 14.2693 13.2332C13.8429 12.8061 13.2763 12.5477 12.6743 12.5057L12.5001 12.4998V9.99984C12.5008 9.34908 12.2476 8.72373 11.7945 8.25666C11.3414 7.78958 10.724 7.5176 10.0735 7.4985C9.42302 7.47941 8.79073 7.7147 8.31099 8.15439C7.83124 8.59408 7.54185 9.2035 7.5043 9.85317L7.50013 9.99984V12.4998C7.17151 12.4998 6.84611 12.5645 6.54254 12.6904C6.23897 12.8162 5.96319 13.0007 5.73096 13.2332C5.28338 13.6816 5.02276 14.2833 5.0018 14.9165C4.13423 14.7392 3.34567 14.2903 2.7504 13.6347C2.15512 12.9792 1.78408 12.1511 1.69104 11.2705C1.59801 10.3899 1.78782 9.50259 2.23296 8.73712C2.67809 7.97165 3.35543 7.36783 4.1668 7.01317C4.18521 5.58875 4.76401 4.22891 5.77784 3.22818C6.79167 2.22745 8.15892 1.66638 9.58346 1.6665Z"
                        fill="#041133"
                      />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            {documents.length < 4 && status !== "accepted" ? (
              <UploadButton
                ariaLabel="Upload Service provider licence"
                multiple
                onChange={onUpload}
              />
            ) : null}
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
                  href={documents[0]?.objectUrl}
                  download={documents[0]?.fileName}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#071B58] underline-offset-4 hover:underline"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.0001 9.1665C10.2211 9.1665 10.4331 9.2543 10.5894 9.41058C10.7457 9.56686 10.8335 9.77882 10.8335 9.99984V15.4865L11.911 14.4098C12.0674 14.2536 12.2796 14.1659 12.5007 14.166C12.7219 14.1662 12.9339 14.2542 13.0901 14.4107C13.2464 14.5671 13.3341 14.7793 13.3339 15.0004C13.3338 15.2216 13.2458 15.4336 13.0893 15.5898L10.736 17.939C10.5251 18.149 10.3193 18.3332 10.0001 18.3332C9.72013 18.3332 9.52846 18.1923 9.34346 18.0165L6.91096 15.5898C6.75449 15.4336 6.66649 15.2216 6.66633 15.0004C6.66618 14.7793 6.75387 14.5671 6.91013 14.4107C7.06639 14.2542 7.2784 14.1662 7.49954 14.166C7.72068 14.1659 7.93282 14.2536 8.0893 14.4098L9.1668 15.4865V9.99984C9.1668 9.77882 9.25459 9.56686 9.41087 9.41058C9.56715 9.2543 9.77911 9.1665 10.0001 9.1665ZM9.58346 1.6665C11.9035 1.6665 13.8835 3.12484 14.6551 5.1765C15.6831 5.45915 16.5939 6.06283 17.2547 6.8995C17.9155 7.73617 18.2917 8.76207 18.3284 9.82758C18.3652 10.8931 18.0606 11.9425 17.459 12.8227C16.8574 13.7029 15.9904 14.3679 14.9843 14.7207C14.9212 14.1582 14.6691 13.6338 14.2693 13.2332C13.8429 12.8061 13.2763 12.5477 12.6743 12.5057L12.5001 12.4998V9.99984C12.5008 9.34908 12.2476 8.72373 11.7945 8.25666C11.3414 7.78958 10.724 7.5176 10.0735 7.4985C9.42302 7.47941 8.79073 7.7147 8.31099 8.15439C7.83124 8.59408 7.54185 9.2035 7.5043 9.85317L7.50013 9.99984V12.4998C7.17151 12.4998 6.84611 12.5645 6.54254 12.6904C6.23897 12.8162 5.96319 13.0007 5.73096 13.2332C5.28338 13.6816 5.02276 14.2833 5.0018 14.9165C4.13423 14.7392 3.34567 14.2903 2.7504 13.6347C2.15512 12.9792 1.78408 12.1511 1.69104 11.2705C1.59801 10.3899 1.78782 9.50259 2.23296 8.73712C2.67809 7.97165 3.35543 7.36783 4.1668 7.01317C4.18521 5.58875 4.76401 4.22891 5.77784 3.22818C6.79167 2.22745 8.15892 1.66638 9.58346 1.6665Z"
                      fill="#041133"
                    />
                  </svg>
                  Download first document
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
      const files = Array.from(event.target.files ?? []);
      if (!files.length) {
        return;
      }

      for (const file of files) {
        const result = uploadDocument(category, file);
        if (result.ok === false) {
          toast.error("Unable to upload document", {
            description: result.error,
          });
          break;
        }
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
        documents={selectedSnapshot.docs}
        status={selectedSnapshot.status}
        reason={selectedSnapshot.reason}
        reviewedAt={selectedSnapshot.reviewedAt}
        reviewedBy={selectedSnapshot.reviewedBy}
        onUpload={handleUpload("serviceProvider")}
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
                      <TotalRequestsIcon />
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
