import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuthStore } from "@/auth/auth.store";
import { createLogger } from "@/lib/logger";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { supabaseContractorDocuments } from "@/lib/supabase/data";
import { emitEvent, BusinessEventType } from "@/lib/events";
import type {
  ContractorKycCategory,
  ContractorKycDocumentRecord,
  ContractorKycState,
  ContractorKycStatus,
} from "./contractors.types";

type UploadResult = { ok: true } | { ok: false; error: string };

type ContractorKycContextValue = {
  state: ContractorKycState;
  completedCount: number;
  isReviewSaving: boolean;
  reviewError: string | null;
  clearReviewError: () => void;
  setActiveCategory: (category: ContractorKycCategory) => void;
  uploadDocument: (category: ContractorKycCategory, file: File) => UploadResult;
  acceptDocument: (category: ContractorKycCategory) => Promise<UploadResult>;
  rejectDocument: (
    category: ContractorKycCategory,
    reason: string,
  ) => Promise<UploadResult>;
  resetDocument: (category: ContractorKycCategory) => void;
  openDocument: (
    category: ContractorKycCategory,
    documentIndex?: number,
  ) => void;
};

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const MAX_SERVICE_PROVIDER_DOCUMENTS = 4;
const ACCEPTED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ACCEPTED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const logger = createLogger("ContractorKyc");

const defaultState: ContractorKycState = {
  activeCategory: "id",
  idDoc: null,
  idStatus: null,
  idReason: undefined,
  idReviewedAt: undefined,
  idReviewedBy: undefined,
  policeDoc: null,
  policeStatus: null,
  policeReason: undefined,
  policeReviewedAt: undefined,
  policeReviewedBy: undefined,
  serviceProviderDocs: [],
  serviceProviderStatus: null,
  serviceProviderReason: undefined,
  serviceProviderReviewedAt: undefined,
  serviceProviderReviewedBy: undefined,
};

const ContractorKycContext = createContext<ContractorKycContextValue | null>(
  null,
);

function formatTimestamp(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function isAcceptedFileType(file: File) {
  const normalizedName = file.name.toLowerCase();

  return (
    ACCEPTED_MIME_TYPES.includes(file.type) ||
    ACCEPTED_FILE_EXTENSIONS.some((extension) =>
      normalizedName.endsWith(extension),
    )
  );
}

function buildDocumentRecord(file: File): ContractorKycDocumentRecord {
  const now = new Date();

  return {
    file,
    fileName: file.name,
    fileSize: file.size,
    fileSizeLabel: formatFileSize(file.size),
    mimeType: file.type,
    uploadedAtIso: now.toISOString(),
    uploadedAtLabel: formatTimestamp(now),
    objectUrl: URL.createObjectURL(file),
  };
}

function getDocumentsForCategory(
  state: ContractorKycState,
  category: ContractorKycCategory,
) {
  if (category === "id") {
    return state.idDoc ? [state.idDoc] : [];
  }

  if (category === "police") {
    return state.policeDoc ? [state.policeDoc] : [];
  }

  return state.serviceProviderDocs;
}

function getStatusKey(category: ContractorKycCategory) {
  if (category === "id") {
    return "idStatus";
  }

  if (category === "police") {
    return "policeStatus";
  }

  return "serviceProviderStatus";
}

function getDocKey(category: ContractorKycCategory) {
  if (category === "id") {
    return "idDoc";
  }

  if (category === "police") {
    return "policeDoc";
  }

  return null;
}

function getReasonKey(category: ContractorKycCategory) {
  if (category === "id") {
    return "idReason";
  }

  if (category === "police") {
    return "policeReason";
  }

  return "serviceProviderReason";
}

function getReviewedAtKey(category: ContractorKycCategory) {
  if (category === "id") {
    return "idReviewedAt";
  }

  if (category === "police") {
    return "policeReviewedAt";
  }

  return "serviceProviderReviewedAt";
}

function getReviewedByKey(category: ContractorKycCategory) {
  if (category === "id") {
    return "idReviewedBy";
  }

  if (category === "police") {
    return "policeReviewedBy";
  }

  return "serviceProviderReviewedBy";
}

export function ContractorKycProvider({
  children,
  initialState,
  contractorId,
}: {
  children: ReactNode;
  initialState?: Partial<ContractorKycState>;
  contractorId?: string;
}) {
  const session = useAuthStore((store) => store.session);
  const [state, setState] = useState<ContractorKycState>({
    ...defaultState,
    ...initialState,
  });
  const [isReviewSaving, setIsReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  const reviewerLabel = session?.userEmail?.trim() || "Admin reviewer";
  const shouldPersistReviews =
    Boolean(contractorId?.trim()) &&
    import.meta.env.MODE !== "test" &&
    !import.meta.env.VITEST &&
    isSupabaseConfigured();

  const trackObjectUrl = useCallback((objectUrl: string) => {
    objectUrlsRef.current.add(objectUrl);
  }, []);

  const revokeObjectUrl = useCallback((objectUrl: string | undefined) => {
    if (!objectUrl || !objectUrlsRef.current.has(objectUrl)) {
      return;
    }

    URL.revokeObjectURL(objectUrl);
    objectUrlsRef.current.delete(objectUrl);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      objectUrlsRef.current.forEach((objectUrl) => {
        URL.revokeObjectURL(objectUrl);
      });
      objectUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    [state.idDoc, state.policeDoc, ...state.serviceProviderDocs].forEach(
      (document) => {
        if (document?.objectUrl) {
          objectUrlsRef.current.add(document.objectUrl);
        }
      },
    );
  }, [state.idDoc, state.policeDoc, state.serviceProviderDocs]);

  const setActiveCategory = useCallback((category: ContractorKycCategory) => {
    setReviewError(null);
    setState((previous) => ({
      ...previous,
      activeCategory: category,
    }));
  }, []);

  const uploadDocument = useCallback(
    (category: ContractorKycCategory, file: File): UploadResult => {
      setReviewError(null);

      if (!isAcceptedFileType(file)) {
        return {
          ok: false,
          error: "Only PDF, JPG, and PNG files are allowed.",
        };
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        return {
          ok: false,
          error: "File size must be 5 MB or less.",
        };
      }

      const nextDocument = buildDocumentRecord(file);
      trackObjectUrl(nextDocument.objectUrl);

      setState((previous) => {
        const statusKey = getStatusKey(category);
        const reasonKey = getReasonKey(category);
        const reviewedAtKey = getReviewedAtKey(category);
        const reviewedByKey = getReviewedByKey(category);

        if (category === "serviceProvider") {
          if (
            previous.serviceProviderDocs.length >=
            MAX_SERVICE_PROVIDER_DOCUMENTS
          ) {
            revokeObjectUrl(nextDocument.objectUrl);
            return previous;
          }

          return {
            ...previous,
            serviceProviderDocs: [
              ...previous.serviceProviderDocs,
              nextDocument,
            ],
            [statusKey]: "pending" satisfies ContractorKycStatus,
            [reasonKey]: undefined,
            [reviewedAtKey]: undefined,
            [reviewedByKey]: undefined,
          };
        }

        const docKey = getDocKey(category);
        const previousDocument = docKey ? previous[docKey] : null;

        if (previousDocument) {
          revokeObjectUrl(previousDocument.objectUrl);
        }

        return {
          ...previous,
          ...(docKey ? { [docKey]: nextDocument } : {}),
          [statusKey]: "pending" satisfies ContractorKycStatus,
          [reasonKey]: undefined,
          [reviewedAtKey]: undefined,
          [reviewedByKey]: undefined,
        };
      });

      if (
        category === "serviceProvider" &&
        state.serviceProviderDocs.length >= MAX_SERVICE_PROVIDER_DOCUMENTS
      ) {
        return {
          ok: false,
          error: "You can upload up to 4 service provider licences.",
        };
      }

      return { ok: true };
    },
    [revokeObjectUrl, state.serviceProviderDocs.length, trackObjectUrl],
  );

  const applyReviewDecision = useCallback(
    (
      category: ContractorKycCategory,
      status: ContractorKycStatus,
      reason?: string,
    ) => {
      setState((previous) => {
        const statusKey = getStatusKey(category);
        const reviewedAtKey = getReviewedAtKey(category);
        const reviewedByKey = getReviewedByKey(category);
        const reasonKey = getReasonKey(category);

        return {
          ...previous,
          [statusKey]: status,
          [reasonKey]: reason?.trim() || undefined,
          [reviewedAtKey]: formatTimestamp(new Date()),
          [reviewedByKey]: reviewerLabel,
        };
      });
    },
    [reviewerLabel],
  );

  const acceptDocument = useCallback(
    async (category: ContractorKycCategory): Promise<UploadResult> => {
      setReviewError(null);

      const documents = getDocumentsForCategory(state, category);
      if (documents.length === 0) {
        return {
          ok: false,
          error: "No submitted document is available to approve.",
        };
      }

      if (!shouldPersistReviews) {
        applyReviewDecision(category, "accepted");
        return { ok: true as const };
      }

      const reviewerId = session?.userId?.trim() || "";
      if (!reviewerId) {
        const error = "Your admin session has expired. Please sign in again.";
        setReviewError(error);
        return { ok: false, error };
      }

      const documentIds = documents
        .map((document) => document.documentId?.trim() || "")
        .filter(Boolean);

      if (documentIds.length !== documents.length) {
        const error =
          "This document cannot be reviewed yet because its live record is missing.";
        setReviewError(error);
        return { ok: false, error };
      }

      setIsReviewSaving(true);

      const result = await supabaseContractorDocuments.reviewDocuments({
        contractorId: contractorId?.trim() || "",
        documentIds,
        status: "approved",
        reviewedBy: reviewerId,
      });

      if (isMountedRef.current) {
        setIsReviewSaving(false);
      }

      if (result.ok === false) {
        logger.error("Failed to approve contractor KYC document.", {
          contractorId,
          category,
          result,
        });
        if (isMountedRef.current) {
          setReviewError(result.message);
        }
        return { ok: false, error: result.message };
      }

      if (isMountedRef.current) {
        applyReviewDecision(category, "accepted");
      }

      // Emit event for notification + audit trail
      void emitEvent({
        type: BusinessEventType.KYC_APPROVED,
        actorId: reviewerId,
        subjectId: contractorId?.trim() || "",
        source: "admin-dashboard",
        priority: "high",
        audit: true,
        realtime: true,
        metadata: {
          documentCategory: category,
          documentIds,
          reviewerLabel,
        },
      });

      return { ok: true as const };
    },
    [
      applyReviewDecision,
      contractorId,
      session?.userId,
      shouldPersistReviews,
      state,
    ],
  );

  const rejectDocument = useCallback(
    async (
      category: ContractorKycCategory,
      reason: string,
    ): Promise<UploadResult> => {
      setReviewError(null);

      if (!reason.trim()) {
        return {
          ok: false,
          error: "Rejection reason is required.",
        };
      }

      const documents = getDocumentsForCategory(state, category);
      if (documents.length === 0) {
        return {
          ok: false,
          error: "No submitted document is available to reject.",
        };
      }

      if (!shouldPersistReviews) {
        applyReviewDecision(category, "rejected", reason);
        return { ok: true as const };
      }

      const reviewerId = session?.userId?.trim() || "";
      if (!reviewerId) {
        const error = "Your admin session has expired. Please sign in again.";
        setReviewError(error);
        return { ok: false, error };
      }

      const documentIds = documents
        .map((document) => document.documentId?.trim() || "")
        .filter(Boolean);

      if (documentIds.length !== documents.length) {
        const error =
          "This document cannot be reviewed yet because its live record is missing.";
        setReviewError(error);
        return { ok: false, error };
      }

      setIsReviewSaving(true);

      const result = await supabaseContractorDocuments.reviewDocuments({
        contractorId: contractorId?.trim() || "",
        documentIds,
        status: "rejected",
        reviewedBy: reviewerId,
        rejectionReason: reason,
      });

      if (isMountedRef.current) {
        setIsReviewSaving(false);
      }

      if (result.ok === false) {
        logger.error("Failed to reject contractor KYC document.", {
          contractorId,
          category,
          result,
        });
        if (isMountedRef.current) {
          setReviewError(result.message);
        }
        return { ok: false, error: result.message };
      }

      if (isMountedRef.current) {
        applyReviewDecision(category, "rejected", reason);
      }

      // Emit event for notification + audit trail
      void emitEvent({
        type: BusinessEventType.KYC_REJECTED,
        actorId: reviewerId,
        subjectId: contractorId?.trim() || "",
        source: "admin-dashboard",
        priority: "high",
        audit: true,
        realtime: true,
        metadata: {
          documentCategory: category,
          documentIds,
          rejectionReason: reason,
          reviewerLabel,
        },
      });

      return { ok: true as const };
    },
    [
      applyReviewDecision,
      contractorId,
      session?.userId,
      shouldPersistReviews,
      state,
    ],
  );

  const resetDocument = useCallback(
    (category: ContractorKycCategory) => {
      setReviewError(null);
      setState((previous) => {
        const statusKey = getStatusKey(category);
        const reasonKey = getReasonKey(category);
        const reviewedAtKey = getReviewedAtKey(category);
        const reviewedByKey = getReviewedByKey(category);

        if (category === "serviceProvider") {
          previous.serviceProviderDocs.forEach((document) => {
            revokeObjectUrl(document.objectUrl);
          });

          return {
            ...previous,
            serviceProviderDocs: [],
            [statusKey]: null,
            [reasonKey]: undefined,
            [reviewedAtKey]: undefined,
            [reviewedByKey]: undefined,
          };
        }

        const docKey = getDocKey(category);
        const previousDocument = docKey ? previous[docKey] : null;

        if (previousDocument) {
          revokeObjectUrl(previousDocument.objectUrl);
        }

        return {
          ...previous,
          ...(docKey ? { [docKey]: null } : {}),
          [statusKey]: null,
          [reasonKey]: undefined,
          [reviewedAtKey]: undefined,
          [reviewedByKey]: undefined,
        };
      });
    },
    [revokeObjectUrl],
  );

  const clearReviewError = useCallback(() => {
    setReviewError(null);
  }, []);

  const openDocument = useCallback(
    (category: ContractorKycCategory, documentIndex = 0) => {
      const document =
        category === "serviceProvider"
          ? (state.serviceProviderDocs[documentIndex] ?? null)
          : (() => {
              const docKey = getDocKey(category);
              return docKey ? state[docKey] : null;
            })();

      if (!document) {
        return;
      }

      window.open(document.objectUrl, "_blank", "noopener,noreferrer");
    },
    [state],
  );

  const completedCount = useMemo(
    () =>
      [
        state.idDoc,
        state.policeDoc,
        state.serviceProviderDocs.length > 0 ? state.serviceProviderDocs : null,
      ].filter(Boolean).length,
    [state.idDoc, state.policeDoc, state.serviceProviderDocs],
  );

  const value = useMemo(
    () => ({
      state,
      completedCount,
      isReviewSaving,
      reviewError,
      clearReviewError,
      setActiveCategory,
      uploadDocument,
      acceptDocument,
      rejectDocument,
      resetDocument,
      openDocument,
    }),
    [
      state,
      completedCount,
      isReviewSaving,
      reviewError,
      clearReviewError,
      setActiveCategory,
      uploadDocument,
      acceptDocument,
      rejectDocument,
      resetDocument,
      openDocument,
    ],
  );

  return (
    <ContractorKycContext.Provider value={value}>
      {children}
    </ContractorKycContext.Provider>
  );
}

export function useContractorKyc() {
  const context = useContext(ContractorKycContext);

  if (!context) {
    throw new Error(
      "useContractorKyc must be used within ContractorKycProvider",
    );
  }

  return context;
}