/**
 * Hook: useRealtimeJobTracking
 * 
 * Subscribes to Supabase Realtime on the `jobs` table for a specific job.
 * Returns the current job row and live status updates.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { supabase } from "@/lib/supabase/client";
import { supabaseJobs, type JobRow } from "@/lib/supabase/data";
import { createLogger } from "@/lib/logger";

const logger = createLogger("RealtimeJobTracking");

export type LiveJobState = {
  job: JobRow | null;
  isLive: boolean;
  isConnected: boolean;
  error: string | null;
};

export function useRealtimeJobTracking(jobId: string | null): LiveJobState {
  const [job, setJob] = useState<JobRow | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isActiveRef = useRef(true);

  // Fetch initial job data
  const fetchJob = useCallback(async (id: string) => {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      const result = await supabaseJobs.getById(id);
      if (result.ok === false) {
        logger.warn("Failed to fetch job for live tracker", { jobId: id, error: (result as { ok: false; message: string }).message });
        return;
      }
      if (isActiveRef.current) {
        setJob(result.data);
        setError(null);
      }
    } catch (err) {
      logger.error("Error fetching job for live tracker", err);
    }
  }, []);

  useEffect(() => {
    isActiveRef.current = true;

    if (!jobId || !isSupabaseConfigured() || !supabase) {
      setJob(null);
      setIsConnected(false);
      return;
    }

    // Fetch initial state
    void fetchJob(jobId);

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`live-tracker-job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          if (!isActiveRef.current) return;
          const updated = payload.new as JobRow;
          setJob(updated);
          logger.info("Live tracker: job updated via realtime", {
            jobId,
            status: updated.status,
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
          logger.error("Live tracker job subscription error", status);
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
  }, [fetchJob, jobId]);

  const isLive = isSupabaseConfigured() && Boolean(jobId);

  return { job, isLive, isConnected, error };
}