import { describe, expect, it } from "vitest";
import { incomingLiveTrackerJobs, liveTrackerJobs } from "./live-tracker.data";
import {
  getLiveTrackerJobByRequestId,
  getPointAlongRoute,
  prependIncomingJob,
  simulateLiveTrackerTick,
} from "./live-tracker.utils";

describe("live tracker utils", () => {
  it("finds a job by request id", () => {
    expect(getLiveTrackerJobByRequestId(liveTrackerJobs, "emery-request-1")?.id).toBe(
      "emery-request-1-job",
    );
    expect(getLiveTrackerJobByRequestId(liveTrackerJobs, "missing-request")).toBeNull();
  });

  it("calculates a point along a route", () => {
    const point = getPointAlongRoute(
      [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 100 },
      ],
      0.5,
    );

    expect(point.x).toBeGreaterThan(25);
    expect(point.x).toBeLessThan(80);
    expect(point.y).toBeGreaterThanOrEqual(0);
  });

  it("simulates a live tracker tick and can prepend a new emergency job", () => {
    const updatedJobs = simulateLiveTrackerTick(liveTrackerJobs, 2);
    const jobsWithIncoming = prependIncomingJob(updatedJobs, incomingLiveTrackerJobs[0]);

    expect(jobsWithIncoming.length).toBe(liveTrackerJobs.length + 1);
    expect(jobsWithIncoming[0].requestId).toBe("incoming-emergency-1");
    expect(jobsWithIncoming[1].progress).toBeGreaterThan(liveTrackerJobs[0].progress);
  });
});
