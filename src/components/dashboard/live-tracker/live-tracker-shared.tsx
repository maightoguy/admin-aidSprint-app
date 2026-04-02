import { MapPinned } from "lucide-react";
import { liveTrackerRoadLabels, liveTrackerRoadSegments } from "./live-tracker.data";
import { getPointAlongRoute } from "./live-tracker.utils";
import type { LiveTrackerJob } from "./live-tracker.types";

function LiveTrackerPin({
  label,
  position,
  selected,
  onClick,
}: {
  label: string;
  position: { x: number; y: number };
  selected: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="relative flex h-7 w-7 items-center justify-center">
        <span
          className={[
            "absolute inline-flex h-full w-full rounded-full bg-[#041133]/20",
            selected ? "animate-ping" : "opacity-0 group-hover:opacity-100",
          ].join(" ")}
        />
        <span
          className={[
            "relative inline-flex h-4 w-4 rounded-full border-[3px] border-white",
            selected ? "bg-[#041133]" : "bg-[#22C55E]",
          ].join(" ")}
        />
      </span>
      <span className="mt-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#0F172A] shadow-sm">
        {label}
      </span>
    </>
  );

  const commonClassName = [
    "group absolute flex -translate-x-1/2 -translate-y-full flex-col items-center",
    selected ? "z-20" : "z-10",
  ].join(" ");

  if (!onClick) {
    return (
      <div
        className={commonClassName}
        style={{ left: `${position.x}%`, top: `${position.y}%` }}
        aria-hidden="true"
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={commonClassName}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      aria-label={`Select ${label}`}
    >
      {content}
    </button>
  );
}

function LiveTrackerCarMarker({
  position,
}: {
  position: { x: number; y: number };
}) {
  return (
    <div
      className="absolute z-30 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_12px_22px_rgba(15,23,42,0.14)] transition-[left,top] duration-1000 ease-linear"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: 28,
        height: 28,
      }}
      aria-hidden="true"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3.5 16.5V11.2C3.5 10.7 3.7 10.22 4.06 9.87L6.6 7.33C6.95 6.97 7.44 6.76 7.95 6.76H16.05C16.56 6.76 17.05 6.97 17.4 7.33L19.94 9.87C20.3 10.22 20.5 10.7 20.5 11.2V16.5"
          stroke="#041133"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 16.5V18.2C6.5 18.64 6.86 19 7.3 19H8.2C8.64 19 9 18.64 9 18.2V16.5"
          stroke="#041133"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 16.5V18.2C15 18.64 15.36 19 15.8 19H16.7C17.14 19 17.5 18.64 17.5 18.2V16.5"
          stroke="#041133"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 12.5H17"
          stroke="#041133"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function LiveTrackerMap({
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
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null;
  const carPosition = selectedJob
    ? getPointAlongRoute(selectedJob.route, selectedJob.progress)
    : null;

  return (
    <div
      className={[
        "relative h-[520px] w-full overflow-hidden rounded-[20px] border border-[#D1D3D8] bg-[#F6F8FB]",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#F8FAFC_0%,#E5E7EB_55%,#CBD5E1_100%)]" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {liveTrackerRoadSegments.map((segment) => (
          <line
            key={segment.id}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            stroke="#CBD5E1"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        ))}
        {selectedJob ? (
          <polyline
            points={selectedJob.route
              .map((point) => `${point.x},${point.y}`)
              .join(" ")}
            fill="none"
            stroke="#041133"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
      {liveTrackerRoadLabels.map((label) => (
        <span
          key={label.id}
          className="absolute select-none text-[10px] font-semibold text-[#6B7280]"
          style={{
            left: `${label.x}%`,
            top: `${label.y}%`,
            transform: `translate(-50%, -50%) rotate(${label.rotation}deg)`,
          }}
          aria-hidden="true"
        >
          {label.label}
        </span>
      ))}
      {jobs.slice(0, 6).map((job) => (
        <LiveTrackerPin
          key={job.id}
          label={job.serviceLabel}
          position={job.pin}
          selected={job.id === selectedJobId}
          onClick={onSelectJob ? () => onSelectJob(job.id) : undefined}
        />
      ))}
      {selectedJob && carPosition ? <LiveTrackerCarMarker position={carPosition} /> : null}
    </div>
  );
}

export function LiveTrackerSummaryCard({
  job,
  className = "",
}: {
  job: LiveTrackerJob;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-[24px] border border-[#D1D3D8] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)]",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#667085]">
            Live request
          </p>
          <h2 className="mt-2 text-lg font-bold text-[#101828]">
            {job.serviceLabel}
          </h2>
          <p className="mt-1 text-sm text-[#667085]">{job.customerName}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-[#E9F9EF] px-3 py-1 text-xs font-semibold text-[#15803D]">
          {job.request.etaLabel}
        </span>
      </div>
      <div className="mt-4 rounded-[18px] border border-[#E6E7EB] bg-[#F8FAFC] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#101828]">Request summary</p>
          <p className="text-sm font-semibold text-[#041133]">
            {job.request.totalPayment}
          </p>
        </div>
        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-3.5 w-3.5 rounded-full border-[3px] border-[#D0D5DD] bg-[#041133]" />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#98A2B3]">
                Contractor location
              </p>
              <p className="mt-1 text-sm text-[#101828]">
                {job.request.contractorLocation}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center text-[#22C55E]">
              <MapPinned className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#98A2B3]">
                Request location
              </p>
              <p className="mt-1 text-sm text-[#101828]">{job.request.userLocation}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[16px] border border-[#EAECF0] bg-white px-3 py-3">
          <p className="text-xs text-[#98A2B3]">Request ID</p>
          <p className="mt-1 text-sm font-semibold text-[#101828]">
            {job.request.requestCode}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#EAECF0] bg-white px-3 py-3">
          <p className="text-xs text-[#98A2B3]">Service status</p>
          <p className="mt-1 text-sm font-semibold text-[#101828]">
            {job.request.lifecycleStatus}
          </p>
        </div>
      </div>
    </section>
  );
}
