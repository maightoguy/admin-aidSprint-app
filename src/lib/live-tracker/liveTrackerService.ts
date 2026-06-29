/**
 * Live Tracker Service
 * 
 * Utility functions for the live tracker:
 * - Haversine distance calculation
 * - Job status to human-readable labels
 * - Coordinate mapping (lat/lng → SVG percentage space)
 */

export type LatLng = {
  lat: number;
  lng: number;
};

/**
 * Haversine formula — computes distance in km between two lat/lng points
 */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const haversine =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

/**
 * Estimate ETA in minutes based on distance and an assumed average speed
 */
export function estimateEtaMinutes(distanceKm: number, avgSpeedKmh = 30): number {
  if (distanceKm <= 0) return 0;
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
}

/**
 * Map job status to a human-readable label
 */
export function getJobStatusLabel(status: string): string {
  switch (status) {
    case "requested":
      return "Searching for contractor";
    case "broadcast":
      return "Searching for contractor";
    case "accepted":
      return "Contractor accepted";
    case "contractor_en_route":
      return "Contractor on the way";
    case "arrived":
      return "Contractor arrived";
    case "in_progress":
      return "Service in progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status.replace(/_/g, " ");
  }
}

/**
 * Check if a contractor's location is stale (> 5 minutes)
 */
export function isLocationStale(locationUpdatedAt: string | null): boolean {
  if (!locationUpdatedAt) return true;
  const updatedMs = new Date(locationUpdatedAt).getTime();
  if (Number.isNaN(updatedMs)) return true;
  return Date.now() - updatedMs > 5 * 60 * 1000;
}

/**
 * Format a distance value for display
 */
export function formatDistance(km: number): string {
  if (km < 0.1) return "< 0.1 km";
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Convert lat/lng to SVG percentage coordinates
 * Uses a simple linear mapping for the Lagos area
 * Bounding box: lat 6.42-6.62, lng 3.25-3.55 (rough Lagos bounds)
 */
/**
 * Check if coordinates are valid (non-null, within reasonable bounds)
 */
export function isValidLatLng(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  return true;
}