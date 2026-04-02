import { userDetailsRecords } from "../user-details/user-details.data";
import type {
  LiveTrackerJob,
  LiveTrackerPoint,
  LiveTrackerRoadLabel,
  LiveTrackerRoadSegment,
} from "./live-tracker.types";

const routeCoordinates: Record<
  string,
  {
    route: LiveTrackerPoint[];
    pin: LiveTrackerPoint;
    userPin: LiveTrackerPoint;
    contractorPin: LiveTrackerPoint;
    progress: number;
    etaMinutes: number;
  }
> = {
  "emery-request-1": {
    route: [
      { x: 14, y: 28 },
      { x: 21, y: 48 },
      { x: 48, y: 48 },
      { x: 60, y: 66 },
    ],
    pin: { x: 14, y: 28 },
    userPin: { x: 14, y: 28 },
    contractorPin: { x: 60, y: 66 },
    progress: 0.72,
    etaMinutes: 5,
  },
  "emery-request-2": {
    route: [
      { x: 75, y: 19 },
      { x: 70, y: 32 },
      { x: 60, y: 39 },
      { x: 56, y: 52 },
    ],
    pin: { x: 75, y: 19 },
    userPin: { x: 75, y: 19 },
    contractorPin: { x: 56, y: 52 },
    progress: 0.34,
    etaMinutes: 7,
  },
  "emery-request-3": {
    route: [
      { x: 31, y: 18 },
      { x: 33, y: 34 },
      { x: 43, y: 45 },
      { x: 48, y: 60 },
    ],
    pin: { x: 31, y: 18 },
    userPin: { x: 31, y: 18 },
    contractorPin: { x: 48, y: 60 },
    progress: 0.58,
    etaMinutes: 4,
  },
  "emery-request-4": {
    route: [
      { x: 68, y: 67 },
      { x: 60, y: 56 },
      { x: 55, y: 42 },
      { x: 49, y: 28 },
    ],
    pin: { x: 68, y: 67 },
    userPin: { x: 68, y: 67 },
    contractorPin: { x: 49, y: 28 },
    progress: 1,
    etaMinutes: 0,
  },
  "emery-request-5": {
    route: [
      { x: 19, y: 72 },
      { x: 31, y: 58 },
      { x: 46, y: 58 },
      { x: 58, y: 44 },
    ],
    pin: { x: 19, y: 72 },
    userPin: { x: 19, y: 72 },
    contractorPin: { x: 58, y: 44 },
    progress: 0.62,
    etaMinutes: 6,
  },
  "maren-request-2": {
    route: [
      { x: 84, y: 55 },
      { x: 71, y: 54 },
      { x: 62, y: 48 },
      { x: 51, y: 41 },
    ],
    pin: { x: 84, y: 55 },
    userPin: { x: 84, y: 55 },
    contractorPin: { x: 51, y: 41 },
    progress: 0.42,
    etaMinutes: 9,
  },
  "cooper-request-1": {
    route: [
      { x: 40, y: 84 },
      { x: 50, y: 70 },
      { x: 58, y: 58 },
      { x: 70, y: 45 },
    ],
    pin: { x: 40, y: 84 },
    userPin: { x: 40, y: 84 },
    contractorPin: { x: 70, y: 45 },
    progress: 0.48,
    etaMinutes: 4,
  },
};

export const liveTrackerRoadSegments: LiveTrackerRoadSegment[] = [
  { id: "airport-rd", x1: 6, y1: 6, x2: 20, y2: 28 },
  { id: "kalejaiye-west", x1: 4, y1: 26, x2: 4, y2: 92 },
  { id: "akani-main", x1: 11, y1: 43, x2: 48, y2: 43 },
  { id: "aremu-main", x1: 10, y1: 52, x2: 54, y2: 52 },
  { id: "olufuyi-main", x1: 14, y1: 61, x2: 53, y2: 61 },
  { id: "adeoson-cl", x1: 28, y1: 24, x2: 36, y2: 40 },
  { id: "osemenne-st", x1: 36, y1: 7, x2: 38, y2: 52 },
  { id: "assoland-st", x1: 44, y1: 6, x2: 46, y2: 47 },
  { id: "ogundele-st", x1: 58, y1: 8, x2: 74, y2: 20 },
  { id: "sadiku-st", x1: 66, y1: 24, x2: 84, y2: 21 },
  { id: "akinsofi-st", x1: 75, y1: 24, x2: 80, y2: 45 },
  { id: "atanad-st", x1: 74, y1: 48, x2: 89, y2: 51 },
  { id: "ilesshomi-st", x1: 78, y1: 56, x2: 92, y2: 60 },
  { id: "club-rd", x1: 70, y1: 58, x2: 66, y2: 82 },
  { id: "deji-adeoye", x1: 52, y1: 80, x2: 84, y2: 80 },
  { id: "alh-shokoya", x1: 58, y1: 89, x2: 86, y2: 89 },
  { id: "babayanju-st", x1: 64, y1: 18, x2: 64, y2: 47 },
  { id: "ariyibi-cl", x1: 56, y1: 37, x2: 56, y2: 55 },
  { id: "ayoola-awe-st", x1: 45, y1: 51, x2: 45, y2: 88 },
];

export const liveTrackerRoadLabels: LiveTrackerRoadLabel[] = [
  { id: "airport-rd", label: "Airport Rd", x: 12, y: 10, rotation: -58 },
  { id: "kalejaiye-st", label: "Kalejaiye St", x: 4, y: 46, rotation: 90 },
  { id: "akani-sowunmi", label: "Akani Sowunmi St", x: 23, y: 43, rotation: 0 },
  { id: "aremu", label: "Aremu Olatunbosun St", x: 29, y: 52, rotation: 0 },
  { id: "olufuyi", label: "Olufuyi Popoola St", x: 31, y: 61, rotation: 0 },
  { id: "adeoson", label: "Adeoson Cl", x: 33, y: 27, rotation: 63 },
  { id: "osemenne", label: "Osenmen st", x: 38, y: 28, rotation: 90 },
  { id: "assoland", label: "Assoland St", x: 46, y: 23, rotation: 82 },
  { id: "dele-araoye", label: "Dele Araoye St", x: 47, y: 43, rotation: 0 },
  { id: "ariyibi", label: "Ariyibi Cl", x: 57, y: 42, rotation: 90 },
  { id: "ogundele", label: "Ogundele St", x: 71, y: 16, rotation: 0 },
  { id: "sadiku", label: "Sadiku St", x: 76, y: 25, rotation: -8 },
  { id: "akinsofi", label: "Akinsoji St", x: 78, y: 37, rotation: 83 },
  { id: "atanad", label: "Atanda St", x: 78, y: 50, rotation: 9 },
  { id: "ilesshomi", label: "Ilesshomi St", x: 82, y: 60, rotation: 24 },
  { id: "club", label: "Club Rd", x: 71, y: 69, rotation: 84 },
  { id: "deji", label: "Deji Adeoye St", x: 70, y: 81, rotation: 0 },
  { id: "alh", label: "Alh Shokoya St", x: 72, y: 90, rotation: 0 },
  { id: "babayanju", label: "Babayanju St", x: 64, y: 32, rotation: 90 },
  { id: "ayoola", label: "Ayoola Awe St", x: 45, y: 68, rotation: 88 },
];

export const liveTrackerJobs: LiveTrackerJob[] = userDetailsRecords
  .flatMap((user) =>
    user.requestHistory.map((request) => ({
      user,
      request,
      coordinates: routeCoordinates[request.id],
    })),
  )
  .filter(
    (
      job,
    ): job is {
      user: (typeof userDetailsRecords)[number];
      request: (typeof userDetailsRecords)[number]["requestHistory"][number];
      coordinates: NonNullable<(typeof routeCoordinates)[string]>;
    } => Boolean(job.coordinates),
  )
  .map(({ user, request, coordinates }) => ({
    id: `${request.id}-job`,
    requestId: request.id,
    userId: user.id,
    customerName: user.name,
    request,
    serviceLabel: `${request.service} Service`,
    route: coordinates.route,
    pin: coordinates.pin,
    userPin: coordinates.userPin,
    contractorPin: coordinates.contractorPin,
    progress: coordinates.progress,
    etaMinutes: coordinates.etaMinutes,
    state:
      request.lifecycleStatus === "Current"
        ? "Current"
        : request.lifecycleStatus === "Assigned"
          ? "Assigned"
          : "Completed",
    isEmergency: request.urgencyLabel === "Emergency",
  }));

export const incomingLiveTrackerJobs: LiveTrackerJob[] = [
  {
    id: "incoming-job-1",
    requestId: "incoming-emergency-1",
    userId: "emery-torff",
    customerName: "Emery Torff",
    request: {
      ...userDetailsRecords[0].requestHistory[0],
      id: "incoming-emergency-1",
      requestCode: "KJH 123490",
      service: "Plumbing",
      location: "Sadiku Street, Lagos",
      date: "Apr 12, 2023",
      status: "Pending",
      totalPayment: "$194.99",
      contractorLocation: "Dele Araoye Street, Lagos, Nigeria",
      userLocation: "Sadiku Street, Lagos, Nigeria",
      etaLabel: "8mins away",
      lifecycleStatus: "Assigned",
      uploadedImages: [
        { id: "incoming-1-image-1", label: "Valve", tone: "light" },
        { id: "incoming-1-image-2", label: "Leak", tone: "dark" },
      ],
    },
    serviceLabel: "Plumbing Service",
    route: [
      { x: 71, y: 20 },
      { x: 66, y: 29 },
      { x: 59, y: 38 },
      { x: 52, y: 50 },
    ],
    pin: { x: 71, y: 20 },
    userPin: { x: 71, y: 20 },
    contractorPin: { x: 52, y: 50 },
    progress: 0.2,
    etaMinutes: 8,
    state: "Incoming",
    isEmergency: true,
  },
  {
    id: "incoming-job-2",
    requestId: "incoming-emergency-2",
    userId: "cooper-siphron",
    customerName: "Cooper Siphron",
    request: {
      ...userDetailsRecords[2].requestHistory[0],
      id: "incoming-emergency-2",
      requestCode: "KJH 123491",
      service: "Electrician",
      location: "Deji Adeoye Street, Lagos",
      date: "Apr 12, 2023",
      status: "Pending",
      totalPayment: "$176.00",
      contractorLocation: "Akani Sowunmi Street, Lagos, Nigeria",
      userLocation: "Deji Adeoye Street, Lagos, Nigeria",
      etaLabel: "10mins away",
      lifecycleStatus: "Assigned",
      uploadedImages: [
        { id: "incoming-2-image-1", label: "Fuse", tone: "light" },
        { id: "incoming-2-image-2", label: "Panel", tone: "dark" },
      ],
    },
    serviceLabel: "Electrician Service",
    route: [
      { x: 63, y: 82 },
      { x: 59, y: 72 },
      { x: 54, y: 61 },
      { x: 48, y: 49 },
    ],
    pin: { x: 63, y: 82 },
    userPin: { x: 63, y: 82 },
    contractorPin: { x: 48, y: 49 },
    progress: 0.15,
    etaMinutes: 10,
    state: "Incoming",
    isEmergency: true,
  },
];
