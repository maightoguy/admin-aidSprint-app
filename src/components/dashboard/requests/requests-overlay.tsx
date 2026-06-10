import { useEffect, useMemo } from "react";
import { AlertTriangle, PauseCircle, PlayCircle, Radio, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRequestsStore } from "./requests.store";
import { liveTrackerJobs } from "../live-tracker/live-tracker.data";
import {
  LiveTrackerMap,
  LiveTrackerSummaryCard,
} from "../live-tracker/live-tracker-shared";
import type { UserRequestHistoryItem } from "../user-details/user-details.types";
import type { LiveTrackerJob, LiveTrackerJobState, LiveTrackerPoint } from "../live-tracker/live-tracker.types";

function stableUnit(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 10_000) / 10_000;
}

function buildSimulatedRoute(seed: string): {
  route: LiveTrackerPoint[];
  pin: LiveTrackerPoint;
  userPin: LiveTrackerPoint;
  contractorPin: LiveTrackerPoint;
} {
  const x0 = 12 + stableUnit(`${seed}-x0`) * 70;
  const y0 = 12 + stableUnit(`${seed}-y0`) * 70;
  const x1 = 12 + stableUnit(`${seed}-x1`) * 70;
  const y1 = 12 + stableUnit(`${seed}-y1`) * 70;

  const steps = 24;
  const route: LiveTrackerPoint[] = [];
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    const wobble = Math.sin(t * Math.PI * 2) * 2;
    route.push({
      x: x0 + (x1 - x0) * t + wobble,
      y: y0 + (y1 - y0) * t - wobble,
    });
  }

  const userPin = route[0] ?? { x: x0, y: y0 };
  const pin = route[route.length - 1] ?? { x: x1, y: y1 };
  const contractorPin = route[Math.floor(route.length * 0.55)] ?? userPin;

  return { route, pin, userPin, contractorPin };
}

function mapRequestToTrackerState(request: UserRequestHistoryItem): LiveTrackerJobState {
  if (request.lifecycleStatus === "Completed" || request.status === "Completed") {
    return "Completed";
  }
  if (request.lifecycleStatus === "Assigned") {
    return "En route";
  }
  return "Incoming";
}

export function RequestsLiveTrackerOverlay({
  requestId,
  request,
  customerName,
}: {
  requestId: string | null;
  request?: UserRequestHistoryItem | null;
  customerName?: string;
}) {
  const isMapOpen = useRequestsStore((state) => state.isMapOpen);
  const closeMap = useRequestsStore((state) => state.closeMap);
  const ops = useRequestsStore((state) =>
    requestId ? state.requestOpsById[requestId] : undefined,
  );
  const monitoringState = ops?.monitoringState ?? "live";
  const setMonitoringState = useRequestsStore((state) => state.setMonitoringState);

  const job = useMemo<LiveTrackerJob | null>(() => {
    if (!requestId) {
      return null;
    }

    if (request) {
      const { route, pin, userPin, contractorPin } = buildSimulatedRoute(requestId);
      return {
        id: `sim-${requestId}`,
        requestId: requestId,
        userId: "live",
        customerName: customerName?.trim() || "Customer",
        request,
        serviceLabel: request.service || "Service",
        route,
        pin,
        userPin,
        contractorPin,
        progress:
          request.lifecycleStatus === "Completed"
            ? 1
            : request.lifecycleStatus === "Assigned"
              ? 0.65
              : 0.2,
        etaMinutes: 8,
        state: mapRequestToTrackerState(request),
        isEmergency: request.urgencyLabel === "Emergency",
      };
    }

    return liveTrackerJobs.find((item) => item.requestId === requestId) ?? null;
  }, [customerName, request, requestId]);

  const jobId = job?.id ?? null;

  useEffect(() => {
    if (!isMapOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMap();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeMap, isMapOpen]);

  return (
    <Dialog
      open={isMapOpen}
      onOpenChange={(open) => (open ? null : closeMap())}
    >
      <DialogContent className="left-0 top-0 z-[80] h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 bg-[#071B58] p-0 shadow-none duration-200 data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Live tracker</DialogTitle>
        <DialogDescription className="sr-only">
          Full-screen live tracker for the selected service request.
        </DialogDescription>
        <div className="relative h-full w-full">
          <button
            type="button"
            onClick={closeMap}
            className="absolute right-4 top-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Close live tracker"
          >
            <X className="h-5 w-5" />
          </button>
          {requestId ? (
            <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2 sm:left-6 sm:top-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                Live monitoring
              </span>
              {monitoringState === "paused" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMonitoringState(requestId, "live");
                    toast.success("Monitoring resumed", {
                      description: "Live tracker monitoring is active again.",
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#071B58] shadow-sm transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/40"
                  aria-label="Resume monitoring"
                >
                  <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Resume
                </button>
              ) : monitoringState === "lostSignal" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMonitoringState(requestId, "live");
                    toast.success("Signal restored", {
                      description: "Monitoring state updated back to live.",
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#FEF3F2] px-3 py-1 text-xs font-semibold text-[#B42318] shadow-sm transition hover:bg-[#FEE4E2] focus:outline-none focus:ring-2 focus:ring-white/40"
                  aria-label="Retry monitoring"
                >
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  Retry
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMonitoringState(requestId, "paused");
                    toast.success("Monitoring paused", {
                      description: "Live tracker monitoring has been paused.",
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label="Pause monitoring"
                >
                  <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Pause
                </button>
              )}
            </div>
          ) : null}
          <div className="absolute inset-0 p-4 sm:p-6">
            <LiveTrackerMap
              jobs={job ? [job] : []}
              selectedJobId={jobId}
              className="h-full rounded-[26px] border-0 bg-[#0B2E86]"
            />
          </div>
          {job ? (
            <div className="absolute bottom-4 left-4 right-4 z-20 sm:bottom-8 sm:left-8 sm:right-8">
              <LiveTrackerSummaryCard job={job} />
            </div>
          ) : (
            <div className="absolute inset-x-4 bottom-8 z-20 rounded-[18px] border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white/80 backdrop-blur sm:inset-x-8">
              Live tracker data is unavailable for this request.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
