import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UserRequestHistoryItem, UserRequestStatus } from "../user-details/user-details.types";

export type RequestStatusAction =
  | "Complete order"
  | "Pending order"
  | "Cancel order";

export type RequestPanelState =
  | "active"
  | "pending"
  | "completed"
  | "cancelled";

export type RequestMonitoringState = "live" | "paused" | "lostSignal";

type StoredRequestStatus = Pick<
  UserRequestHistoryItem,
  "status" | "lifecycleStatus" | "etaLabel"
>;

export type StoredRequestOps = {
  monitoringState?: RequestMonitoringState;
  delayedReason?: string | null;
  disputeReason?: string | null;
  supportEscalationReason?: string | null;
  cancellationReason?: string | null;
  updatedAtIso?: string;
};

type RequestsState = {
  selectedRequestId: string | null;
  isSidebarOpen: boolean;
  isMapOpen: boolean;
  requestStatusById: Record<string, StoredRequestStatus>;
  requestOpsById: Record<string, StoredRequestOps>;
  openRequest: (requestId: string) => void;
  closeSidebar: () => void;
  openMap: () => void;
  closeMap: () => void;
  closeAll: () => void;
  updateRequestStatus: (requestId: string, action: RequestStatusAction) => void;
  setRequestStatusOverride: (
    requestId: string,
    override: StoredRequestStatus | null,
  ) => void;
  setMonitoringState: (requestId: string, state: RequestMonitoringState) => void;
  flagDelayed: (requestId: string, reason: string) => void;
  clearDelayed: (requestId: string) => void;
  openDispute: (requestId: string, reason: string) => void;
  resolveDispute: (requestId: string) => void;
  escalateSupport: (requestId: string, reason: string) => void;
  setCancellationReason: (requestId: string, reason: string | null) => void;
};

const requestStatusActions: Record<RequestStatusAction, StoredRequestStatus> = {
  "Complete order": {
    status: "Completed",
    lifecycleStatus: "Completed",
    etaLabel: "Completed",
  },
  "Pending order": {
    status: "Pending",
    lifecycleStatus: "Assigned",
    etaLabel: "Awaiting dispatch",
  },
  "Cancel order": {
    status: "Cancelled",
    lifecycleStatus: "Cancelled",
    etaLabel: "Cancelled",
  },
};

export function applyRequestStatusOverride(
  request: UserRequestHistoryItem,
  override?: StoredRequestStatus,
): UserRequestHistoryItem {
  if (!override) {
    return request;
  }

  return {
    ...request,
    ...override,
  };
}

export function applyRequestOpsOverride(
  request: UserRequestHistoryItem,
  override?: StoredRequestOps,
): UserRequestHistoryItem {
  if (!override) {
    return request;
  }

  const next: UserRequestHistoryItem = {
    ...request,
  };

  if (override.delayedReason) {
    next.etaLabel = "Delayed";
  }

  if (override.disputeReason) {
    next.status = "Pending";
  }

  if (override.monitoringState === "paused") {
    next.lifecycleStatus = "Assigned";
  }

  return next;
}

export function getRequestPanelState(request: UserRequestHistoryItem): RequestPanelState {
  if (request.status === "Cancelled" || request.lifecycleStatus === "Cancelled") {
    return "cancelled";
  }

  if (request.status === "Completed" || request.lifecycleStatus === "Completed") {
    return "completed";
  }

  if (request.status === "Pending" || request.lifecycleStatus === "Assigned") {
    return "pending";
  }

  return "active";
}

export function getRequestHistoryStatus(request: UserRequestHistoryItem): UserRequestStatus {
  if (request.status === "Past") {
    return "Completed";
  }

  return request.status;
}

export const useRequestsStore = create<RequestsState>()(
  persist(
    (set) => ({
      selectedRequestId: null,
      isSidebarOpen: false,
      isMapOpen: false,
      requestStatusById: {},
      requestOpsById: {},
      openRequest: (requestId) =>
        set({
          selectedRequestId: requestId,
          isSidebarOpen: true,
        }),
      closeSidebar: () =>
        set({
          isSidebarOpen: false,
        }),
      openMap: () =>
        set({
          isMapOpen: true,
        }),
      closeMap: () =>
        set({
          isMapOpen: false,
        }),
      closeAll: () =>
        set({
          isSidebarOpen: false,
          isMapOpen: false,
        }),
      updateRequestStatus: (requestId, action) =>
        set((state) => ({
          requestStatusById: {
            ...state.requestStatusById,
            [requestId]: requestStatusActions[action],
          },
        })),
      setRequestStatusOverride: (requestId, override) =>
        set((state) => {
          const nextStatusById = {
            ...state.requestStatusById,
          };

          if (override) {
            nextStatusById[requestId] = override;
          } else {
            delete nextStatusById[requestId];
          }

          return {
            requestStatusById: nextStatusById,
          };
        }),
      setMonitoringState: (requestId, monitoringState) =>
        set((state) => ({
          requestOpsById: {
            ...state.requestOpsById,
            [requestId]: {
              ...state.requestOpsById[requestId],
              monitoringState,
              updatedAtIso: new Date().toISOString(),
            },
          },
        })),
      flagDelayed: (requestId, delayedReason) =>
        set((state) => ({
          requestOpsById: {
            ...state.requestOpsById,
            [requestId]: {
              ...state.requestOpsById[requestId],
              delayedReason,
              updatedAtIso: new Date().toISOString(),
            },
          },
        })),
      clearDelayed: (requestId) =>
        set((state) => ({
          requestOpsById: {
            ...state.requestOpsById,
            [requestId]: {
              ...state.requestOpsById[requestId],
              delayedReason: null,
              updatedAtIso: new Date().toISOString(),
            },
          },
        })),
      openDispute: (requestId, disputeReason) =>
        set((state) => ({
          requestOpsById: {
            ...state.requestOpsById,
            [requestId]: {
              ...state.requestOpsById[requestId],
              disputeReason,
              updatedAtIso: new Date().toISOString(),
            },
          },
        })),
      resolveDispute: (requestId) =>
        set((state) => ({
          requestOpsById: {
            ...state.requestOpsById,
            [requestId]: {
              ...state.requestOpsById[requestId],
              disputeReason: null,
              updatedAtIso: new Date().toISOString(),
            },
          },
        })),
      escalateSupport: (requestId, supportEscalationReason) =>
        set((state) => ({
          requestOpsById: {
            ...state.requestOpsById,
            [requestId]: {
              ...state.requestOpsById[requestId],
              supportEscalationReason,
              updatedAtIso: new Date().toISOString(),
            },
          },
        })),
      setCancellationReason: (requestId, cancellationReason) =>
        set((state) => ({
          requestOpsById: {
            ...state.requestOpsById,
            [requestId]: {
              ...state.requestOpsById[requestId],
              cancellationReason,
              updatedAtIso: new Date().toISOString(),
            },
          },
        })),
    }),
    {
      name: "requests-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        selectedRequestId: state.selectedRequestId,
        requestStatusById: state.requestStatusById,
        requestOpsById: state.requestOpsById,
      }),
    },
  ),
);
