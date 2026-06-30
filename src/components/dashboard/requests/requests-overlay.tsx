import { useEffect, useMemo } from "react";
import { AlertTriangle, ArrowLeft, PauseCircle, PlayCircle, Radio, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRequestsStore } from "./requests.store";
import { LiveTrackerSummarySheet } from "../live-tracker/LiveTrackerSummarySheet";
import { LiveTrackerLeafletMap } from "../live-tracker/LiveTrackerLeafletMap";
import { useRealtimeJobTracking } from "../live-tracker/useRealtimeJobTracking";
import { useRealtimeContractorLocation } from "../live-tracker/useRealtimeContractorLocation";
import {
  getJobStatusLabel,
  haversineDistance,
  estimateEtaMinutes,
  formatDistance,
  isLocationStale,
  isValidLatLng,
} from "@/lib/live-tracker/liveTrackerService";
import type { UserRequestHistoryItem } from "../user-details/user-details.types";
import type { LiveTrackerJob, LiveTrackerJobState } from "../live-tracker/live-tracker.types";
import { liveTrackerJobs } from "../live-tracker/live-tracker.data";

function mapLiveStatusToTrackerState(status: string): LiveTrackerJobState {
  switch (status) {
    case "completed":
      return "Completed";
    case "cancelled":
      return "Completed";
    case "arrived":
    case "in_progress":
      return "Current";
    case "accepted":
    case "contractor_en_route":
      return "En route";
    default:
      return "Incoming";
  }
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

  // Live hooks — only fire when map is open and we have an ID
  const { job: liveJob } = useRealtimeJobTracking(
    isMapOpen ? requestId : null,
  );
  const contractorId = liveJob?.contractor_id ?? null;
  const { contractor, isStale, isOffline } =
    useRealtimeContractorLocation(isMapOpen ? contractorId : null);

  // Build the tracker job from live data
  const job = useMemo<LiveTrackerJob | null>(() => {
    if (!requestId) return null;

    // Priority 1: Use live-job data with real coordinates
    if (liveJob && request) {
      const customerLat = liveJob.latitude ?? 0;
      const customerLng = liveJob.longitude ?? 0;
      const hasCustomerCoords = isValidLatLng(customerLat, customerLng);

      const contractorLat = contractor?.current_latitude ?? null;
      const contractorLng = contractor?.current_longitude ?? null;
      const hasContractorCoords = isValidLatLng(contractorLat, contractorLng);

      // Calculate distance
      let distanceKm = 0;
      let etaMinutes = 0;
      if (hasContractorCoords && hasCustomerCoords) {
        distanceKm = haversineDistance(
          { lat: contractorLat!, lng: contractorLng! },
          { lat: customerLat, lng: customerLng },
        );
        etaMinutes = estimateEtaMinutes(distanceKm);
      }

      const state = mapLiveStatusToTrackerState(liveJob.status);
      const progress =
        state === "Completed"
          ? 1
          : state === "Current"
            ? 0.8
            : state === "En route"
              ? 0.5
              : 0.1;

      const statusLabel = getJobStatusLabel(liveJob.status);
      const isStaleLocation =
        isLocationStale(contractor?.location_updated_at ?? null);

      const locationNote = isOffline
        ? "Contractor offline"
        : isStaleLocation
          ? "Location may be outdated"
          : !hasContractorCoords
            ? "Waiting for contractor location..."
            : contractor?.availability_status === "online"
              ? "Contractor tracked live"
              : "Waiting for contractor location...";

      const distanceLabel =
        distanceKm > 0 ? `${formatDistance(distanceKm)} away` : statusLabel;

      const liveRequestItem: UserRequestHistoryItem = {
        ...request,
        etaLabel: distanceLabel,
        lifecycleStatus:
          liveJob.status === "completed"
            ? "Completed"
            : liveJob.status === "cancelled"
              ? "Cancelled"
              : liveJob.status === "contractor_en_route" ||
                liveJob.status === "arrived" ||
                liveJob.status === "in_progress"
                ? "Current"
                : "Assigned",
        contractorLocation: locationNote,
        userLocation: liveJob.address || "Customer location",
      };

      return {
        id: `live-${requestId}`,
        requestId,
        userId: liveJob.user_id,
        customerName: customerName?.trim() || "Customer",
        request: liveRequestItem,
        serviceLabel: liveJob.service_type || request.service || "Service",
        route: [],
        pin: { x: 0, y: 0 },
        userPin: { x: 0, y: 0 },
        contractorPin: { x: 0, y: 0 },
        progress,
        etaMinutes,
        state,
        isEmergency: false,
        customerLat: hasCustomerCoords ? customerLat : undefined,
        customerLng: hasCustomerCoords ? customerLng : undefined,
        contractorLat: hasContractorCoords ? contractorLat! : undefined,
        contractorLng: hasContractorCoords ? contractorLng! : undefined,
      };
    }

    // Priority 2: Fall back to hardcoded data
    return liveTrackerJobs.find((item) => item.requestId === requestId) ?? null;
  }, [requestId, liveJob, request, customerName, contractor, isStale, isOffline]);

  const jobId = job?.id ?? null;

  // Intercept browser/Android back button to close the map instead of navigating away
  useEffect(() => {
    if (!isMapOpen) return;

    // Push a dummy state so the back button triggers popstate instead of navigating
    window.history.pushState({ liveTrackerOpen: true }, "");

    const handlePopState = () => {
      closeMap();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Clean up the dummy history entry when map closes
      if (window.history.state?.liveTrackerOpen) {
        window.history.back();
      }
    };
  }, [closeMap, isMapOpen]);

  useEffect(() => {
    if (!isMapOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMap();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeMap, isMapOpen]);

  return (
    <Dialog open={isMapOpen} onOpenChange={(open) => (open ? null : closeMap())}>
      <DialogContent className="left-0 top-0 z-[80] h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 bg-[#071B58] p-0 shadow-none duration-200 data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Live tracker</DialogTitle>
        <DialogDescription className="sr-only">
          Full-screen live tracker for the selected service request.
        </DialogDescription>
        <div className="relative h-full w-full">
          {/* Back button — prominent on mobile, visible on all screen sizes */}
          <button
            type="button"
            onClick={closeMap}
            className="absolute left-4 top-4 z-30 inline-flex h-11 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#071B58] shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/40 sm:left-6 sm:top-6"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Close button — top-right corner */}
          <button
            type="button"
            onClick={closeMap}
            className="absolute right-4 top-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white/30 sm:right-6 sm:top-6"
            aria-label="Close live tracker"
          >
            <X className="h-5 w-5" />
          </button>

          {requestId ? (
            <div className="absolute left-4 top-16 z-20 flex flex-wrap items-center gap-2 sm:left-6 sm:top-6 sm:ml-[120px]">
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
          {/* Full-screen map at z-0 */}
          <div className="absolute inset-0 z-0">
            <LiveTrackerLeafletMap
              jobs={job ? [job] : []}
              selectedJobId={jobId}
              className="h-full rounded-none border-0"
            />
          </div>
          {job ? (
            <LiveTrackerSummarySheet job={job} />
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