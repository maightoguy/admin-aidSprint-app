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
  setActiveCategory: (category: ContractorKycCategory) => void;
  uploadDocument: (category: ContractorKycCategory, file: File) => UploadResult;
  acceptDocument: (category: ContractorKycCategory) => void;
  rejectDocument: (
    category: ContractorKycCategory,
    reason: string,
  ) => UploadResult;
  resetDocument: (category: ContractorKycCategory) => void;
  openDocument: (category: ContractorKycCategory) => void;
};

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ACCEPTED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const REVIEW_ADMIN_NAME = "Alison Eyo";

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
  serviceProviderDoc: null,
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

  return "serviceProviderDoc";
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
}: {
  children: ReactNode;
  initialState?: Partial<ContractorKycState>;
}) {
  const [state, setState] = useState<ContractorKycState>({
    ...defaultState,
    ...initialState,
  });
  const objectUrlsRef = useRef<Set<string>>(new Set());

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
    return () => {
      objectUrlsRef.current.forEach((objectUrl) => {
        URL.revokeObjectURL(objectUrl);
      });
      objectUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    [state.idDoc, state.policeDoc, state.serviceProviderDoc].forEach(
      (document) => {
        if (document?.objectUrl) {
          objectUrlsRef.current.add(document.objectUrl);
        }
      },
    );
  }, [state.idDoc, state.policeDoc, state.serviceProviderDoc]);

  const setActiveCategory = useCallback((category: ContractorKycCategory) => {
    setState((previous) => ({
      ...previous,
      activeCategory: category,
    }));
  }, []);

  const uploadDocument = useCallback(
    (category: ContractorKycCategory, file: File): UploadResult => {
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
        const docKey = getDocKey(category);
        const statusKey = getStatusKey(category);
        const reasonKey = getReasonKey(category);
        const reviewedAtKey = getReviewedAtKey(category);
        const reviewedByKey = getReviewedByKey(category);
        const previousDocument = previous[docKey];

        if (previousDocument) {
          revokeObjectUrl(previousDocument.objectUrl);
        }

        return {
          ...previous,
          [docKey]: nextDocument,
          [statusKey]: "pending" satisfies ContractorKycStatus,
          [reasonKey]: undefined,
          [reviewedAtKey]: undefined,
          [reviewedByKey]: undefined,
        };
      });

      return { ok: true };
    },
    [revokeObjectUrl, trackObjectUrl],
  );

  const acceptDocument = useCallback((category: ContractorKycCategory) => {
    setState((previous) => {
      const statusKey = getStatusKey(category);
      const reviewedAtKey = getReviewedAtKey(category);
      const reviewedByKey = getReviewedByKey(category);
      const reasonKey = getReasonKey(category);

      return {
        ...previous,
        [statusKey]: "accepted" satisfies ContractorKycStatus,
        [reasonKey]: undefined,
        [reviewedAtKey]: formatTimestamp(new Date()),
        [reviewedByKey]: REVIEW_ADMIN_NAME,
      };
    });
  }, []);

  const rejectDocument = useCallback(
    (category: ContractorKycCategory, reason: string): UploadResult => {
      if (!reason.trim()) {
        return {
          ok: false,
          error: "Rejection reason is required.",
        };
      }

      setState((previous) => {
        const statusKey = getStatusKey(category);
        const reasonKey = getReasonKey(category);
        const reviewedAtKey = getReviewedAtKey(category);
        const reviewedByKey = getReviewedByKey(category);

        return {
          ...previous,
          [statusKey]: "rejected" satisfies ContractorKycStatus,
          [reasonKey]: reason.trim(),
          [reviewedAtKey]: formatTimestamp(new Date()),
          [reviewedByKey]: REVIEW_ADMIN_NAME,
        };
      });

      return { ok: true };
    },
    [],
  );

  const resetDocument = useCallback(
    (category: ContractorKycCategory) => {
      setState((previous) => {
        const docKey = getDocKey(category);
        const statusKey = getStatusKey(category);
        const reasonKey = getReasonKey(category);
        const reviewedAtKey = getReviewedAtKey(category);
        const reviewedByKey = getReviewedByKey(category);
        const previousDocument = previous[docKey];

        if (previousDocument) {
          revokeObjectUrl(previousDocument.objectUrl);
        }

        return {
          ...previous,
          [docKey]: null,
          [statusKey]: null,
          [reasonKey]: undefined,
          [reviewedAtKey]: undefined,
          [reviewedByKey]: undefined,
        };
      });
    },
    [revokeObjectUrl],
  );

  const openDocument = useCallback(
    (category: ContractorKycCategory) => {
      const docKey = getDocKey(category);
      const document = state[docKey];

      if (!document) {
        return;
      }

      window.open(document.objectUrl, "_blank", "noopener,noreferrer");
    },
    [state],
  );

  const completedCount = useMemo(
    () =>
      [state.idDoc, state.policeDoc, state.serviceProviderDoc].filter(Boolean)
        .length,
    [state.idDoc, state.policeDoc, state.serviceProviderDoc],
  );

  const value = useMemo(
    () => ({
      state,
      completedCount,
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
