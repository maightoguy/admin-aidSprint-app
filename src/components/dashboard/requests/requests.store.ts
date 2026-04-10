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

type StoredRequestStatus = Pick<
  UserRequestHistoryItem,
  "status" | "lifecycleStatus" | "etaLabel"
>;

type RequestsState = {
  selectedRequestId: string | null;
  isSidebarOpen: boolean;
  isMapOpen: boolean;
  requestStatusById: Record<string, StoredRequestStatus>;
  openRequest: (requestId: string) => void;
  closeSidebar: () => void;
  openMap: () => void;
  closeMap: () => void;
  closeAll: () => void;
  updateRequestStatus: (requestId: string, action: RequestStatusAction) => void;
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
    }),
    {
      name: "requests-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        selectedRequestId: state.selectedRequestId,
        requestStatusById: state.requestStatusById,
      }),
    },
  ),
);
