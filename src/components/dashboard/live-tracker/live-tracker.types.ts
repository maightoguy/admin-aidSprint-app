import type { UserRequestHistoryItem } from "../user-details/user-details.types";

export type LiveTrackerPoint = {
  x: number;
  y: number;
};

export type LiveTrackerRoadLabel = {
  id: string;
  label: string;
  x: number;
  y: number;
  rotation: number;
};

export type LiveTrackerRoadSegment = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type LiveTrackerJobState =
  | "Incoming"
  | "Assigned"
  | "En route"
  | "Current"
  | "Completed";

export type LiveTrackerJob = {
  id: string;
  requestId: UserRequestHistoryItem["id"];
  userId: string;
  customerName: string;
  request: UserRequestHistoryItem;
  serviceLabel: string;
  route: LiveTrackerPoint[];
  pin: LiveTrackerPoint;
  userPin: LiveTrackerPoint;
  contractorPin: LiveTrackerPoint;
  progress: number;
  etaMinutes: number;
  state: LiveTrackerJobState;
  isEmergency: boolean;
};

export type LiveTrackerSimulationResult = {
  jobs: LiveTrackerJob[];
  newlyAddedJob: LiveTrackerJob | null;
};
