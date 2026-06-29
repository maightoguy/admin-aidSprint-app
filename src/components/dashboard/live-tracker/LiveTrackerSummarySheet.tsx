import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LiveTrackerSummaryCard } from "./live-tracker-shared";
import type { LiveTrackerJob } from "./live-tracker.types";

export function LiveTrackerSummarySheet({
  job,
}: {
  job: LiveTrackerJob;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Measure actual content height for animation
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [job, isExpanded]);

  const collapsedHeight = 60;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4 sm:px-6 sm:pb-6">
      <div
        className="mx-auto w-full max-w-[600px] overflow-hidden rounded-[22px] border border-[#D1D3D8] bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.10)] transition-all duration-300 ease-out"
        style={{
          height: isExpanded
            ? `${Math.max(contentHeight + collapsedHeight, 200)}px`
            : `${collapsedHeight}px`,
        }}
      >
        {/* Handle / toggle bar */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-3 hover:bg-[#F8FAFC] transition"
          aria-label={isExpanded ? "Collapse request details" : "Expand request details"}
        >
          <div className="flex items-center gap-3">
            {/* Drag handle */}
            <span className="block h-1 w-8 rounded-full bg-[#D0D5DD]" aria-hidden="true" />
            {!isExpanded ? (
              <span className="text-sm font-semibold text-[#101828]">
                Request Details
              </span>
            ) : null}
          </div>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#667085] transition hover:bg-[#F0F1F2]">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </span>
        </button>

        {/* Scrollable content (preserved styling from LiveTrackerSummaryCard) */}
        <div
          ref={contentRef}
          className="overflow-y-auto px-4 pb-4"
          style={{ maxHeight: isExpanded ? "55vh" : "0", opacity: isExpanded ? 1 : 0 }}
        >
          {/* Remove original card border/shadow since parent provides it */}
          <div className="[&>section]:rounded-none [&>section]:border-0 [&>section]:shadow-none [&>section]:p-0">
            <LiveTrackerSummaryCard job={job} className="border-0 shadow-none rounded-none bg-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}