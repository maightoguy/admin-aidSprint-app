/**
 * Hook: useRealtimeContractorLocation
 *
 * Subscribes to Supabase Realtime on the `contractors` table for a specific contractor.
 * Returns live location coordinates and availability status.
 */
import { useEffect, useState, useRef } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { supabase } from "@/lib/supabase/client";
import { supabaseContractors, type ContractorRow } from "@/lib/supabase/data";
import {
  isLocationStale,
  isValidLatLng,
} from "@/lib/live-tracker/liveTrackerService";
import { createLogger } from "@/lib/logger";

const logger = createLogger("RealtimeContractorLocation");

export type ContractorLocationState = {
  contractor: ContractorRow | null;
  /** Whether the contractor's location is stale (> 5 min) */
  isStale: boolean;
  /** Whether the contractor is offline */
  isOffline: boolean;
  hasValidLocation: boolean;
  isConnected: boolean;
  error: string | null;
};

export function useRealtimeContractorLocation(
  contractorId: string | null,
): ContractorLocationState {
  const [contractor, setContractor] = useState<ContractorRow | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    if (!contractorId || !isSupabaseConfigured() || !supabase) {
      setContractor(null);
      setIsConnected(false);
      return;
    }

    isActiveRef.current = true;

    // Fetch initial contractor data
    const fetchContractor = async () => {
      if (!isActiveRef.current) return;
      try {
        const result = await supabaseContractors.getById(contractorId);
        if (result.ok && isActiveRef.current) {
          setContractor(result.data);
          setError(null);
        } else {
          logger.warn("Failed to fetch contractor for live tracker", {
            contractorId,
            error: result.ok === false ? result.message : "Unknown",
          });
        }
      } catch (err) {
        logger.error("Error fetching contractor for live tracker", err);
      }
    };

    void fetchContractor();

    // Subscribe to realtime contractor location updates
    const channel = supabase
      .channel(`live-tracker-contractor-${contractorId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contractors",
          filter: `id=eq.${contractorId}`,
        },
        (payload) => {
          if (!isActiveRef.current) return;
          const updated = payload.new as ContractorRow;
          setContractor(updated);
          logger.info("Live tracker: contractor location updated via realtime", {
            contractorId,
            lat: updated.current_latitude,
            lng: updated.current_longitude,
          });
        },
      )
      .subscribe((status) => {
        if (!isActiveRef.current) return;

        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setError("Realtime connection lost. Retrying...");
          setIsConnected(false);
          logger.error("Live tracker contractor subscription error", status);
        } else if (status === "CLOSED") {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      isActiveRef.current = false;
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [contractorId]);

  // Compute derived state
  const hasValidLocation = isValidLatLng(
    contractor?.current_latitude,
    contractor?.current_longitude,
  );

  const isStale = isLocationStale(
    contractor?.location_updated_at ?? null,
  );

  const isOffline =
    contractor?.availability_status === "offline";

  return {
    contractor,
    isStale,
    isOffline,
    hasValidLocation,
    isConnected,
    error,
  };
}
