import type {
  LiveTrackerJob,
  LiveTrackerPoint,
} from "./live-tracker.types";

export function clampProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}

function getDistanceBetweenPoints(pointA: LiveTrackerPoint, pointB: LiveTrackerPoint) {
  return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
}

export function getPointAlongRoute(route: LiveTrackerPoint[], progress: number) {
  if (route.length === 0) {
    return { x: 0, y: 0 };
  }

  if (route.length === 1) {
    return route[0];
  }

  const normalizedProgress = clampProgress(progress);
  const segmentLengths = route.slice(1).map((point, index) =>
    getDistanceBetweenPoints(route[index], point),
  );
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);
  const targetLength = totalLength * normalizedProgress;

  let traversedLength = 0;

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];

    if (traversedLength + segmentLength >= targetLength) {
      const segmentProgress = (targetLength - traversedLength) / segmentLength;
      const startPoint = route[index];
      const endPoint = route[index + 1];

      return {
        x: startPoint.x + (endPoint.x - startPoint.x) * segmentProgress,
        y: startPoint.y + (endPoint.y - startPoint.y) * segmentProgress,
      };
    }

    traversedLength += segmentLength;
  }

  return route[route.length - 1];
}

export function getLiveTrackerJobByRequestId(
  jobs: LiveTrackerJob[],
  requestId: string | null,
) {
  if (!requestId) {
    return null;
  }

  return jobs.find((job) => job.requestId === requestId) ?? null;
}

export function simulateLiveTrackerTick(
  jobs: LiveTrackerJob[],
  tickNumber: number,
): LiveTrackerJob[] {
  return jobs.map((job, index) => {
    if (job.state === "Completed") {
      return job;
    }

    const progressBoost = 0.05 + ((tickNumber + index) % 3) * 0.015;
    const nextProgress = clampProgress(job.progress + progressBoost);
    const nextEtaMinutes =
      nextProgress >= 1 ? 0 : Math.max(1, job.etaMinutes - 1);
    const nextState: LiveTrackerJob["state"] =
      nextProgress >= 1
        ? "Completed"
        : nextProgress > 0.7
          ? "Current"
          : nextProgress > 0.35
            ? "En route"
            : "Assigned";
    const nextRequestStatus: LiveTrackerJob["request"]["status"] =
      nextState === "Completed"
        ? "Past"
        : nextState === "Assigned"
          ? "Pending"
          : "Active";
    const nextLifecycleStatus: LiveTrackerJob["request"]["lifecycleStatus"] =
      nextState === "Completed"
        ? "Completed"
        : nextState === "Assigned"
          ? "Assigned"
          : "Current";

    return {
      ...job,
      progress: nextProgress,
      etaMinutes: nextEtaMinutes,
      state: nextState,
      request: {
        ...job.request,
        status: nextRequestStatus,
        lifecycleStatus: nextLifecycleStatus,
        etaLabel: nextEtaMinutes === 0 ? "Completed" : `${nextEtaMinutes}mins away`,
      },
    };
  });
}

export function prependIncomingJob(
  jobs: LiveTrackerJob[],
  incomingJob: LiveTrackerJob | null,
) {
  if (!incomingJob) {
    return jobs;
  }

  return [incomingJob, ...jobs];
}
