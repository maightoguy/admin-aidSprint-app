import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveTrackerJob } from "./live-tracker.types";

// Fix default marker icons with Leaflet + bundlers
// @ts-expect-error — Leaflet icon path fix for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const customerIcon = new L.DivIcon({
  className: "",
  html: `
    <div class="relative flex flex-col items-center">
      <div class="relative flex h-7 w-7 items-center justify-center">
        <span class="absolute inline-flex h-full w-full rounded-full bg-[#041133]/20" />
        <span class="relative inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-[#22C55E]" />
      </div>
      <span class="mt-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#0F172A] shadow-sm whitespace-nowrap">Customer</span>
    </div>
  `,
  iconSize: [56, 42],
  iconAnchor: [28, 42],
});

const activeCustomerIcon = new L.DivIcon({
  className: "",
  html: `
    <div class="relative flex flex-col items-center">
      <div class="relative flex h-7 w-7 items-center justify-center">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#041133]/20" />
        <span class="relative inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-[#041133]" />
      </div>
      <span class="mt-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#0F172A] shadow-sm whitespace-nowrap">Customer</span>
    </div>
  `,
  iconSize: [56, 42],
  iconAnchor: [28, 42],
});

function contractorIconHtml(label: string) {
  return `
    <div class="flex flex-col items-center">
      <div class="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[0_12px_22px_rgba(15,23,42,0.14)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.5 16.5V11.2C3.5 10.7 3.7 10.22 4.06 9.87L6.6 7.33C6.95 6.97 7.44 6.76 7.95 6.76H16.05C16.56 6.76 17.05 6.97 17.4 7.33L19.94 9.87C20.3 10.22 20.5 10.7 20.5 11.2V16.5" stroke="#041133" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.5 16.5V18.2C6.5 18.64 6.86 19 7.3 19H8.2C8.64 19 9 18.64 9 18.2V16.5" stroke="#041133" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 16.5V18.2C15 16.64 15.36 19 15.8 19H16.7C17.14 19 17.5 18.64 17.5 18.2V16.5" stroke="#041133" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 12.5H17" stroke="#041133" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span class="mt-1 rounded-full bg-[#041133]/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm whitespace-nowrap">${label}</span>
    </div>
  `;
}

function createContractorIcon(label: string): L.DivIcon {
  return new L.DivIcon({
    className: "",
    html: contractorIconHtml(label),
    iconSize: [70, 50],
    iconAnchor: [35, 50],
  });
}

/**
 * Inner component that uses the useMap() hook to auto-fit bounds
 */
function FitBoundsController({
  jobs,
  selectedJobId,
}: {
  jobs: LiveTrackerJob[];
  selectedJobId: string | null;
}) {
  const map = useMap();
  const prevBoundsRef = useRef<string>("");

  useEffect(() => {
    const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? jobs[0];
    if (!selectedJob) return;

    const points: L.LatLngExpression[] = [];

    if (
      selectedJob.customerLat != null &&
      selectedJob.customerLng != null &&
      Number.isFinite(selectedJob.customerLat) &&
      Number.isFinite(selectedJob.customerLng)
    ) {
      points.push([selectedJob.customerLat, selectedJob.customerLng]);
    }

    if (
      selectedJob.contractorLat != null &&
      selectedJob.contractorLng != null &&
      Number.isFinite(selectedJob.contractorLat) &&
      Number.isFinite(selectedJob.contractorLng)
    ) {
      points.push([selectedJob.contractorLat, selectedJob.contractorLng]);
    }

    if (points.length === 0) return;

    const bounds = L.latLngBounds(points);
    const boundsKey = bounds.toBBoxString();

    // Only refit if bounds actually changed
    if (boundsKey !== prevBoundsRef.current) {
      prevBoundsRef.current = boundsKey;
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
    }
  }, [jobs, selectedJobId, map]);

  return null;
}

export function LiveTrackerLeafletMap({
  jobs,
  selectedJobId,
  onSelectJob,
  className = "",
}: {
  jobs: LiveTrackerJob[];
  selectedJobId: string | null;
  onSelectJob?: (jobId: string) => void;
  className?: string;
}) {
  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? jobs[0];

  // Default center: Lagos, Nigeria
  const defaultCenter: L.LatLngExpression = [6.52, 3.38];

  // Memoize polyline positions
  const routePositions = useMemo<L.LatLngExpression[]>(() => {
    if (!selectedJob) return [];
    const points: L.LatLngExpression[] = [];

    if (
      selectedJob.contractorLat != null &&
      selectedJob.contractorLng != null &&
      Number.isFinite(selectedJob.contractorLat) &&
      Number.isFinite(selectedJob.contractorLng)
    ) {
      points.push([selectedJob.contractorLat, selectedJob.contractorLng]);
    }

    if (
      selectedJob.customerLat != null &&
      selectedJob.customerLng != null &&
      Number.isFinite(selectedJob.customerLat) &&
      Number.isFinite(selectedJob.customerLng)
    ) {
      points.push([selectedJob.customerLat, selectedJob.customerLng]);
    }

    return points;
  }, [selectedJob]);

  const hasContractorCoords =
    selectedJob &&
    selectedJob.contractorLat != null &&
    selectedJob.contractorLng != null &&
    Number.isFinite(selectedJob.contractorLat) &&
    Number.isFinite(selectedJob.contractorLng);

  const hasCustomerCoords =
    selectedJob &&
    selectedJob.customerLat != null &&
    selectedJob.customerLng != null &&
    Number.isFinite(selectedJob.customerLat) &&
    Number.isFinite(selectedJob.customerLng);

  const contractorIcon = useMemo(
    () => createContractorIcon(selectedJob?.serviceLabel || "Contractor"),
    [selectedJob?.serviceLabel],
  );

  return (
    <div
      className={[
        "relative h-[520px] w-full overflow-hidden rounded-[20px] border border-[#D1D3D8]",
        className,
      ].join(" ")}
    >
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Fit bounds when coords change */}
        <FitBoundsController jobs={jobs} selectedJobId={selectedJobId} />

        {/* Customer marker */}
        {hasCustomerCoords && selectedJob ? (
          <Marker
            position={[selectedJob.customerLat!, selectedJob.customerLng!]}
            icon={
              selectedJob.id === selectedJobId
                ? activeCustomerIcon
                : customerIcon
            }
            eventHandlers={
              onSelectJob
                ? {
                    click: () => onSelectJob(selectedJob.id),
                  }
                : undefined
            }
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{selectedJob.customerName}</p>
                <p className="text-xs text-gray-500">{selectedJob.serviceLabel}</p>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {/* Contractor marker */}
        {hasContractorCoords && selectedJob ? (
          <Marker
            position={[
              selectedJob.contractorLat!,
              selectedJob.contractorLng!,
            ]}
            icon={contractorIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Contractor</p>
                <p className="text-xs text-gray-500">
                  {selectedJob.request.etaLabel}
                </p>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {/* Route polyline */}
        {routePositions.length > 1 ? (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: "#041133",
              weight: 3,
              opacity: 0.8,
              dashArray: "10 6",
            }}
          />
        ) : null}
      </MapContainer>

      {/* Fallback if no coordinates available */}
      {!hasCustomerCoords && !hasContractorCoords ? (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[#F6F8FB]/90">
          <p className="text-sm font-medium text-[#667085]">
            Waiting for location data...
          </p>
        </div>
      ) : null}
    </div>
  );
}